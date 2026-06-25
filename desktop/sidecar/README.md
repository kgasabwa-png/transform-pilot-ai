# NyvloCapture — Swift sidecar for system audio + mic

This binary captures **system audio** (the other person's voice in Zoom / Meet /
Teams) plus **microphone input** and POSTs 6-second WAV chunks to the Nyvlo
ingestion API. The Electron app launches it as a child process; it stops when
stdin receives `{"action":"stop"}`.

## Audio Capture Paths

### Core Audio Process Tap (macOS 14.4+ — preferred)

On macOS 14.4 and later, NyvloCapture uses the **Core Audio process-tap API**
(`CATapDescription` + `AudioHardwareCreateProcessTap`) combined with the default
microphone input via an `AudioHardwareCreateAggregateDevice`. This approach:

- **Only requires `NSMicrophoneUsageDescription`** (microphone permission)
- **Does NOT trigger the Screen Recording permission prompt**
- Captures both system audio output and mic input into a single mixed stream

### ScreenCaptureKit Fallback (macOS 13.0–14.3)

On macOS 13.0–14.3, the binary falls back to `ScreenCaptureKit` with
`config.capturesAudio = true`. This path requires the **Screen Recording**
permission in System Settings → Privacy & Security.

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

## Entitlements / Permissions

The parent `.app`'s `Info.plist` needs:

| Key | Required on | Description |
|---|---|---|
| `NSMicrophoneUsageDescription` | All macOS versions | "Nyvlo records meeting audio to extract action items." |
| `NSScreenCaptureUsageDescription` | macOS 13.0–14.3 only | "Nyvlo captures system audio to hear other meeting participants." (Only needed for ScreenCaptureKit fallback path) |

**On macOS 14.4+, Screen Recording permission is NOT required for audio-only
capture.** The Core Audio process-tap path captures system audio output without
needing screen access.

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
| `--audio-only` | no | Disable screen capture (default behavior — audio only) |
