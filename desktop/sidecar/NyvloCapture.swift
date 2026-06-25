// NyvloCapture.swift — Audio capture sidecar for the Nyvlo desktop app.
//
// Two capture backends:
//   1. Core Audio process-tap (macOS 14.4+) — only requires Microphone permission.
//      Uses CATapDescription + AudioHardwareCreateProcessTap combined with the
//      default input device via an aggregate device. No Screen Recording needed.
//   2. ScreenCaptureKit (macOS 13+) — fallback for older macOS. Requires the
//      Screen Recording permission for system audio capture.
//
// Communicates with the Electron parent via stdout (line-delimited JSON):
//   {"type":"started","sessionId":"..."}
//   {"type":"chunk","kind":"audio","sequence":N}
//   {"type":"chunk","kind":"screen","sequence":N}
//   {"type":"ended"}
//   {"type":"error","message":"..."}
//
// Listens on stdin for commands:
//   {"action":"stop"}

import Foundation
import AVFoundation
import CoreImage
import AppKit
import CoreAudio
import AudioToolbox

#if canImport(ScreenCaptureKit)
import ScreenCaptureKit
#endif

// MARK: - Entry point

@available(macOS 13.0, *)
@main
struct NyvloCapture {
    static func main() async {
        let args = parseArgs()
        guard let token = args["token"], let api = args["api"] else {
            log("error", ["message": "Usage: --token <jwt> --api <baseUrl> [--label <name>] [--audio-only]"])
            exit(2)
        }
        let label = args["label"] ?? "Capture session"
        let audioOnly = args["audio-only"] != nil

        do {
            let recorder = try await Recorder(apiBase: api, token: token, label: label, audioOnly: audioOnly)
            try await recorder.start()
            await recorder.waitUntilStopped()
        } catch {
            log("error", ["message": "\(error)"])
            exit(1)
        }
    }
}

// MARK: - Utilities

func parseArgs() -> [String: String] {
    var out: [String: String] = [:]
    var i = 1
    let argv = CommandLine.arguments
    while i < argv.count {
        let a = argv[i]
        if a.hasPrefix("--") {
            let key = String(a.dropFirst(2))
            if i + 1 < argv.count && !argv[i + 1].hasPrefix("--") {
                out[key] = argv[i + 1]; i += 2
            } else {
                out[key] = "1"; i += 1
            }
        } else { i += 1 }
    }
    return out
}

func log(_ type: String, _ payload: [String: Any]) {
    var dict = payload; dict["type"] = type
    if let data = try? JSONSerialization.data(withJSONObject: dict),
       let s = String(data: data, encoding: .utf8) {
        FileHandle.standardOutput.write(Data((s + "\n").utf8))
    }
}

// MARK: - Recorder (actor)

