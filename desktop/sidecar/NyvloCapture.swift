// NyvloCapture.swift — ScreenCaptureKit-based sidecar for the Nyvlo desktop app.
// Captures system audio + mic + screen and POSTs chunks to the Nyvlo ingestion API.
//
// macOS 13+ (ScreenCaptureKit), Swift 5.9+.
// Compile:  swift build -c release
// Run:      ./NyvloCapture --token <SUPABASE_ACCESS_TOKEN> --api https://transform-pilot-ai.vercel.app --label "Standup"
//
// Communicates with the Electron parent via stdout (line-delimited JSON):
//   {"type":"started","sessionId":"..."}
//   {"type":"capturing","mic":true,"system":true}
//   {"type":"transcript","sequence":N,"text":"..."}
//   {"type":"chunk","kind":"audio"|"screen","sequence":N}
//   {"type":"ended","meeting_id":"...","action_count":N}
//   {"type":"error","message":"..."}
//
// Listens on stdin for commands:
//   {"action":"stop","notes":"..."}

import Foundation
import ScreenCaptureKit
import AVFoundation
import CoreImage
import AppKit

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

@available(macOS 13.0, *)
actor Recorder {
    let apiBase: String
    let token: String
    let label: String
    let audioOnly: Bool
    var sessionId: String?
    var stream: SCStream?
    var output: StreamOutput?
    var audioSeq = 0
    var screenSeq = 0
    let stopSignal = AsyncStream<Void>.makeStream()

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

        // 2. Configure ScreenCaptureKit
        let content = try await SCShareableContent.excludingDesktopWindows(false, onScreenWindowsOnly: true)
        guard let display = content.displays.first else {
            throw NSError(domain: "Nyvlo", code: 2, userInfo: [NSLocalizedDescriptionKey: "No display"])
        }
        let filter = SCContentFilter(display: display, excludingApplications: [], exceptingWindows: [])
        let config = SCStreamConfiguration()
        config.capturesAudio = true                    // system audio (the other person's voice in Zoom/Meet)
        config.excludesCurrentProcessAudio = true      // don't capture our own beeps
        config.sampleRate = 16_000
        config.channelCount = 1
        config.width = 1280
        config.height = 800
        config.minimumFrameInterval = CMTime(value: 1, timescale: 1) // 1 fps to server (we sub-sample frames)
        config.queueDepth = 6
        if #available(macOS 15.0, *) {
            config.captureMicrophone = true
        }

        let stream = SCStream(filter: filter, configuration: config, delegate: nil)
        let output = StreamOutput(parent: self)
        try stream.addStreamOutput(output, type: .audio, sampleHandlerQueue: .global(qos: .userInitiated))
        if #available(macOS 15.0, *) {
            try stream.addStreamOutput(output, type: .microphone, sampleHandlerQueue: .global(qos: .userInitiated))
        }
        if !audioOnly {
            try stream.addStreamOutput(output, type: .screen, sampleHandlerQueue: .global(qos: .userInitiated))
        }
        try await stream.startCapture()
        self.stream = stream
        self.output = output
        log("capturing", ["mic": ProcessInfo.processInfo.isOperatingSystemAtLeast(OperatingSystemVersion(majorVersion: 15, minorVersion: 0, patchVersion: 0)), "system": true])

        // 3. Listen for stop from stdin
        Task.detached { await self.readStdin() }
    }

    func readStdin() async {
        let h = FileHandle.standardInput
        while let line = try? h.readLine() {
            if line.contains("\"stop\"") {
                let notes = parseStopNotes(line)
                await self.stop(notes: notes)
                break
            }
        }
    }

    func stop(notes: String) async {
        guard let stream = stream else { return }
        try? await stream.stopCapture()
        if let sid = sessionId {
            let response = try? await postJSON(path: "/api/public/ingest/session-end", body: ["sessionId": sid, "notes": notes])
            log("ended", response ?? [:])
        } else {
            log("ended", [:])
        }
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
            let response = try await postMultipart(path: "/api/public/ingest/audio-chunk",
                                                   fields: fields,
                                                   fileField: "file", fileName: "chunk-\(seq).wav",
                                                   fileData: wavData, mime: "audio/wav")
            if let text = response["transcript"] as? String, !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                log("transcript", ["sequence": seq, "text": text])
            }
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

// MARK: - Stream output (audio + screen)

