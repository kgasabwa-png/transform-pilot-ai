// Nyvlo desktop renderer: capture mic + system audio, send to backend.
const API_BASE = "https://transform-pilot-ai.lovable.app";
const TRANSCRIBE = `${API_BASE}/api/public/extension/transcribe`;
const CAPTURE = `${API_BASE}/api/public/extension/capture`;

const $ = (id) => document.getElementById(id);
const tokenInput = $("token");
const saveBtn = $("save-token");
const recBtn = $("record");
const recRow = $("record-row");
const timerEl = $("timer");
const statusEl = $("status");
const resultCard = $("result-card");
const transcriptEl = $("transcript");
const promiseCountEl = $("promise-count");
const meetingTitleEl = $("meeting-title");
const resetBtn = $("reset");

const TOKEN_KEY = "nyvlo.token";

function setStatus(msg, tone) {
  statusEl.textContent = msg || "";
  statusEl.className = "status " + (tone || "");
}

function loadToken() {
  const t = localStorage.getItem(TOKEN_KEY) || "";
  tokenInput.value = t;
  return t;
}
loadToken();

saveBtn.addEventListener("click", () => {
  const v = tokenInput.value.trim();
  if (!v.startsWith("nyv_")) {
    setStatus("Token should start with nyv_", "err");
    return;
  }
  localStorage.setItem(TOKEN_KEY, v);
  setStatus("Token saved.", "ok");
});

let recorder = null;
let chunks = [];
let stream = null;
let startTime = 0;
let timerHandle = null;

function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

async function startRecording() {
  const token = loadToken();
  if (!token) {
    setStatus("Save your Nyvlo token first.", "err");
    return;
  }

  setStatus("Requesting audio access…");
  try {
    // System audio via getDisplayMedia (Electron grants via main-process handler).
    let systemStream = null;
    try {
      systemStream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
    } catch (e) {
      console.warn("[nyvlo] system audio unavailable", e);
    }

    // Mic
    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Mix into one track
    const ctx = new AudioContext();
    const dest = ctx.createMediaStreamDestination();
    if (systemStream && systemStream.getAudioTracks().length) {
      ctx.createMediaStreamSource(new MediaStream(systemStream.getAudioTracks())).connect(dest);
    }
    ctx.createMediaStreamSource(micStream).connect(dest);

    stream = dest.stream;
    // Keep the underlying tracks alive so we can stop them on stop.
    stream.__sources = [systemStream, micStream].filter(Boolean);

    const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
    if (!mimeType) throw new Error("No supported recorder MIME type");

    recorder = new MediaRecorder(stream, { mimeType });
    chunks = [];
    recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    recorder.onstop = () => finalize(mimeType);
    recorder.start(1000);

    startTime = Date.now();
    timerHandle = setInterval(() => (timerEl.textContent = fmtTime(Date.now() - startTime)), 500);
    recBtn.classList.add("recording");
    recRow.classList.add("recording");
    recBtn.firstChild.nextSibling
      ? null
      : null; // pulse already in DOM
    recBtn.innerHTML = '<span class="pulse"></span> Stop recording';
    setStatus(systemStream ? "Recording mic + system audio." : "Recording mic only (system audio denied).");
  } catch (err) {
    console.error(err);
    setStatus(`Couldn't start: ${err.message}`, "err");
  }
}

function stopTracks() {
  if (!stream) return;
  stream.getTracks().forEach((t) => t.stop());
  (stream.__sources || []).forEach((s) => s?.getTracks?.().forEach((t) => t.stop()));
  stream = null;
}

async function finalize(mimeType) {
  clearInterval(timerHandle);
  timerHandle = null;
  recBtn.classList.remove("recording");
  recRow.classList.remove("recording");
  recBtn.innerHTML = '<span class="pulse"></span> Start recording';
  stopTracks();

  const blob = new Blob(chunks, { type: mimeType });
  chunks = [];
  if (blob.size < 2048) {
    setStatus("Recording was too short.", "err");
    return;
  }

  const token = loadToken();
  const title = meetingTitleEl.value.trim() || `Meeting · ${new Date().toLocaleString()}`;

  setStatus("Transcribing…");
  const ext = mimeType.includes("mp4") ? "mp4" : "webm";
  const fd = new FormData();
  fd.append("file", blob, `recording.${ext}`);

  let transcript = "";
  try {
    const r = await fetch(TRANSCRIBE, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (!r.ok) throw new Error(`Transcribe failed (${r.status}): ${await r.text()}`);
    const j = await r.json();
    transcript = (j.text || "").trim();
  } catch (err) {
    setStatus(err.message, "err");
    return;
  }

  if (!transcript) {
    setStatus("Empty transcript.", "err");
    return;
  }

  resultCard.style.display = "block";
  transcriptEl.value = transcript;

  setStatus("Extracting promises…");
  try {
    const r = await fetch(CAPTURE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        url: "nyvlo://meeting",
        title,
        selected_text: transcript.slice(0, 7900),
        note: `Meeting recording, ${Math.round((Date.now() - startTime) / 1000)}s`,
      }),
    });
    if (!r.ok) throw new Error(`Capture failed (${r.status}): ${await r.text()}`);
    const j = await r.json();
    const n = j.extracted_count ?? 0;
    promiseCountEl.textContent = n
      ? `${n} promise${n === 1 ? "" : "s"} added to your inbox`
      : "No promises extracted";
    setStatus("Done.", "ok");
  } catch (err) {
    setStatus(err.message, "err");
  }
}

recBtn.addEventListener("click", () => {
  if (recorder && recorder.state === "recording") {
    recorder.stop();
  } else {
    startRecording();
  }
});

resetBtn.addEventListener("click", () => {
  resultCard.style.display = "none";
  transcriptEl.value = "";
  meetingTitleEl.value = "";
  timerEl.textContent = "00:00";
  setStatus("");
});
