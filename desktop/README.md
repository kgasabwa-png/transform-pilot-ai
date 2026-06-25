# Nyvlo for Mac

Small Electron shell plus a Swift ScreenCaptureKit sidecar. It captures both sides of a customer call without a meeting bot, streams live transcript chunks to Nyvlo, blends your typed notes on stop, and creates companion follow-ups ready to cosign.

## Run locally

```bash
cd desktop/sidecar
swift build -c release

cd ..
npm install
npm start
```

1. Click **Sign in with Nyvlo** and approve the device-link flow in the browser.
2. Enter a meeting title and jot notes while the call runs.
3. Click **Start recording**. macOS will ask for Screen Recording and Microphone access.
4. Click **Stop & create actions**. The app sends notes plus ordered transcript chunks to Nyvlo.
5. Follow-ups appear in the web app Today view as companion actions ready to cosign.

## Capture model

- No bot joins the meeting.
- Swift uses ScreenCaptureKit for system audio and screen context.
- On macOS 15+, the sidecar also requests `captureMicrophone` and mixes mic plus system audio into mono 16 kHz PCM chunks.
- Audio chunks are uploaded as short WAV files for transcription. Raw audio is not kept as the product record.
- Typed notes are posted only when you stop recording.

## Package a distributable

```bash
npm run package:mac
npm run package:win
npm run package:linux
```

For macOS packaging, build and sign the Swift sidecar, then place `NyvloCapture` in the app resources so `main.cjs` can find it via `process.resourcesPath`.