@available(macOS 13.0, *)
actor Recorder {
    let apiBase: String
    let token: String
    let label: String
    let audioOnly: Bool
    var sessionId: String?
    var audioSeq = 0
    var screenSeq = 0
    let stopSignal = AsyncStream<Void>.makeStream()

    // ScreenCaptureKit backend (fallback)
    var scStream: SCStream?
    var scOutput: SCKStreamOutput?

    // Core Audio backend (preferred on macOS 14.4+)
    var caTapID: AudioObjectID = kAudioObjectUnknown
    var caAggregateID: AudioObjectID = kAudioObjectUnknown
    var caAudioUnit: AudioUnit?
    var caAudioBuffer = Data()
    var caAudioBufferStart = Date()
    let caChunkSeconds: TimeInterval = 6.0

    init(apiBase: String, token: String, label: String, audioOnly: Bool) async throws {
        self.apiBase = apiBase
        self.token = token
        self.label = label
        self.audioOnly = audioOnly
    }

    func start() async throws {
        // 1. Create session on server
        let session = try await postJSON(path: "/api/public/ingest/session-start",
                                         body: ["label": label, "source": "desktop"])
        guard let sid = session["session"] as? [String: Any], let id = sid["id"] as? String else {
            throw NSError(domain: "Nyvlo", code: 1, userInfo: [NSLocalizedDescriptionKey: "Bad session response"])
        }
        sessionId = id
        log("started", ["sessionId": id])

        // 2. Choose capture backend
        if #available(macOS 14.4, *) {
            try await startCoreAudioCapture()
        } else {
            try await startScreenCaptureKitCapture()
        }

        // 3. Listen for stop from stdin
        Task.detached { await self.readStdin() }
    }

    // MARK: - Core Audio process-tap backend (macOS 14.4+)

    @available(macOS 14.4, *)
    func startCoreAudioCapture() async throws {
        // Create a process tap that captures all output audio (system audio).
        // CATapDescription with .stereoPanningProcessTap captures all processes.
        var tapDesc = CATapDescription(stereoMixdownOfProcesses: [])
        tapDesc.name = "NyvloSystemAudioTap"
        tapDesc.isMutingWhenTapped = false

        var tapID: AudioObjectID = kAudioObjectUnknown
        var status = AudioHardwareCreateProcessTap(&tapDesc, &tapID)
        guard status == noErr else {
            throw NSError(domain: "Nyvlo", code: 10,
                          userInfo: [NSLocalizedDescriptionKey: "AudioHardwareCreateProcessTap failed: \(status)"])
        }
        caTapID = tapID

        // Get the default input device (microphone)
        var defaultInput: AudioDeviceID = kAudioObjectUnknown
        var propAddr = AudioObjectPropertyAddress(
            mSelector: kAudioHardwarePropertyDefaultInputDevice,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        var propSize = UInt32(MemoryLayout<AudioDeviceID>.size)
        status = AudioObjectGetPropertyData(AudioObjectID(kAudioObjectSystemObject),
                                            &propAddr, 0, nil, &propSize, &defaultInput)
        guard status == noErr, defaultInput != kAudioObjectUnknown else {
            throw NSError(domain: "Nyvlo", code: 11,
                          userInfo: [NSLocalizedDescriptionKey: "Cannot get default input device"])
        }

        // Create aggregate device combining the process tap + mic
        let aggregateDesc: [String: Any] = [
            kAudioAggregateDeviceNameKey as String: "NyvloAggregate",
            kAudioAggregateDeviceUIDKey as String: "com.nyvlo.aggregate.\(UUID().uuidString)",
            kAudioAggregateDeviceIsPrivateKey as String: true,
            kAudioAggregateDeviceTapListKey as String: [
                [kAudioSubTapUIDKey as String: "\(tapID)"]
            ],
            kAudioAggregateDeviceSubDeviceListKey as String: [
                [kAudioSubDeviceUIDKey as String: getDeviceUID(defaultInput) ?? ""]
            ],
            kAudioAggregateDeviceTapAutoStartKey as String: true,
        ]

        var aggregateID: AudioDeviceID = kAudioObjectUnknown
        status = AudioHardwareCreateAggregateDevice(aggregateDesc as CFDictionary, &aggregateID)
        guard status == noErr else {
            throw NSError(domain: "Nyvlo", code: 12,
                          userInfo: [NSLocalizedDescriptionKey: "AudioHardwareCreateAggregateDevice failed: \(status)"])
        }
        caAggregateID = aggregateID

        // Set up an AudioUnit (HAL output) reading from the aggregate device
        var componentDesc = AudioComponentDescription(
            componentType: kAudioUnitType_Output,
            componentSubType: kAudioUnitSubType_HALOutput,
            componentManufacturer: kAudioUnitManufacturer_Apple,
            componentFlags: 0,
            componentFlagsMask: 0
        )
        guard let component = AudioComponentFindNext(nil, &componentDesc) else {
            throw NSError(domain: "Nyvlo", code: 13,
                          userInfo: [NSLocalizedDescriptionKey: "Cannot find HAL output component"])
        }
        var audioUnit: AudioUnit?
        status = AudioComponentInstanceNew(component, &audioUnit)
        guard status == noErr, let au = audioUnit else {
            throw NSError(domain: "Nyvlo", code: 14,
                          userInfo: [NSLocalizedDescriptionKey: "AudioComponentInstanceNew failed: \(status)"])
        }

        // Enable input on the audio unit
        var enableIO: UInt32 = 1
        status = AudioUnitSetProperty(au, kAudioOutputUnitProperty_EnableIO,
                                      kAudioUnitScope_Input, 1,
                                      &enableIO, UInt32(MemoryLayout<UInt32>.size))
        guard status == noErr else {
            throw NSError(domain: "Nyvlo", code: 15,
                          userInfo: [NSLocalizedDescriptionKey: "Cannot enable input IO: \(status)"])
        }

        // Disable output (we only record, not play)
        var disableIO: UInt32 = 0
        status = AudioUnitSetProperty(au, kAudioOutputUnitProperty_EnableIO,
                                      kAudioUnitScope_Output, 0,
                                      &disableIO, UInt32(MemoryLayout<UInt32>.size))
        guard status == noErr else {
            throw NSError(domain: "Nyvlo", code: 16,
                          userInfo: [NSLocalizedDescriptionKey: "Cannot disable output IO: \(status)"])
        }

        // Set the aggregate device as the input device
        var aggID = aggregateID
        status = AudioUnitSetProperty(au, kAudioOutputUnitProperty_CurrentDevice,
                                      kAudioUnitScope_Global, 0,
                                      &aggID, UInt32(MemoryLayout<AudioDeviceID>.size))
        guard status == noErr else {
            throw NSError(domain: "Nyvlo", code: 17,
                          userInfo: [NSLocalizedDescriptionKey: "Cannot set aggregate device: \(status)"])
        }

        // Set desired format: 16kHz mono 16-bit integer (PCM)
        var desiredFormat = AudioStreamBasicDescription(
            mSampleRate: 16000,
            mFormatID: kAudioFormatLinearPCM,
            mFormatFlags: kAudioFormatFlagIsSignedInteger | kAudioFormatFlagIsPacked,
            mBytesPerPacket: 2,
            mFramesPerPacket: 1,
            mBytesPerFrame: 2,
            mChannelsPerFrame: 1,
            mBitsPerChannel: 16,
            mReserved: 0
        )
        status = AudioUnitSetProperty(au, kAudioUnitProperty_StreamFormat,
                                      kAudioUnitScope_Output, 1,
                                      &desiredFormat, UInt32(MemoryLayout<AudioStreamBasicDescription>.size))
        guard status == noErr else {
            throw NSError(domain: "Nyvlo", code: 18,
                          userInfo: [NSLocalizedDescriptionKey: "Cannot set stream format: \(status)"])
        }

        // Set render callback
        let recorderPtr = Unmanaged.passUnretained(self).toOpaque()
        var callbackStruct = AURenderCallbackStruct(
            inputProc: coreAudioInputCallback,
            inputProcRefCon: recorderPtr
        )
        status = AudioUnitSetProperty(au, kAudioOutputUnitProperty_SetInputCallback,
                                      kAudioUnitScope_Global, 0,
                                      &callbackStruct, UInt32(MemoryLayout<AURenderCallbackStruct>.size))
        guard status == noErr else {
            throw NSError(domain: "Nyvlo", code: 19,
                          userInfo: [NSLocalizedDescriptionKey: "Cannot set input callback: \(status)"])
        }

        status = AudioUnitInitialize(au)
        guard status == noErr else {
            throw NSError(domain: "Nyvlo", code: 20,
                          userInfo: [NSLocalizedDescriptionKey: "AudioUnitInitialize failed: \(status)"])
        }

        status = AudioOutputUnitStart(au)
        guard status == noErr else {
            throw NSError(domain: "Nyvlo", code: 21,
                          userInfo: [NSLocalizedDescriptionKey: "AudioOutputUnitStart failed: \(status)"])
        }

        caAudioUnit = au
        caAudioBufferStart = Date()
    }

    nonisolated func handleCoreAudioBuffer(_ data: Data) {
        Task { await self.appendCoreAudioData(data) }
    }

    func appendCoreAudioData(_ data: Data) {
        caAudioBuffer.append(data)
        if Date().timeIntervalSince(caAudioBufferStart) >= caChunkSeconds {
            let pcm = caAudioBuffer
            let started = caAudioBufferStart
            caAudioBuffer.removeAll(keepingCapacity: true)
            caAudioBufferStart = Date()
            let wav = makeWavFromPcm16(pcm: pcm, sampleRate: 16_000, channels: 1)
            let durationMs = Int(Date().timeIntervalSince(started) * 1000)
            Task { await self.uploadAudio(wavData: wav, durationMs: durationMs) }
        }
    }

    func getDeviceUID(_ deviceID: AudioDeviceID) -> String? {
        var propAddr = AudioObjectPropertyAddress(
            mSelector: kAudioDevicePropertyDeviceUID,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        var uid: CFString = "" as CFString
        var propSize = UInt32(MemoryLayout<CFString>.size)
        let status = AudioObjectGetPropertyData(deviceID, &propAddr, 0, nil, &propSize, &uid)
        return status == noErr ? uid as String : nil
    }

    // MARK: - ScreenCaptureKit fallback (macOS 13+)

    func startScreenCaptureKitCapture() async throws {
        let content = try await SCShareableContent.excludingDesktopWindows(false, onScreenWindowsOnly: true)
        guard let display = content.displays.first else {
            throw NSError(domain: "Nyvlo", code: 2, userInfo: [NSLocalizedDescriptionKey: "No display"])
        }
        let filter = SCContentFilter(display: display, excludingApplications: [], exceptingWindows: [])
        let config = SCStreamConfiguration()
        config.capturesAudio = true
        config.excludesCurrentProcessAudio = true
        config.sampleRate = 16_000
        config.channelCount = 1
        config.width = 1280
        config.height = 800
        config.minimumFrameInterval = CMTime(value: 1, timescale: 1)
        config.queueDepth = 6

        let stream = SCStream(filter: filter, configuration: config, delegate: nil)
        let output = SCKStreamOutput(parent: self)
        try stream.addStreamOutput(output, type: .audio, sampleHandlerQueue: .global(qos: .userInitiated))
        if !audioOnly {
            try stream.addStreamOutput(output, type: .screen, sampleHandlerQueue: .global(qos: .userInitiated))
        }
        try await stream.startCapture()
        self.scStream = stream
        self.scOutput = output
    }

    // MARK: - Stop

    func readStdin() async {
        let h = FileHandle.standardInput
        while let line = try? h.readLine() {
            if line.contains("\"stop\"") { await self.stop(); break }
        }
    }

    func stop() async {
        // Stop Core Audio
        if let au = caAudioUnit {
            AudioOutputUnitStop(au)
            AudioUnitUninitialize(au)
            AudioComponentInstanceDispose(au)
            caAudioUnit = nil
        }
        if caAggregateID != kAudioObjectUnknown {
            AudioHardwareDestroyAggregateDevice(caAggregateID)
            caAggregateID = kAudioObjectUnknown
        }
        if caTapID != kAudioObjectUnknown {
            AudioHardwareDestroyProcessTap(caTapID)
            caTapID = kAudioObjectUnknown
        }
        // Flush remaining Core Audio buffer
        if !caAudioBuffer.isEmpty {
            let pcm = caAudioBuffer
            let started = caAudioBufferStart
            caAudioBuffer.removeAll()
            let wav = makeWavFromPcm16(pcm: pcm, sampleRate: 16_000, channels: 1)
            let durationMs = Int(Date().timeIntervalSince(started) * 1000)
            await uploadAudio(wavData: wav, durationMs: durationMs)
        }

        // Stop ScreenCaptureKit
        if let stream = scStream {
            try? await stream.stopCapture()
            scStream = nil
        }

        // End session on server
        if let sid = sessionId {
            _ = try? await postJSON(path: "/api/public/ingest/session-end", body: ["sessionId": sid])
        }
        log("ended", [:])
        stopSignal.continuation.finish()
    }

    func waitUntilStopped() async {
        for await _ in stopSignal.stream {}
    }

    // MARK: - Upload helpers

    func uploadAudio(wavData: Data, durationMs: Int) async {
        guard let sid = sessionId else { return }
        audioSeq += 1
        let seq = audioSeq
        let fields: [String: String] = [
            "sessionId": sid,
            "sequence": "\(seq)",
            "startedAt": ISO8601DateFormatter().string(from: Date()),
            "sourceChannel": "mixed",
            "durationMs": "\(durationMs)",
        ]
        do {
            _ = try await postMultipart(path: "/api/public/ingest/audio-chunk",
                                        fields: fields,
                                        fileField: "file", fileName: "chunk-\(seq).wav",
                                        fileData: wavData, mime: "audio/wav")
            log("chunk", ["kind": "audio", "sequence": seq])
        } catch {
            log("error", ["message": "audio upload failed: \(error)"])
        }
    }

    func uploadScreen(jpegData: Data, app: String?, window: String?) async {
        guard let sid = sessionId else { return }
        screenSeq += 1
        let seq = screenSeq
        var fields: [String: String] = [
            "sessionId": sid,
            "sequence": "\(seq)",
            "capturedAt": ISO8601DateFormatter().string(from: Date()),
        ]
        if let a = app { fields["appName"] = a }
        if let w = window { fields["windowTitle"] = w }
        do {
            _ = try await postMultipart(path: "/api/public/ingest/screen-frame",
                                        fields: fields,
                                        fileField: "file", fileName: "frame-\(seq).jpg",
                                        fileData: jpegData, mime: "image/jpeg")
            log("chunk", ["kind": "screen", "sequence": seq])
        } catch {
            log("error", ["message": "screen upload failed: \(error)"])
        }
    }

    // MARK: - HTTP

    func postJSON(path: String, body: [String: Any]) async throws -> [String: Any] {
        var req = URLRequest(url: URL(string: apiBase + path)!)
        req.httpMethod = "POST"
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw NSError(domain: "Nyvlo", code: 3,
                          userInfo: [NSLocalizedDescriptionKey: "\(path) failed: \(String(data: data, encoding: .utf8) ?? "")"])
        }
        return (try? JSONSerialization.jsonObject(with: data) as? [String: Any]) ?? [:]
    }

    func postMultipart(path: String, fields: [String: String], fileField: String,
                       fileName: String, fileData: Data, mime: String) async throws -> [String: Any] {
        let boundary = "Boundary-\(UUID().uuidString)"
        var body = Data()
        for (k, v) in fields {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"\(k)\"\r\n\r\n\(v)\r\n".data(using: .utf8)!)
        }
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"\(fileField)\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mime)\r\n\r\n".data(using: .utf8)!)
        body.append(fileData)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)

        var req = URLRequest(url: URL(string: apiBase + path)!)
        req.httpMethod = "POST"
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        req.httpBody = body
        let (data, resp) = try await URLSession.shared.upload(for: req, from: body)
        guard let http = resp as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw NSError(domain: "Nyvlo", code: 4,
                          userInfo: [NSLocalizedDescriptionKey: "upload \(path) failed: \(String(data: data, encoding: .utf8) ?? "")"])
        }
        return (try? JSONSerialization.jsonObject(with: data) as? [String: Any]) ?? [:]
    }
}

