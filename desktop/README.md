# Nyvlo Desktop

Menu-bar app that records meeting audio (mic + system audio) via a Swift sidecar,
uploads 6-second chunks to the Nyvlo backend for transcription, and pushes
extracted promises into your inbox.

## Architecture

```
┌──────────────┐    stdout/stdin JSON     ┌─────────────────────┐
│  Electron    │ ◄───────────────────────► │  NyvloCapture       │
│  (main.cjs)  │                           │  (Swift sidecar)    │
└──────┬───────┘                           └─────────────────────┘
       │ IPC                                        │ HTTP POST
       ▼                                            ▼
┌──────────────┐                           ┌─────────────────────┐
│  renderer    │                           │  Nyvlo API          │
│  (app.js)    │                           │  /api/public/ingest │
└──────────────┘                           └─────────────────────┘
```

## Run locally

```bash
cd desktop
npm install            # ~150 MB; pulls Electron
npm start
```

1. A menu-bar icon (tray) appears — click it or it auto-shows the window.
2. Sign in via your browser (device-link flow — opens the Nyvlo web app).
3. Give the meeting a title.
4. **Start recording** — a consent dialog confirms before capture begins.
5. **Stop** — transcript appears and any promises land in your inbox.

## Permissions

| macOS version | Microphone | Screen Recording |
|---|---|---|
| **14.4+** (Sonoma+) | Required | **Not required** — Core Audio process-tap captures system audio without it |
| **13.0–14.3** | Required | Required (ScreenCaptureKit fallback needs it for system audio) |

On macOS 14.4+, the app uses `CATapDescription` + `AudioHardwareCreateProcessTap`
to capture system audio output without triggering the Screen Recording permission.
This is combined with the default microphone input via an aggregate device.

## Build the sidecar

```bash
cd desktop/sidecar
swift build -c release
# Output: .build/release/NyvloCapture
```

The Electron main process looks for the binary at `desktop/sidecar/.build/release/NyvloCapture`
in development, or `Contents/Resources/bin/NyvloCapture` in a packaged app.

## Package a distributable

```bash
npm run package:mac      # macOS universal binary → release/Nyvlo-darwin-universal/
npm run package:win      # release/Nyvlo-win32-x64/
npm run package:linux    # release/Nyvlo-linux-x64/
```

`@electron/packager` bundles its own Electron binary, so the output is a
self-contained app folder you can zip and share.

## Privacy

- Audio is streamed as 6-second WAV chunks while recording (not held until stop).
- Chunks are uploaded to `transform-pilot-ai.lovable.app` for transcription
  (OpenAI/gpt-4o-mini-transcribe).
- Audio is not stored on the server; only the resulting transcript is saved
  as a `sources` row alongside any extracted promises.
- A visible recording indicator shows in the menu bar while capture is active.
- Recording always requires explicit user consent (dialog confirmation).

## Roadmap

- Local Whisper.cpp WASM for fully on-device transcription (no upload).
- Pause/resume.
- Speaker diarization labels in the transcript.
