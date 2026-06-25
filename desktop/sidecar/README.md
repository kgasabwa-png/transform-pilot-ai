# NyvloCapture — Swift sidecar for system audio + mic

This binary captures **system audio** (the other person's voice in Zoom / Meet /
Teams) plus the local **microphone** and POSTs mixed audio chunks to the Nyvlo
ingestion API. The Electron app launches it as a child process; it stops when
stdin receives `{"action":"stop"}`.

### Capture backends

| macOS version | Backend | Permissions required |
|---|---|---|
| **14.4+** | Core Audio process-tap (`CATapDescription` + aggregate device) | Microphone only (`NSMicrophoneUsageDescription`) |
| **13.0 – 14.3** | ScreenCaptureKit (fallback) | Microphone + Screen Recording |

On macOS 14.4+, the process-tap API captures all system audio output without
ScreenCaptureKit, so the **Screen Recording permission prompt is never shown**
for audio-only capture. The sidecar picks the best available backend
automatically at runtime via `if #available(macOS 14.4, *)`.

## Build (one command on any Mac with Xcode CLT)

```bash
cd desktop/sidecar
swift build -c release
# binary: .build/release/NyvloCapture
```

## Run standalone for testing

```bash
./.build/release/NyvloCapture \
  --token "<paste a Supabase access token from your browser console>" \
  --api  "https://transform-pilot-ai.lovable.app" \
  --label "Test session"
```

Send `{"action":"stop"}\n` on stdin to end.

## Sign + notarize (ship to users)

```bash
# 1. Sign the binary with your Developer ID (one-time setup of certs in Keychain)
codesign --force --options runtime --timestamp \
  --sign "Developer ID Application: YOUR NAME (TEAMID)" \
  .build/release/NyvloCapture

# 2. Zip and notarize
ditto -c -k --keepParent .build/release/NyvloCapture NyvloCapture.zip
xcrun notarytool submit NyvloCapture.zip \
  --apple-id you@nyvloai.com --team-id TEAMID --password "@keychain:NOTARY" \
  --wait

# 3. Staple
xcrun stapler staple .build/release/NyvloCapture
```

When the Electron app is packaged, embed the signed binary at
`Contents/Resources/bin/NyvloCapture` and codesign + notarize the whole `.app`
bundle as one unit. The same Developer ID Application cert covers both.

## Entitlements

The parent `.app`'s `Info.plist` needs:

- `NSMicrophoneUsageDescription` — "Nyvlo records meeting audio to extract action items."

On macOS 14.4+, **`NSScreenCaptureUsageDescription` is not required** for
audio-only capture because the Core Audio process-tap path does not use
ScreenCaptureKit. If you also want to capture screen frames (omit
`--audio-only`), the ScreenCaptureKit fallback path is used and then you also
need:

- `NSScreenCaptureUsageDescription` — "Nyvlo captures your screen so it remembers what you were working on."

## Stdout protocol (Electron parses these)

```
{"type":"started","sessionId":"..."}
{"type":"chunk","kind":"audio","sequence":3}
{"type":"chunk","kind":"screen","sequence":1}
{"type":"ended"}
{"type":"error","message":"..."}
```

## Flags

| Flag | Required | Description |
|---|---|---|
| `--token` | yes | Supabase access token (Bearer) |
| `--api` | yes | Nyvlo base URL, e.g. `https://transform-pilot-ai.lovable.app` |
| `--label` | no | Session label shown in the app |
| `--audio-only` | no | Disable screen capture, audio only (default on macOS 14.4+ Core Audio path) |