// MARK: - Core Audio render callback (C function)

@available(macOS 13.0, *)
private func coreAudioInputCallback(
    inRefCon: UnsafeMutableRawPointer,
    ioActionFlags: UnsafeMutablePointer<AudioUnitRenderActionFlags>,
    inTimeStamp: UnsafePointer<AudioTimeStamp>,
    inBusNumber: UInt32,
    inNumberFrames: UInt32,
    ioData: UnsafeMutablePointer<AudioBufferList>?
) -> OSStatus {
    let recorder = Unmanaged<Recorder>.fromOpaque(inRefCon).takeUnretainedValue()

    // Allocate buffer for the rendered audio
    let bytesPerFrame: UInt32 = 2 // 16-bit mono
    let bufferSize = inNumberFrames * bytesPerFrame
    let audioData = UnsafeMutablePointer<UInt8>.allocate(capacity: Int(bufferSize))
    defer { audioData.deallocate() }

    var bufferList = AudioBufferList(
        mNumberBuffers: 1,
        mBuffers: AudioBuffer(
            mNumberChannels: 1,
            mDataByteSize: bufferSize,
            mData: audioData
        )
    )

    // Get the audio unit from the recorder (we stored it)
    // We need to render from the input bus
    guard let au = recorder.caAudioUnit else { return noErr }
    let status = AudioUnitRender(au, ioActionFlags, inTimeStamp, inBusNumber, inNumberFrames, &bufferList)
    guard status == noErr else { return status }

    let data = Data(bytes: audioData, count: Int(bufferList.mBuffers.mDataByteSize))
    recorder.handleCoreAudioBuffer(data)
    return noErr
}

