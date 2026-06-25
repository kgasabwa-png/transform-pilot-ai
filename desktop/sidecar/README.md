# NyvloCapture — Swift sidecar for meeting audio capture

This binary captures **mic + system audio** and POSTs chunks to the Nyvlo
ingestion API. The Electron menu-bar app launches it as a child process; it
stops when stdin receives `{"action":"stop"}`.

## Capture backends

### Core Audio process-tap (macOS 14.4+) — preferred

Uses `CATapDescription` + `AudioHardwareCreateProcessTap` combined with the
default input device (mic) via `AudioHardwareCreateAggregateDevice`. This path
**only requires the Microphone permission** (`NSMicrophoneUsageDescription`) —
no Screen Recording prompt is shown.

### ScreenCaptureKit (macOS 13–14.3) — fallback

Uses `SCStreamConfiguration.capturesAudio` to capture system audio. This
requires the **Screen Recording permission** (`NSScreenCaptureUsageDescription`)
because ScreenCaptureKit gates audio behind screen capture access.

The backend is chosen automatically at runtime with `if #available(macOS 14.4, *)`.

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
  --label "Test session" \
  --audio-only
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

## Entitlements / permissions

The parent `.app`'s `Info.plist` needs:

| Key | When required | Description |
|-----|---------------|-------------|
| `NSMicrophoneUsageDescription` | Always | "Nyvlo records meeting audio to extract action items." |
| `NSScreenCaptureUsageDescription` | macOS < 14.4 only | "Nyvlo captures system audio for meeting recording." |

**On macOS 14.4+** with the Core Audio process-tap path, **only
`NSMicrophoneUsageDescription` is required** — Screen Recording permission is
not needed for audio-only capture.

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
| `--audio-only` | no | Disable screen capture, audio only (default when launched from Electron) |
