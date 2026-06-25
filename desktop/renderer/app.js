// Nyvlo desktop renderer: sidecar-based audio capture.
// The Swift sidecar handles mic + system audio capture and uploads chunks
// directly to the ingestion API. This renderer just controls start/stop
// and shows status from sidecar events.

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

  // Check if already recording (in case window was re-opened)
  const recording = await window.nyvlo.isRecording();
  if (recording) {
    setRecordingUI(true);
  }
}
init();

// --- Recording state & timer ---
let startTime = 0;
let timerHandle = null;
let recording = false;
let sessionId = null;
let chunkCount = 0;

function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function setRecordingUI(isRec) {
  recording = isRec;
  if (isRec) {
    startTime = Date.now();
    timerHandle = setInterval(() => (timerEl.textContent = fmtTime(Date.now() - startTime)), 500);
    recBtn.classList.add("recording");
    recRow.classList.add("recording");
    recBtn.innerHTML = '<span class="pulse"></span> Stop recording';
    setStatus("Recording mic + system audio via sidecar.");
  } else {
    clearInterval(timerHandle);
    timerHandle = null;
    recBtn.classList.remove("recording");
    recRow.classList.remove("recording");
    recBtn.innerHTML = '<span class="pulse"></span> Start recording';
  }
}

async function startRecording() {
  const token = await window.nyvlo.getAccessToken();
  if (!token) {
    setStatus("Sign in first.", "err");
    renderSignedOut("Your session expired. Sign in again to keep recording.");
    return;
  }

  setStatus("Starting capture…");
  chunkCount = 0;
  sessionId = null;
  const r = await window.nyvlo.startCapture();
  if (!r.ok) {
    setStatus(r.error || "Failed to start capture.", "err");
    return;
  }
  setRecordingUI(true);
}

async function stopRecording() {
  setStatus("Stopping…");
  await window.nyvlo.stopCapture();
  // The sidecar will emit "ended" which triggers finalize via the event listener
}

// --- Sidecar event handling ---
window.nyvlo.onCaptureEvent((payload) => {
  if (payload.recording !== undefined) {
    if (!payload.recording && recording) {
      setRecordingUI(false);
      finalize();
    }
    return;
  }
  if (payload.message && !payload.type) {
    // capture:error from main process
    setStatus(payload.message, "err");
    return;
  }
  // capture:event from sidecar stdout
  const msg = payload;
  switch (msg.type) {
    case "started":
      sessionId = msg.sessionId;
      setStatus("Recording — audio chunks uploading in background.");
      break;
    case "chunk":
      chunkCount++;
      break;
    case "ended":
      // Will be handled by capture:recording event
      break;
    case "error":
      setStatus(`Sidecar: ${msg.message}`, "err");
      break;
  }
});

async function finalize() {
  if (chunkCount === 0) {
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
  const duration = Math.round((Date.now() - startTime) / 1000);

  setStatus("Processing…");
  // The sidecar already uploaded audio chunks to the ingestion API.
  // Now we extract promises from the session.
  try {
    const r = await fetch(`${apiBase}/api/public/extension/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        url: "nyvlo://meeting",
        title,
        selected_text: `[Audio session: ${chunkCount} chunks, ${duration}s total]`,
        note: `Meeting recording via sidecar, ${duration}s, ${chunkCount} audio chunks uploaded`,
      }),
    });
    if (!r.ok) throw new Error(`Capture failed (${r.status}): ${await r.text()}`);
    const j = await r.json();
    const n = j.extracted_count ?? 0;

    resultCard.style.display = "block";
    transcriptEl.value = `Session complete. ${chunkCount} audio chunks processed (${duration}s).`;
    promiseCountEl.textContent = n
      ? `${n} promise${n === 1 ? "" : "s"} added to your inbox`
      : "No promises extracted (transcription runs server-side from chunks)";
    setStatus("Done.", "ok");
  } catch (err) {
    setStatus(err.message, "err");
  }
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
  setStatus("");
  chunkCount = 0;
  sessionId = null;
});