// MARK: - ScreenCaptureKit stream output (fallback)

@available(macOS 13.0, *)
class SCKStreamOutput: NSObject, SCStreamOutput {
    weak var parent: Recorder?
    var audioBuffer = Data()
    var audioBufferStart = Date()
    var lastScreenAt = Date.distantPast
    let chunkSeconds: TimeInterval = 6.0
    let screenIntervalSeconds: TimeInterval = 10.0

    init(parent: Recorder) { self.parent = parent }

    func stream(_ stream: SCStream, didOutputSampleBuffer sampleBuffer: CMSampleBuffer, of type: SCStreamOutputType) {
        switch type {
        case .audio:
            handleAudio(sampleBuffer)
        case .screen:
            handleScreen(sampleBuffer)
        @unknown default: break
        }
    }

    func handleAudio(_ buf: CMSampleBuffer) {
        guard CMSampleBufferDataIsReady(buf) else { return }
        guard let blockBuffer = CMSampleBufferGetDataBuffer(buf) else { return }
        var length = 0
        var dataPointer: UnsafeMutablePointer<Int8>?
        CMBlockBufferGetDataPointer(blockBuffer, atOffset: 0, lengthAtOffsetOut: nil,
                                    totalLengthOut: &length, dataPointerOut: &dataPointer)
        if let p = dataPointer, length > 0 {
            audioBuffer.append(Data(bytes: p, count: length))
        }
        if Date().timeIntervalSince(audioBufferStart) >= chunkSeconds {
            let pcm = audioBuffer
            let started = audioBufferStart
            audioBuffer.removeAll(keepingCapacity: true)
            audioBufferStart = Date()
            let wav = makeWavFromPcm16(pcm: pcm, sampleRate: 16_000, channels: 1)
            let durationMs = Int(Date().timeIntervalSince(started) * 1000)
            Task { [weak self] in await self?.parent?.uploadAudio(wavData: wav, durationMs: durationMs) }
        }
    }

