# NyvloCapture — Swift sidecar for companion capture

This binary captures **system audio** (the other person's voice in Zoom / Meet /
Teams), **microphone audio** on macOS 15+, and periodic **screen frames** using
Apple's ScreenCaptureKit. The Electron app launches it as a child process; it
stops when stdin receives `{"action":"stop","notes":"..."}`.

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
  --api  "https://transform-pilot-ai.vercel.app" \
  --label "Test session"
```

Send `{"action":"stop","notes":"Jotted notes"}\n` on stdin to end. Nyvlo blends
those notes with the ordered transcript chunks before extracting companion
actions.

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
- `NSScreenCaptureUsageDescription` — "Nyvlo captures your screen so it remembers what you were working on."

ScreenCaptureKit triggers macOS's screen-recording permission prompt on first
launch; users grant it in System Settings → Privacy & Security → Screen
Recording. Use `SCShareableContent` only after the user clicks "Start capture"
so the prompt happens at the right moment.

## Stdout protocol (Electron parses these)

```
{"type":"started","sessionId":"..."}
{"type":"capturing","mic":true,"system":true}
{"type":"transcript","sequence":3,"text":"..."}
{"type":"chunk","kind":"audio","sequence":3}
{"type":"chunk","kind":"screen","sequence":1}
{"type":"ended","ok":true,"meeting_id":"...","action_count":3}
{"type":"error","message":"..."}
```

## Flags

| Flag           | Required | Description                                                  |
| -------------- | -------- | ------------------------------------------------------------ |
| `--token`      | yes      | Supabase access token (Bearer)                               |
| `--api`        | yes      | Nyvlo base URL, e.g. `https://transform-pilot-ai.vercel.app` |
| `--label`      | no       | Session label shown in the app                               |
| `--audio-only` | no       | Disable screen capture, audio only                           |
