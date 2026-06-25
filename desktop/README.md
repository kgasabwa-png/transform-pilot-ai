# Nyvlo Desktop

Menu-bar app that records meetings (mic + system audio) via a native Swift
sidecar, transcribes through the Nyvlo backend, and pushes extracted promises
into your inbox. Runs quietly in the macOS menu bar with a visible recording
indicator — no large window needed.

## Run locally

```bash
cd desktop
npm install            # ~150 MB; pulls Electron
npm start
```

1. Click the Nyvlo icon in the menu bar → **Sign in with Nyvlo** (opens browser
   for device-link approval).
2. Give the meeting a title.
3. **Start recording** — the sidecar captures mic + system audio.
   - On **macOS 14.4+**: only Microphone permission is required (Core Audio
     process-tap). No Screen Recording prompt.
   - On **macOS 13–14.3**: Screen Recording permission is needed (ScreenCaptureKit
     fallback for system audio).
4. **Stop** — audio chunks are already uploaded; the backend transcribes and
   extracts promises into your Nyvlo inbox.

## Architecture

```
┌─────────────────────────┐
│  Electron (menu bar)    │  ← Tray icon + small popover window
│  desktop/main.cjs       │
└──────────┬──────────────┘
           │ spawns child_process
           ▼
┌─────────────────────────┐
│  NyvloCapture (Swift)   │  ← Native audio capture sidecar
│  desktop/sidecar/       │
└──────────┬──────────────┘
           │ POSTs audio chunks
           ▼
┌─────────────────────────┐
│  Nyvlo ingestion API    │  ← /api/public/ingest/audio-chunk
│  (server)               │
└─────────────────────────┘
```

## Building the sidecar

```bash
cd desktop/sidecar
swift build -c release
# binary at .build/release/NyvloCapture
```

The Electron app looks for the sidecar at `desktop/sidecar/.build/release/NyvloCapture`
in development, or `Contents/Resources/bin/NyvloCapture` when packaged.

## Package a distributable

```bash
npm run package:mac      # macOS universal binary → release/Nyvlo-darwin-universal/
npm run package:win      # release/Nyvlo-win32-x64/
npm run package:linux    # release/Nyvlo-linux-x64/
```

`@electron/packager` bundles its own Electron binary, so the output is a
self-contained app folder you can zip and share.

## Privacy

- Audio is captured by the native sidecar and uploaded in 6-second WAV chunks
  to the ingestion API.
- The user must explicitly click "Start recording" — there is no hidden or
  automatic capture.
- A visible recording indicator appears in the menu bar while active.
- Audio chunks are transcribed server-side; only the resulting transcript and
  extracted promises are stored. Raw audio is not persisted.
- On macOS 14.4+, only the Microphone permission is requested. Screen Recording
  is never required for audio-only capture.

## Roadmap

- Local Whisper.cpp WASM for fully on-device transcription (no upload).
- Pause/resume.
- Speaker diarization labels in the transcript.
- Configurable audio source selection.