    func handleScreen(_ buf: CMSampleBuffer) {
        let now = Date()
        if now.timeIntervalSince(lastScreenAt) < screenIntervalSeconds { return }
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(buf) else { return }
        lastScreenAt = now
        let ci = CIImage(cvPixelBuffer: pixelBuffer)
        let ctx = CIContext()
        guard let cg = ctx.createCGImage(ci, from: ci.extent) else { return }
        let rep = NSBitmapImageRep(cgImage: cg)
        guard let jpeg = rep.representation(using: .jpeg, properties: [.compressionFactor: 0.6]) else { return }
        let app = NSWorkspace.shared.frontmostApplication?.localizedName
        Task { [weak self] in await self?.parent?.uploadScreen(jpegData: jpeg, app: app, window: nil) }
    }
}

// MARK: - WAV encoder

func makeWavFromPcm16(pcm: Data, sampleRate: Int, channels: Int) -> Data {
    var d = Data()
    let byteRate = sampleRate * channels * 2
    let dataSize = UInt32(pcm.count)
    let chunkSize = 36 + dataSize
    d.append("RIFF".data(using: .ascii)!)
    d.append(uint32LE(chunkSize))
    d.append("WAVE".data(using: .ascii)!)
    d.append("fmt ".data(using: .ascii)!)
    d.append(uint32LE(16))
    d.append(uint16LE(1))
    d.append(uint16LE(UInt16(channels)))
    d.append(uint32LE(UInt32(sampleRate)))
    d.append(uint32LE(UInt32(byteRate)))
    d.append(uint16LE(UInt16(channels * 2)))
    d.append(uint16LE(16))
    d.append("data".data(using: .ascii)!)
    d.append(uint32LE(dataSize))
    d.append(pcm)
    return d
}
func uint16LE(_ v: UInt16) -> Data { withUnsafeBytes(of: v.littleEndian) { Data($0) } }
func uint32LE(_ v: UInt32) -> Data { withUnsafeBytes(of: v.littleEndian) { Data($0) } }

// MARK: - FileHandle readline

extension FileHandle {
    func readLine() throws -> String? {
        var buf = Data()
        while true {
            let b = self.availableData
            if b.isEmpty { return buf.isEmpty ? nil : String(data: buf, encoding: .utf8) }
            buf.append(b)
            if let s = String(data: buf, encoding: .utf8), s.contains("\n") {
                return s.trimmingCharacters(in: .whitespacesAndNewlines)
            }
        }
    }
}
