// Nyvlo desktop renderer: auth UI + Swift sidecar controls.

const $ = (id) => document.getElementById(id);
const authContent = $("auth-content");
const meetingCard = $("meeting-card");
const recBtn = $("record");
const recRow = $("record-row");
const timerEl = $("timer");
const statusEl = $("status");
const resultCard = $("result-card");
const transcriptEl = $("transcript");
const followupCountEl = $("followup-count");
const meetingTitleEl = $("meeting-title");
const notesEl = $("notes");
const resetBtn = $("reset");

let timerHandle = null;
let startTime = 0;
let recording = false;
let transcriptParts = [];

function setStatus(msg, tone) {
  statusEl.textContent = msg || "";
  statusEl.className = "status " + (tone || "");
}

function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function renderSignedOut(extra) {
  meetingCard.style.display = "none";
  authContent.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="small" style="margin-bottom:10px; color:#d0d0d0;">
      ${extra || "Sign in once to connect this Mac to your Nyvlo account. We will open your browser. Approve, then you are done."}
    </div>
  `;
  const btn = document.createElement("button");
  btn.className = "accent";
  btn.style.width = "100%";
  btn.textContent = "Sign in with Nyvlo";
  btn.onclick = async () => {
    btn.disabled = true;
    btn.textContent = "Waiting for browser approval...";
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
  const sess = await window.nyvlo.getSession();
  if (sess && sess.user) renderSignedIn(sess.user);
  else renderSignedOut();
}

function startTimer() {
  startTime = Date.now();
  timerHandle = setInterval(() => {
    timerEl.textContent = fmtTime(Date.now() - startTime);
  }, 500);
}

function stopTimer() {
  clearInterval(timerHandle);
  timerHandle = null;
}

function setRecording(next) {
  recording = next;
  if (recording) {
    recBtn.classList.add("recording");
    recRow.classList.add("recording");
    recBtn.innerHTML = '<span class="pulse"></span> Stop & create actions';
    startTimer();
  } else {
    recBtn.classList.remove("recording");
    recRow.classList.remove("recording");
    recBtn.innerHTML = '<span class="pulse"></span> Start recording';
    stopTimer();
  }
}

async function startCapture() {
  const token = await window.nyvlo.getAccessToken();
  if (!token) {
    setStatus("Sign in first.", "err");
    renderSignedOut("Your session expired. Sign in again to keep recording.");
    return;
  }
  const label = meetingTitleEl.value.trim() || `Meeting · ${new Date().toLocaleString()}`;
  transcriptParts = [];
  transcriptEl.value = "";
  followupCountEl.textContent = "Recording...";
  resultCard.style.display = "block";
  setStatus("Starting ScreenCaptureKit...");
  const res = await window.nyvlo.startCapture(label);
  if (!res.ok) {
    setStatus(res.error || "Could not start capture", "err");
    return;
  }
  setRecording(true);
}

async function stopCapture() {
  setStatus("Stopping and extracting actions...");
  recBtn.disabled = true;
  const res = await window.nyvlo.stopCapture(notesEl.value || "");
  if (!res.ok) {
    setStatus(res.error || "Could not stop capture", "err");
    recBtn.disabled = false;
  }
}

function appendTranscript(text) {
  if (!text) return;
  transcriptParts.push(text.trim());
  transcriptEl.value = transcriptParts.join(" ");
  transcriptEl.scrollTop = transcriptEl.scrollHeight;
}

window.nyvlo.onCaptureEvent((event) => {
  if (!event || !event.type) return;
  if (event.type === "started") {
    setStatus("Capture started. No bot joined.");
  } else if (event.type === "capturing") {
    const mic = event.mic ? "mic + " : "";
    setStatus(`Recording ${mic}system audio.`);
  } else if (event.type === "transcript") {
    appendTranscript(event.text);
    setStatus(`Live transcript chunk ${event.sequence}`);
  } else if (event.type === "chunk") {
    if (event.kind === "screen") setStatus(`Screen context ${event.sequence} captured.`);
  } else if (event.type === "ended") {
    setRecording(false);
    recBtn.disabled = false;
    if (event.meeting_id) {
      const n = event.action_count || 0;
      followupCountEl.textContent = n
        ? `${n} follow-up${n === 1 ? "" : "s"} ready to cosign in Nyvlo`
        : "Meeting saved to Nyvlo";
      setStatus("Done.", "ok");
    } else if (event.reason === "no-transcript") {
      followupCountEl.textContent = "No speech captured";
      setStatus("No speech captured.", "err");
    } else {
      followupCountEl.textContent = "Meeting ended";
      setStatus("Ended.", "ok");
    }
  } else if (event.type === "error") {
    setStatus(event.message || "Capture failed", "err");
  } else if (event.type === "exited") {
    setRecording(false);
    recBtn.disabled = false;
    if (event.code && event.code !== 0) {
      setStatus("Grant Screen Recording and Microphone access, then retry.", "err");
    }
  }
});

recBtn.addEventListener("click", () => {
  if (recording) stopCapture();
  else startCapture();
});

resetBtn.addEventListener("click", () => {
  resultCard.style.display = "none";
  transcriptEl.value = "";
  transcriptParts = [];
  meetingTitleEl.value = "";
  notesEl.value = "";
  followupCountEl.textContent = "";
  timerEl.textContent = "00:00";
  setStatus("");
});

init();