@available(macOS 13.0, *)
class StreamOutput: NSObject, SCStreamOutput {
    weak var parent: Recorder?
    var systemBuffer = Data()
    var micBuffer = Data()
    var bufferStart = Date()
    var lastScreenAt = Date.distantPast
    let chunkSeconds: TimeInterval = 6.0
    let screenIntervalSeconds: TimeInterval = 10.0

    init(parent: Recorder) { self.parent = parent }

    func stream(_ stream: SCStream, didOutputSampleBuffer sampleBuffer: CMSampleBuffer, of type: SCStreamOutputType) {
        if #available(macOS 15.0, *), type == .microphone {
            handleAudio(sampleBuffer, channel: "mic")
            return
        }
        switch type {
        case .audio:
            handleAudio(sampleBuffer, channel: "system")
        case .screen:
            handleScreen(sampleBuffer)
        @unknown default: break
        }
    }

    func handleAudio(_ buf: CMSampleBuffer, channel: String) {
        guard CMSampleBufferDataIsReady(buf) else { return }
        guard let blockBuffer = CMSampleBufferGetDataBuffer(buf) else { return }
        var length = 0
        var dataPointer: UnsafeMutablePointer<Int8>?
        CMBlockBufferGetDataPointer(blockBuffer, atOffset: 0, lengthAtOffsetOut: nil,
                                    totalLengthOut: &length, dataPointerOut: &dataPointer)
        if let p = dataPointer, length > 0 {
            if channel == "mic" {
                micBuffer.append(Data(bytes: p, count: length))
            } else {
                systemBuffer.append(Data(bytes: p, count: length))
            }
        }
        // System audio drives flush cadence because it is always present when capture succeeds.
        if channel == "system" && Date().timeIntervalSince(bufferStart) >= chunkSeconds {
            let pcm = mixedChunk(system: systemBuffer, mic: micBuffer)
            let started = bufferStart
            systemBuffer.removeAll(keepingCapacity: true)
            micBuffer.removeAll(keepingCapacity: true)
            bufferStart = Date()
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

func mixedChunk(system: Data, mic: Data) -> Data {
    if mic.isEmpty { return system }
    if system.isEmpty { return mic }
    let count = min(system.count, mic.count) / 2
    var out = Data(capacity: max(system.count, mic.count))
    system.withUnsafeBytes { sysRaw in
        mic.withUnsafeBytes { micRaw in
            let sys = sysRaw.bindMemory(to: Int16.self)
            let micSamples = micRaw.bindMemory(to: Int16.self)
            for idx in 0..<count {
                let sum = Int(sys[idx]) + Int(micSamples[idx])
                let clamped = Int16(max(Int(Int16.min), min(Int(Int16.max), sum)))
                out.append(uint16LE(UInt16(bitPattern: clamped)))
            }
        }
    }
    if system.count > count * 2 {
        out.append(system.subdata(in: (count * 2)..<system.count))
    } else if mic.count > count * 2 {
        out.append(mic.subdata(in: (count * 2)..<mic.count))
    }
    return out
}

func parseStopNotes(_ line: String) -> String {
    guard let data = line.data(using: .utf8),
          let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
          let notes = obj["notes"] as? String else {
        return ""
    }
    return notes
}

// Minimal PCM16 → WAV encoder (mono, signed 16-bit little-endian)
func makeWavFromPcm16(pcm: Data, sampleRate: Int, channels: Int) -> Data {
    var d = Data()
    let byteRate = sampleRate * channels * 2
    let dataSize = UInt32(pcm.count)
    let chunkSize = 36 + dataSize
    d.append("RIFF".data(using: .ascii)!)
    d.append(uint32LE(chunkSize))
    d.append("WAVE".data(using: .ascii)!)
    d.append("fmt ".data(using: .ascii)!)
    d.append(uint32LE(16))                   // PCM chunk size
    d.append(uint16LE(1))                    // PCM
    d.append(uint16LE(UInt16(channels)))
    d.append(uint32LE(UInt32(sampleRate)))
    d.append(uint32LE(UInt32(byteRate)))
    d.append(uint16LE(UInt16(channels * 2))) // block align
    d.append(uint16LE(16))                   // bits per sample
    d.append("data".data(using: .ascii)!)
    d.append(uint32LE(dataSize))
    d.append(pcm)
    return d
}
func uint16LE(_ v: UInt16) -> Data { withUnsafeBytes(of: v.littleEndian) { Data($0) } }
func uint32LE(_ v: UInt32) -> Data { withUnsafeBytes(of: v.littleEndian) { Data($0) } }

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
