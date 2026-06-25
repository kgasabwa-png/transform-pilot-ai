// NyvloCapture.swift — sidecar for the Nyvlo desktop app.
// Captures system audio + mic and POSTs chunks to the Nyvlo ingestion API.
//
// macOS 14.4+: Core Audio process-tap API (no Screen Recording permission).
// macOS 13.x:  ScreenCaptureKit fallback (requires Screen Recording).
//
// Compile:  swift build -c release
// Run:      ./NyvloCapture --token <JWT> --api <baseUrl> --label "Standup"
//
// Stdout protocol (line-delimited JSON):
//   {"type":"started","sessionId":"..."}
//   {"type":"chunk","kind":"audio"|"screen","sequence":N}
//   {"type":"ended"}
//   {"type":"error","message":"..."}
//
// Stdin commands:
//   {"action":"stop"}

import Foundation
import AVFoundation
import CoreAudio
import AudioToolbox
import AppKit

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

// MARK: - Arg parser & logging

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

// MARK: - Recorder actor

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

    // ScreenCaptureKit state (fallback path)
    var scStream: SCStream?
    var scOutput: StreamOutput?

    // Core Audio process-tap state (macOS 14.4+ path)
    var tapAUID: AudioObjectID = kAudioObjectUnknown
    var aggregateID: AudioObjectID = kAudioObjectUnknown
    var audioUnit: AudioUnit?
    var tapAudioBuffer = Data()
    var tapAudioBufferStart = Date()

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

        // 2. Pick capture backend
        if #available(macOS 14.4, *) {
            try await startCoreAudioTap()
        } else {
            try await startScreenCaptureKit()
        }

        // 3. Listen for stop from stdin
        Task.detached { await self.readStdin() }
    }

    // MARK: - Core Audio process-tap path (macOS 14.4+)
    //
    // Uses CATapDescription + AudioHardwareCreateProcessTap to tap all
    // system output, then creates an aggregate device mixing the tap with
    // the default mic input. Requires only NSMicrophoneUsageDescription —
    // no Screen Recording permission.

    @available(macOS 14.4, *)
    func startCoreAudioTap() async throws {
        // --- 1. Create a process tap on all output (system audio) --------
        var tapDesc = CATapDescription(stereoMixdownOfProcesses: [])
        tapDesc.uuid = UUID()
        tapDesc.name = "NyvloSystemTap"
        // Mono 16-bit is what our WAV encoder/server expect
        tapDesc.mono = true

        var tapID: AudioObjectID = kAudioObjectUnknown
        let tapStatus = AudioHardwareCreateProcessTap(&tapDesc, &tapID)
        guard tapStatus == noErr else {
            throw NSError(domain: "Nyvlo", code: 10,
                          userInfo: [NSLocalizedDescriptionKey: "AudioHardwareCreateProcessTap failed: \(tapStatus)"])
        }
        self.tapAUID = tapID

        // --- 2. Find the default input (mic) device ----------------------
        var defaultInputID: AudioDeviceID = kAudioObjectUnknown
        var propAddr = AudioObjectPropertyAddress(
            mSelector: kAudioHardwarePropertyDefaultInputDevice,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        var propSize = UInt32(MemoryLayout<AudioDeviceID>.size)
        AudioObjectGetPropertyData(AudioObjectID(kAudioObjectSystemObject),
                                   &propAddr, 0, nil, &propSize, &defaultInputID)

        // --- 3. Build aggregate device mixing tap + mic ------------------
        let aggUID = "com.nyvlo.aggregate.\(UUID().uuidString)"
        let subDevices: [[String: Any]] = [
            [kAudioSubDeviceUIDKey as String: "\(tapID)",
             kAudioSubDeviceDriftCompensationKey as String: 0],
        ]

        // We add the mic UID as the second sub-device
        var micUID: CFString = "" as CFString
        var micPropAddr = AudioObjectPropertyAddress(
            mSelector: kAudioDevicePropertyDeviceUID,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        var uidSize = UInt32(MemoryLayout<CFString>.size)
        AudioObjectGetPropertyData(defaultInputID, &micPropAddr, 0, nil, &uidSize, &micUID)
        let micUIDStr = micUID as String

        let subDevicesWithMic: [[String: Any]] = subDevices + [
            [kAudioSubDeviceUIDKey as String: micUIDStr,
             kAudioSubDeviceDriftCompensationKey as String: 1],
        ]

        let aggDesc: [String: Any] = [
            kAudioAggregateDeviceUIDKey as String: aggUID,
            kAudioAggregateDeviceNameKey as String: "Nyvlo Capture Mix",
            kAudioAggregateDeviceIsPrivateKey as String: 1,
            kAudioAggregateDeviceSubDeviceListKey as String: subDevicesWithMic,
            kAudioAggregateDeviceTapListKey as String: [
                [kAudioSubTapUIDKey as String: "\(tapID)"]
            ],
            kAudioAggregateDeviceTapAutoStartKey as String: 1,
        ]

        var aggregateDeviceID: AudioDeviceID = kAudioObjectUnknown
        let aggStatus = AudioHardwareCreateAggregateDevice(aggDesc as CFDictionary, &aggregateDeviceID)
        guard aggStatus == noErr else {
            throw NSError(domain: "Nyvlo", code: 11,
                          userInfo: [NSLocalizedDescriptionKey: "AudioHardwareCreateAggregateDevice failed: \(aggStatus)"])
        }
        self.aggregateID = aggregateDeviceID

        // --- 4. Set up an IO AudioUnit to pull mixed audio ---------------
        var auDesc = AudioComponentDescription(
            componentType: kAudioUnitType_Output,
            componentSubType: kAudioUnitSubType_HALOutput,
            componentManufacturer: kAudioUnitManufacturer_Apple,
            componentFlags: 0,
            componentFlagsMask: 0
        )
        guard let comp = AudioComponentFindNext(nil, &auDesc) else {
            throw NSError(domain: "Nyvlo", code: 12,
                          userInfo: [NSLocalizedDescriptionKey: "AudioComponentFindNext failed"])
        }

        var unit: AudioUnit?
        AudioComponentInstanceNew(comp, &unit)
        guard let au = unit else {
            throw NSError(domain: "Nyvlo", code: 13,
                          userInfo: [NSLocalizedDescriptionKey: "AudioComponentInstanceNew failed"])
        }
        self.audioUnit = au

        // Enable input, disable output
        var enableIO: UInt32 = 1
        AudioUnitSetProperty(au, kAudioOutputUnitProperty_EnableIO,
                             kAudioUnitScope_Input, 1, &enableIO, UInt32(MemoryLayout<UInt32>.size))
        var disableIO: UInt32 = 0
        AudioUnitSetProperty(au, kAudioOutputUnitProperty_EnableIO,
                             kAudioUnitScope_Output, 0, &disableIO, UInt32(MemoryLayout<UInt32>.size))

        // Point at our aggregate device
        var aggDevID = aggregateDeviceID
        AudioUnitSetProperty(au, kAudioOutputUnitProperty_CurrentDevice,
                             kAudioUnitScope_Global, 0, &aggDevID, UInt32(MemoryLayout<AudioDeviceID>.size))

        // Set the output format of bus 1 (input side) to 16kHz mono Int16
        var streamFmt = AudioStreamBasicDescription(
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
        AudioUnitSetProperty(au, kAudioUnitProperty_StreamFormat,
                             kAudioUnitScope_Output, 1, &streamFmt,
                             UInt32(MemoryLayout<AudioStreamBasicDescription>.size))

        // Install input callback
        let recorderPtr = Unmanaged.passUnretained(self).toOpaque()
        var inputCb = AURenderCallbackStruct(
            inputProc: coreAudioInputCallback,
            inputProcRefCon: recorderPtr
        )
        AudioUnitSetProperty(au, kAudioOutputUnitProperty_SetInputCallback,
                             kAudioUnitScope_Global, 0, &inputCb,
                             UInt32(MemoryLayout<AURenderCallbackStruct>.size))

        try checkOSStatus(AudioUnitInitialize(au), "AudioUnitInitialize")
        try checkOSStatus(AudioOutputUnitStart(au), "AudioOutputUnitStart")

        // Reset chunk timer so the first chunk measures from capture start,
        // not from actor creation (which may be seconds earlier due to the
        // session-start API call).
        tapAudioBufferStart = Date()
    }

    nonisolated func handleTapBuffer(_ pcmData: Data) {
        Task { await self.appendTapAudio(pcmData) }
    }

    func appendTapAudio(_ pcmData: Data) {
        tapAudioBuffer.append(pcmData)
        if Date().timeIntervalSince(tapAudioBufferStart) >= 6.0 {
            let pcm = tapAudioBuffer
            let started = tapAudioBufferStart
            tapAudioBuffer.removeAll(keepingCapacity: true)
            tapAudioBufferStart = Date()
            let wav = makeWavFromPcm16(pcm: pcm, sampleRate: 16_000, channels: 1)
            let durationMs = Int(Date().timeIntervalSince(started) * 1000)
            Task { await self.uploadAudio(wavData: wav, durationMs: durationMs) }
        }
    }

    func stopCoreAudioTap() {
        if let au = audioUnit {
            AudioOutputUnitStop(au)
            AudioUnitUninitialize(au)
            AudioComponentInstanceDispose(au)
            audioUnit = nil
        }
        if aggregateID != kAudioObjectUnknown {
            AudioHardwareDestroyAggregateDevice(aggregateID)
            aggregateID = kAudioObjectUnknown
        }
        if tapAUID != kAudioObjectUnknown {
            AudioHardwareDestroyProcessTap(tapAUID)
            tapAUID = kAudioObjectUnknown
        }
        // Flush remaining audio
        if !tapAudioBuffer.isEmpty {
            let pcm = tapAudioBuffer
            let started = tapAudioBufferStart
            tapAudioBuffer.removeAll()
            let wav = makeWavFromPcm16(pcm: pcm, sampleRate: 16_000, channels: 1)
            let durationMs = Int(Date().timeIntervalSince(started) * 1000)
            Task { await self.uploadAudio(wavData: wav, durationMs: durationMs) }
        }
    }

    // MARK: - ScreenCaptureKit fallback (macOS 13.x)

    func startScreenCaptureKit() async throws {
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
        let output = StreamOutput(parent: self)
        try stream.addStreamOutput(output, type: .audio, sampleHandlerQueue: .global(qos: .userInitiated))
        if !audioOnly {
            try stream.addStreamOutput(output, type: .screen, sampleHandlerQueue: .global(qos: .userInitiated))
        }
        try await stream.startCapture()
        self.scStream = stream
        self.scOutput = output
    }

    // MARK: - Stdin listener

    func readStdin() async {
        let h = FileHandle.standardInput
        while let line = try? h.readLine() {
            if line.contains("\"stop\"") { await self.stop(); break }
        }
    }

    // MARK: - Stop

    func stop() async {
        // Stop whichever backend is active
        if let stream = scStream {
            try? await stream.stopCapture()
            scStream = nil
        }
        stopCoreAudioTap()

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

// MARK: - Core Audio input callback (C function, not actor-isolated)

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

    // Allocate a buffer to render into
    let byteSize = Int(inNumberFrames) * 2 // 16-bit mono = 2 bytes/frame
    let rawBuf = UnsafeMutablePointer<UInt8>.allocate(capacity: byteSize)
    defer { rawBuf.deallocate() }

    var bufferList = AudioBufferList(
        mNumberBuffers: 1,
        mBuffers: AudioBuffer(
            mNumberChannels: 1,
            mDataByteSize: UInt32(byteSize),
            mData: UnsafeMutableRawPointer(rawBuf)
        )
    )

    let status = AudioUnitRender(recorder.audioUnit!, ioActionFlags, inTimeStamp, inBusNumber, inNumberFrames, &bufferList)
    guard status == noErr else { return status }

    let renderedSize = Int(bufferList.mBuffers.mDataByteSize)
    let pcmData = Data(bytes: rawBuf, count: renderedSize)
    recorder.handleTapBuffer(pcmData)
    return noErr
}

// MARK: - ScreenCaptureKit stream output (fallback)

@available(macOS 13.0, *)
class StreamOutput: NSObject, SCStreamOutput {
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

// MARK: - WAV encoder (mono, signed 16-bit little-endian)

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

// MARK: - Helpers

func checkOSStatus(_ status: OSStatus, _ label: String) throws {
    guard status == noErr else {
        throw NSError(domain: "Nyvlo", code: Int(status),
                      userInfo: [NSLocalizedDescriptionKey: "\(label) failed: \(status)"])
    }
}

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
