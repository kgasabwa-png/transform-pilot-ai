// Nyvlo desktop renderer: sidecar-based audio capture.
// Recording is handled by the NyvloCapture Swift sidecar, controlled via IPC.
// Auth is handled by the main process (device-link flow).

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
const chunkCountEl = $("chunk-count");

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

  // Check if already recording (e.g. window was closed and reopened)
  const state = await window.nyvlo.isRecording();
  if (state.recording) {
    enterRecordingState(state.sessionId);
  }
}
init();

// --- Recording state ---
let recording = false;
let startTime = 0;
let timerHandle = null;
let audioChunks = 0;
let currentSessionId = null;

function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function enterRecordingState(sessionId) {
  recording = true;
  currentSessionId = sessionId;
  audioChunks = 0;
  startTime = Date.now();
  timerHandle = setInterval(() => (timerEl.textContent = fmtTime(Date.now() - startTime)), 500);
  recBtn.classList.add("recording");
  recRow.classList.add("recording");
  recBtn.innerHTML = '<span class="pulse"></span> Stop recording';
  setStatus("Recording mic + system audio via sidecar.");
  updateChunkCount();
}

function exitRecordingState() {
  recording = false;
  clearInterval(timerHandle);
  timerHandle = null;
  recBtn.classList.remove("recording");
  recRow.classList.remove("recording");
  recBtn.innerHTML = '<span class="pulse"></span> Start recording';
}

function updateChunkCount() {
  if (chunkCountEl) {
    chunkCountEl.textContent =
      audioChunks > 0 ? `${audioChunks} chunk${audioChunks === 1 ? "" : "s"} uploaded` : "";
  }
}

async function startRecording() {
  const label = meetingTitleEl.value.trim() || `Meeting · ${new Date().toLocaleString()}`;
  setStatus("Starting capture…");
  recBtn.disabled = true;

  const result = await window.nyvlo.startCapture(label);
  recBtn.disabled = false;

  if (!result.ok) {
    setStatus(result.error || "Failed to start", "err");
    return;
  }
  // State will be updated when "capture:started" event arrives
}

async function stopRecording() {
  setStatus("Stopping…");
  const result = await window.nyvlo.stopCapture();
  if (!result.ok) {
    setStatus(result.error || "Failed to stop", "err");
  }
  // State will be updated when "capture:ended" event arrives
}

// --- Capture event listener ---
window.nyvlo.onCaptureEvent((msg) => {
  switch (msg.event) {
    case "started":
      enterRecordingState(msg.sessionId);
      break;
    case "chunk":
      if (msg.kind === "audio") {
        audioChunks++;
        updateChunkCount();
      }
      break;
    case "ended":
      exitRecordingState();
      handleRecordingComplete();
      break;
    case "stopped":
      exitRecordingState();
      if (msg.code !== 0 && msg.code != null) {
        setStatus(`Sidecar exited with code ${msg.code}`, "err");
      }
      break;
    case "error":
      setStatus(msg.message || "Capture error", "err");
      break;
  }
});

async function handleRecordingComplete() {
  if (!currentSessionId) {
    setStatus("Recording complete.", "ok");
    return;
  }

  const token = await window.nyvlo.getAccessToken();
  if (!token) {
    setStatus("Session expired — sign in again.", "err");
    renderSignedOut();
    return;
  }

  setStatus("Processing transcript…");
  const title = meetingTitleEl.value.trim() || `Meeting · ${new Date().toLocaleString()}`;

  // The sidecar already uploaded audio chunks and ended the session.
  // The backend processes chunks into a transcript asynchronously.
  // Poll for the transcript or show a success message.
  try {
    const r = await fetch(
      `${apiBase}/api/public/ingest/session-status?sessionId=${encodeURIComponent(currentSessionId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (r.ok) {
      const j = await r.json();
      if (j.transcript) {
        resultCard.style.display = "block";
        transcriptEl.value = j.transcript;
        const n = j.promise_count ?? 0;
        promiseCountEl.textContent = n
          ? `${n} promise${n === 1 ? "" : "s"} added to your inbox`
          : "Transcript saved — promises will be extracted shortly.";
        setStatus("Done.", "ok");
        return;
      }
    }
  } catch (e) {
    console.warn("[nyvlo] session-status poll failed:", e);
  }

  // If status endpoint isn't available yet, show a generic success
  setStatus(`Recording saved (${audioChunks} chunks uploaded). Transcript processing…`, "ok");
  promiseCountEl.textContent = "Promises will appear in your inbox shortly.";
  resultCard.style.display = "block";
  transcriptEl.value = "(Transcript is being processed server-side…)";
}

// --- Button handlers ---
recBtn.addEventListener("click", () => {
  if (recording) {
    stopRecording();
  } else {
    startRecording();
  }
});

resetBtn.addEventListener("click", () => {
  resultCard.style.display = "none";
  transcriptEl.value = "";
  meetingTitleEl.value = "";
  timerEl.textContent = "00:00";
  audioChunks = 0;
  updateChunkCount();
  setStatus("");
});
