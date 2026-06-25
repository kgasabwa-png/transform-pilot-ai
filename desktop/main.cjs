// Nyvlo desktop main process.
// - Creates a small always-on-top recording window.
// - Manages sign-in via the device-link flow against the Nyvlo web app
//   (no manual tokens, no copy-paste). Opens default browser, user approves
//   once, tokens are stored locally and auto-refreshed.
const {
  app,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  session,
  dialog,
  shell,
} = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const API_BASE = process.env.NYVLO_API_BASE || "https://transform-pilot-ai.vercel.app";
const SUPABASE_URL = "https://tunndealwgyinwmjjwrl.supabase.co";
// Publishable (anon) key — safe in client.
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bm5kZWFsd2d5aW53bWpqd3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyODYyMDYsImV4cCI6MjA5NTg2MjIwNn0._Tjm6yjS51cG8vTGSs7MMrplwcj6WxkKaJpDhLcyUBs";

// --- Local token storage --------------------------------------------------
const dataDir = path.join(app.getPath("userData"));
const sessionPath = path.join(dataDir, "session.json");

function readSession() {
  try {
    return JSON.parse(fs.readFileSync(sessionPath, "utf8"));
  } catch {
    return null;
  }
}
function writeSession(sess) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(sessionPath, JSON.stringify(sess), { mode: 0o600 });
  } catch (e) {
    console.warn("[nyvlo] could not persist session", e);
  }
}
function clearSession() {
  try {
    fs.unlinkSync(sessionPath);
  } catch {}
}

