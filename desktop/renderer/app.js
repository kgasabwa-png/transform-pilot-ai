// Nyvlo desktop renderer: capture mic + system audio, send to backend.
// All auth is handled by the main process (device-link flow). No tokens here.

const $ = (id) => document.getElementById(id);
const authContent = $("auth-content");
const meetingCard = $("meeting-card");
const recBtn = $("record");
const recRow = $("record-row");
const timerEl = $("timer");
const statusEl = $("status");
const resultCard = $("result-card");
const transcriptEl = $("transcript");
const promiseCountEl = $("promise-count");
const meetingTitleEl = $("meeting-title");
const resetBtn = $("reset");

let apiBase = "https://transform-pilot-ai.lovable.app";

function setStatus(msg, tone) {
  statusEl.textContent = msg || "";
  statusEl.className = "status " + (tone || "");
}

function renderSignedOut(extra) {
  meetingCard.style.display = "none";
  authContent.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="small" style="margin-bottom:10px; color:#d0d0d0;">
      ${extra || "Sign in once to connect this Mac to your Nyvlo account. We'll open your browser — approve, and you're done."}
    </div>
  `;
  const btn = document.createElement("button");
  btn.className = "accent";
  btn.style.width = "100%";
  btn.textContent = "Sign in with Nyvlo";
  btn.onclick = async () => {
    btn.disabled = true;
    btn.textContent = "Waiting for browser approval…";
    const r = await window.nyvlo.signIn();
    if (!r.ok) {
      btn.disabled = false;
      btn.textContent = "Try again";
      const err = document.createElement("div");
      err.className = "small err";
      err.style.marginTop = "8px";
      err.textContent = r.error || "Sign-in failed";
      wrap.appendChild(err);
      return;
    }
    renderSignedIn(r.user);
  };
  wrap.appendChild(btn);
  authContent.appendChild(wrap);
}

function renderSignedIn(user) {
  authContent.innerHTML = "";
  const row = document.createElement("div");
  row.className = "user-row";
  row.innerHTML = `
    <div>
      <div class="small" style="color:#9a9a9a; text-transform:uppercase; letter-spacing:0.06em;">Signed in</div>
      <div class="user-email">${(user && user.email) || "Account"}</div>
    </div>
  `;
  const out = document.createElement("button");
  out.className = "signout";
  out.textContent = "Sign out";
  out.onclick = async () => {
    await window.nyvlo.signOut();
    renderSignedOut();
  };
  row.appendChild(out);
  authContent.appendChild(row);
  meetingCard.style.display = "block";
}

async function init() {
  apiBase = await window.nyvlo.apiBase();
  const sess = await window.nyvlo.getSession();
  if (sess && sess.user) renderSignedIn(sess.user);
  else renderSignedOut();
}
init();

// --- Native capture (NyvloCapture sidecar) --------------------------------
let capturing = false;
let audioChunks = 0;
let screenChunks = 0;

window.nyvlo.onCaptureEvent((evt) => {
  if (!evt) return;
  switch (evt.type) {
    case "started":
      setStatus("Capturing system audio + screen…");
      break;
    case "chunk":
      if (evt.kind === "audio") audioChunks++;
      else if (evt.kind === "screen") screenChunks++;
      setStatus(`Capturing… ${audioChunks} audio · ${screenChunks} screen uploaded`);
      break;
    case "ended":
      break;
    case "error":
      setStatus(evt.message || "Capture error", "err");
      break;
    case "exit":
      finalizeSidecar(evt);
      break;
    case "log":
      console.log("[sidecar]", evt.message);
      break;
    default:
      break;
  }
});

async function startSidecarCapture() {
  const label = meetingTitleEl.value.trim() || `Meeting · ${new Date().toLocaleString()}`;
  setStatus("Starting capture…");
  const r = await window.nyvlo.startCapture({ label });

  if (!r.ok) {
    if (r.error === "sidecar-missing") {
      setStatus("Native capture not built; using browser recording.");
      return startRecording();
    }
    if (r.error === "not-signed-in") {
      setStatus("Sign in first.", "err");
      renderSignedOut("Your session expired. Sign in again to keep capturing.");
      return;
    }
    setStatus(`Couldn't start: ${r.error}`, "err");
    return;
  }

  capturing = true;
  audioChunks = 0;
  screenChunks = 0;
  startTime = Date.now();
  timerHandle = setInterval(() => (timerEl.textContent = fmtTime(Date.now() - startTime)), 500);
  recBtn.classList.add("recording");
  recRow.classList.add("recording");
  recBtn.innerHTML = '<span class="pulse"></span> Stop capture';
  setStatus("Capturing system audio + screen…");
}

async function stopSidecarCapture() {
  setStatus("Stopping…");
  await window.nyvlo.stopCapture();
}

function finalizeSidecar(evt) {
  if (!capturing) return;
  capturing = false;
  clearInterval(timerHandle);
  timerHandle = null;
  recBtn.classList.remove("recording");
  recRow.classList.remove("recording");
  recBtn.innerHTML = '<span class="pulse"></span> Start capture';

  if (evt && typeof evt.code === "number" && evt.code !== 0) {
    setStatus(`Capture stopped unexpectedly (exit ${evt.code}).`, "err");
    return;
  }

  setStatus("Session saved. Promises will appear in your inbox shortly.", "ok");
  resultCard.style.display = "block";
  transcriptEl.value =
    "Captured system audio + screen for this session. Nyvlo is transcribing and " +
    "extracting promises on the server — check your inbox in a moment.";
  promiseCountEl.textContent = `${audioChunks} audio · ${screenChunks} screen chunks uploaded`;
}

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
  const token = await window.nyvlo.getAccessToken();
  if (!token) {
    setStatus("Sign in first.", "err");
    renderSignedOut("Your session expired. Sign in again to keep recording.");
    return;
  }

  setStatus("Requesting audio access…");
  try {
    let systemStream = null;
    try {
      systemStream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
    } catch (e) {
      console.warn("[nyvlo] system audio unavailable", e);
    }

    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const ctx = new AudioContext();
    const dest = ctx.createMediaStreamDestination();
    if (systemStream && systemStream.getAudioTracks().length) {
      ctx.createMediaStreamSource(new MediaStream(systemStream.getAudioTracks())).connect(dest);
    }
    ctx.createMediaStreamSource(micStream).connect(dest);

    stream = dest.stream;
    stream.__sources = [systemStream, micStream].filter(Boolean);

    const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((t) =>
      MediaRecorder.isTypeSupported(t),
    );
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

  const token = await window.nyvlo.getAccessToken();
  if (!token) {
    setStatus("Session expired — sign in again.", "err");
    renderSignedOut();
    return;
  }
  const title = meetingTitleEl.value.trim() || `Meeting · ${new Date().toLocaleString()}`;

  setStatus("Transcribing…");
  const ext = mimeType.includes("mp4") ? "mp4" : "webm";
  const fd = new FormData();
  fd.append("file", blob, `recording.${ext}`);

  let transcript = "";
  try {
    const r = await fetch(`${apiBase}/api/public/extension/transcribe`, {
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
    const r = await fetch(`${apiBase}/api/public/extension/capture`, {
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
  if (capturing) {
    stopSidecarCapture();
    return;
  }
  if (recorder && recorder.state === "recording") {
    recorder.stop();
    return;
  }
  startSidecarCapture();
});

resetBtn.addEventListener("click", () => {
  resultCard.style.display = "none";
  transcriptEl.value = "";
  meetingTitleEl.value = "";
  timerEl.textContent = "00:00";
  setStatus("");
});
