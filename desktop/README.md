# Nyvlo Desktop

Menu-bar app that records meeting audio (mic + system), transcribes it through
the Nyvlo backend, and pushes any extracted promises into your inbox.

## Architecture

The Electron main process runs as a **Tray (menu-bar) app** with a small
recording indicator. It launches the Swift **sidecar** (`NyvloCapture`) as a
child process for native audio capture:

- **macOS 14.4+**: Core Audio process-tap API — requires only microphone
  permission, no Screen Recording prompt.
- **macOS 13.x**: ScreenCaptureKit fallback — requires microphone + Screen
  Recording permissions.

If the sidecar binary is not built, the renderer falls back to in-browser
`getDisplayMedia` recording (same as the original flow).

## Run locally

```bash
cd desktop
npm install            # ~150 MB; pulls Electron

# Build the sidecar (macOS only, requires Xcode CLT)
cd sidecar && swift build -c release && cd ..

npm start
```

1. The app appears as a menu-bar icon (tray). Click it to show the window.
2. Sign in via the device-link flow — a browser tab opens, approve once.
3. Give the meeting a title.
4. **Start recording** — on macOS 14.4+, only the mic permission is requested.
   No Screen Recording prompt for audio-only capture.
5. **Stop** — wait a few seconds; audio chunks are uploaded during recording.
   Transcript appears and any promises land in your Nyvlo inbox tagged as
   `meeting`.

## Package a distributable

```bash
npm run package:mac      # macOS universal binary → release/Nyvlo-darwin-universal/
npm run package:win      # release/Nyvlo-win32-x64/
npm run package:linux    # release/Nyvlo-linux-x64/
```

For macOS, embed the signed `NyvloCapture` binary at
`Contents/Resources/bin/NyvloCapture` in the packaged app.

`@electron/packager` bundles its own Electron binary, so the output is a
self-contained app folder you can zip and share.

## Privacy

- The app runs as a menu-bar app with a **visible recording indicator** (red
  tray icon + pulsing dot in the UI). Recording only starts when the user
  explicitly clicks "Start recording".
- Audio is streamed as 6-second WAV chunks to `transform-pilot-ai.lovable.app`
  during recording for live transcription.
- Audio is not stored on the server; only the resulting transcript is saved
  as a `sources` row alongside any extracted promises.
- On macOS 14.4+, only the microphone permission is required. Screen Recording
  permission is not requested for audio-only capture.

## Roadmap

- Local Whisper.cpp WASM for fully on-device transcription (no upload).
- Pause/resume.
- Speaker diarization labels in the transcript.