// --- Device link flow -----------------------------------------------------
async function startDeviceLink() {
  const label = `Nyvlo Desktop · ${os.hostname()}`;
  const res = await fetch(`${API_BASE}/api/public/auth/device-start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label }),
  });
  if (!res.ok) throw new Error(`device-start failed (${res.status})`);
  return res.json(); // { code, verification_url, expires_in }
}

async function pollDeviceLink(code, signal) {
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    if (signal && signal.aborted) throw new Error("aborted");
    const r = await fetch(
      `${API_BASE}/api/public/auth/device-poll?code=${encodeURIComponent(code)}`,
    );
    const j = await r.json();
    if (j.status === "approved") return j;
    if (j.status === "expired" || j.status === "not_found") {
      throw new Error("Link code expired. Try again.");
    }
    await new Promise((res) => setTimeout(res, 2000));
  }
  throw new Error("Timed out waiting for approval");
}

async function signIn() {
  const start = await startDeviceLink();
  await shell.openExternal(start.verification_url);
  notifyRenderer("auth:waiting", { url: start.verification_url });
  const result = await pollDeviceLink(start.code);
  const session = {
    access_token: result.access_token,
    refresh_token: result.refresh_token,
    expires_at: result.expires_at, // seconds
    user: result.user,
  };
  writeSession(session);
  notifyRenderer("auth:signed-in", { user: session.user });
  return session;
}

async function refreshIfNeeded() {
  let sess = readSession();
  if (!sess) return null;
  const now = Math.floor(Date.now() / 1000);
  if (sess.expires_at && sess.expires_at - now > 60) return sess;
  // Refresh via Supabase token endpoint
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
      },
      body: JSON.stringify({ refresh_token: sess.refresh_token }),
    });
    if (!r.ok) {
      clearSession();
      return null;
    }
    const j = await r.json();
    sess = {
      access_token: j.access_token,
      refresh_token: j.refresh_token || sess.refresh_token,
      expires_at: j.expires_at,
      user: sess.user,
    };
    writeSession(sess);
    return sess;
  } catch (e) {
    console.warn("[nyvlo] refresh failed", e);
    return null;
  }
}

// --- Window ---------------------------------------------------------------
let win;
let captureProc = null;
let captureStdout = "";
function notifyRenderer(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

function sidecarPath() {
  const packaged = path.join(process.resourcesPath || "", "NyvloCapture");
  if (packaged && fs.existsSync(packaged)) return packaged;
  return path.join(__dirname, "sidecar", ".build", "release", "NyvloCapture");
}

function parseCaptureStdout(chunk) {
  captureStdout += chunk.toString("utf8");
  let idx;
  while ((idx = captureStdout.indexOf("\n")) >= 0) {
    const line = captureStdout.slice(0, idx).trim();
    captureStdout = captureStdout.slice(idx + 1);
    if (!line) continue;
    try {
      notifyRenderer("capture:event", JSON.parse(line));
    } catch {
      // Ignore non-JSON logs from the sidecar.
    }
  }
}

async function startCapture(label) {
  if (captureProc) throw new Error("Capture is already running.");
  const sess = await refreshIfNeeded();
  if (!sess?.access_token) throw new Error("Sign in first.");
  const bin = sidecarPath();
  if (!fs.existsSync(bin)) {
    throw new Error(`Swift sidecar not built. Run: cd desktop/sidecar && swift build -c release`);
  }
  captureStdout = "";
  captureProc = spawn(bin, [
    "--token",
    sess.access_token,
    "--api",
    API_BASE,
    "--label",
    label || `Meeting · ${new Date().toLocaleString()}`,
  ]);
  captureProc.stdout.on("data", parseCaptureStdout);
  captureProc.stderr.on("data", (chunk) => {
    console.warn("[NyvloCapture]", chunk.toString("utf8"));
  });
  captureProc.on("exit", (code) => {
    notifyRenderer("capture:event", { type: "exited", code });
    captureProc = null;
  });
  captureProc.on("error", (error) => {
    notifyRenderer("capture:event", { type: "error", message: error.message });
    captureProc = null;
  });
  return { ok: true };
}

function stopCapture(notes) {
  if (!captureProc) return { ok: true };
  captureProc.stdin.write(JSON.stringify({ action: "stop", notes: notes || "" }) + "\n");
  return { ok: true };
}

function createWindow() {
  win = new BrowserWindow({
    width: 380,
    height: 540,
    title: "Nyvlo",
    resizable: true,
    alwaysOnTop: true,
    backgroundColor: "#0b0b0b",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  session.defaultSession.setDisplayMediaRequestHandler(async (_request, callback) => {
    const choice = await dialog.showMessageBox(win, {
      type: "question",
      buttons: ["Allow recording", "Cancel"],
      defaultId: 0,
      cancelId: 1,
      title: "Start recording?",
      message: "Nyvlo wants to capture your screen and system audio for this meeting.",
      detail: "Audio is transcribed locally. Nothing is sent until you save the result.",
    });
    if (choice.response !== 0) return callback({});
    const sources = await desktopCapturer.getSources({ types: ["screen"] });
    callback({ video: sources[0], audio: "loopback" });
  });

  win.loadFile(path.join(__dirname, "renderer", "index.html"));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// --- IPC ------------------------------------------------------------------
ipcMain.handle("nyvlo:quit", () => app.quit());

ipcMain.handle("nyvlo:getSession", async () => {
  return readSession();
});

ipcMain.handle("nyvlo:getAccessToken", async () => {
  const sess = await refreshIfNeeded();
  return sess ? sess.access_token : null;
});

ipcMain.handle("nyvlo:signIn", async () => {
  try {
    const sess = await signIn();
    return { ok: true, user: sess.user };
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : "Sign-in failed" };
  }
});

ipcMain.handle("nyvlo:signOut", async () => {
  clearSession();
  return { ok: true };
});

ipcMain.handle("nyvlo:apiBase", async () => API_BASE);

ipcMain.handle("nyvlo:startCapture", async (_event, label) => {
  try {
    return await startCapture(label);
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : "Could not start capture" };
  }
});

ipcMain.handle("nyvlo:stopCapture", async (_event, notes) => {
  try {
    return stopCapture(notes);
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : "Could not stop capture" };
  }
});
