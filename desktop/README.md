# Nyvlo Desktop

Tiny Electron app that records a meeting (mic + system audio), transcribes it
through the Nyvlo backend, and pushes any extracted promises into your inbox.

## Run locally

```bash
cd desktop
npm install            # ~150 MB; pulls Electron
npm start
```

1. Paste your Nyvlo token (Settings → Browser extension → New token).
2. Give the meeting a title.
3. **Start recording** — grant mic + screen access (screen pick is required
   for system audio on macOS/Windows; only the audio is used).
4. **Stop** — wait a few seconds; transcript appears and any promises land
   in your Nyvlo inbox tagged as `meeting`.

## Package a distributable

```bash
npm run package:mac      # macOS universal binary → release/Nyvlo-darwin-universal/
npm run package:win      # release/Nyvlo-win32-x64/
npm run package:linux    # release/Nyvlo-linux-x64/
```

`@electron/packager` bundles its own Electron binary, so the output is a
self-contained app folder you can zip and share.

## Privacy

- Audio is held in memory while recording.
- Only on stop is it uploaded to `transform-pilot-ai.lovable.app` for
  transcription (Lovable AI / `openai/gpt-4o-mini-transcribe`).
- Audio is not stored on the server; only the resulting transcript is saved
  as a `sources` row alongside any extracted promises.

## Roadmap

- Local Whisper.cpp WASM for fully on-device transcription (no upload).
- Pause/resume.
- Speaker diarization labels in the transcript.
