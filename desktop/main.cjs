// Nyvlo desktop main process.
// - Menu-bar (Tray) app with a small recording popover window.
// - Spawns the NyvloCapture Swift sidecar for low-permission audio capture.
// - Manages sign-in via the device-link flow against the Nyvlo web app.
const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  nativeImage,
  session,
  dialog,
  shell,
} = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const API_BASE = "https://transform-pilot-ai.lovable.app";
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
  const sess = {
    access_token: result.access_token,
    refresh_token: result.refresh_token,
    expires_at: result.expires_at,
    user: result.user,
  };
  writeSession(sess);
  notifyRenderer("auth:signed-in", { user: sess.user });
  return sess;
}

async function refreshIfNeeded() {
  let sess = readSession();
  if (!sess) return null;
  const now = Math.floor(Date.now() / 1000);
  if (sess.expires_at && sess.expires_at - now > 60) return sess;
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

// --- Sidecar management ---------------------------------------------------
let sidecarProcess = null;
let sidecarSessionId = null;

function getSidecarBinaryPath() {
  // In packaged app: Contents/Resources/bin/NyvloCapture
  // In development: look for compiled binary in sidecar/.build/release/
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "bin", "NyvloCapture");
  }
  // Dev: try local build
  const devPath = path.join(__dirname, "sidecar", ".build", "release", "NyvloCapture");
  if (fs.existsSync(devPath)) return devPath;
  // Fallback: try PATH
  return "NyvloCapture";
}

function spawnSidecar(token, label) {
  const binPath = getSidecarBinaryPath();
  const args = ["--token", token, "--api", API_BASE, "--label", label, "--audio-only"];

  sidecarProcess = spawn(binPath, args, {
    stdio: ["pipe", "pipe", "pipe"],
  });

  let sidecarLineBuf = "";
  sidecarProcess.stdout.on("data", (data) => {
    sidecarLineBuf += data.toString();
    const lines = sidecarLineBuf.split("\n");
    sidecarLineBuf = lines.pop(); // keep incomplete tail for next chunk
    for (const line of lines) {
      if (!line) continue;
      try {
        handleSidecarMessage(JSON.parse(line));
      } catch {
        console.warn("[nyvlo:sidecar] non-JSON stdout:", line);
      }
    }
  });

  sidecarProcess.stderr.on("data", (data) => {
    console.error("[nyvlo:sidecar] stderr:", data.toString());
  });

  sidecarProcess.on("exit", (code) => {
    console.log(`[nyvlo:sidecar] exited with code ${code}`);
    sidecarProcess = null;
    sidecarSessionId = null;
    notifyRenderer("capture:stopped", { code });
    updateTrayMenu(false);
  });

  sidecarProcess.on("error", (err) => {
    console.error("[nyvlo:sidecar] spawn error:", err.message);
    notifyRenderer("capture:error", { message: err.message });
    sidecarProcess = null;
    updateTrayMenu(false);
  });
}

function handleSidecarMessage(msg) {
  switch (msg.type) {
    case "started":
      sidecarSessionId = msg.sessionId;
      notifyRenderer("capture:started", { sessionId: msg.sessionId });
      updateTrayMenu(true);
      break;
    case "chunk":
      notifyRenderer("capture:chunk", msg);
      break;
    case "ended":
      notifyRenderer("capture:ended", {});
      sidecarProcess = null;
      sidecarSessionId = null;
      updateTrayMenu(false);
      break;
    case "error":
      notifyRenderer("capture:error", { message: msg.message });
      break;
    default:
      notifyRenderer("capture:event", msg);
  }
}

function stopSidecar() {
  if (sidecarProcess && !sidecarProcess.killed) {
    try {
      sidecarProcess.stdin.write(JSON.stringify({ action: "stop" }) + "\n");
    } catch (e) {
      console.warn("[nyvlo] failed to write stop to sidecar stdin", e);
      sidecarProcess.kill("SIGTERM");
    }
  }
}

// --- Window & Tray --------------------------------------------------------
let win = null;
let tray = null;
let isRecording = false;

function notifyRenderer(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

function createTrayIcon(recording) {
  // Create a simple 16x16 tray icon — circle indicator
  const size = 16;
  const canvas = nativeImage.createEmpty();
  // Use a template image for macOS menu bar
  if (recording) {
    // Red dot when recording (visible indicator)
    return nativeImage.createFromDataURL(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAiklEQVQ4T2P8z8Dwn4EIwEg0AwYMsOH/GRj+MxABGIk2YOAMAGGA4T8DEYCRGBcMeAAM/xmIAIzEuGDAA4DhPwMRgJEYFwx4ADDAMOD/fwYiACMxLhjwAGD4z0AEYCSGC0Y8ABj+MxABGIlxwYAHAMN/BiIAIzEuGPAAYPjPQARgJMYFAx4AAGzCMBHK6bkAAAAASUVORK5CYII=",
    );
  }
  // Normal state — monochrome microphone-like icon
  return nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAhElEQVQ4T2NkoBAwUqifgWoGMP5nYPjPQARgJNoFxBswYAb8Z2AgAjAS7QKSDWA4DMPEuGDEG/CfgYEIwEiMC0a8Af8ZGIgAjMS4YMQb8J+BgQjASIwLRrwB/xkYiACMxLhgxBvwn4GBCMBIjAtGvAH/GRiIAIzEuGDEGwAAe9owEQ/VVCEAAAAASUVORK5CYII=",
  );
}

function updateTrayMenu(recording) {
  isRecording = recording;
  if (!tray) return;
  tray.setImage(createTrayIcon(recording));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: recording ? "⏺ Recording…" : "Nyvlo",
      enabled: false,
    },
    { type: "separator" },
    {
      label: recording ? "Stop Recording" : "Start Recording",
      click: () => {
        if (recording) {
          stopSidecar();
        } else {
          showWindow();
        }
      },
    },
    { type: "separator" },
    {
      label: "Show Window",
      click: showWindow,
    },
    {
      label: "Quit",
      click: () => app.quit(),
    },
  ]);
  tray.setContextMenu(contextMenu);
  tray.setToolTip(recording ? "Nyvlo — Recording" : "Nyvlo");
}

function showWindow() {
  if (win && !win.isDestroyed()) {
    win.show();
    win.focus();
    return;
  }
  createWindow();
}

function createWindow() {
  win = new BrowserWindow({
    width: 380,
    height: 480,
    title: "Nyvlo",
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: "#0b0b0b",
    titleBarStyle: "hiddenInset",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.once("ready-to-show", () => win.show());

  win.on("close", (e) => {
    // On macOS, hide window instead of quitting (menu-bar app behavior)
    if (process.platform === "darwin") {
      e.preventDefault();
      win.hide();
    }
  });

  win.loadFile(path.join(__dirname, "renderer", "index.html"));
}

// --- App lifecycle --------------------------------------------------------

// Hide dock icon on macOS (menu-bar only)
if (process.platform === "darwin") {
  app.dock.hide();
}

app.whenReady().then(() => {
  // Create tray
  tray = new Tray(createTrayIcon(false));
  updateTrayMenu(false);

  // Left-click on tray shows the window
  tray.on("click", showWindow);

  createWindow();
});

app.on("window-all-closed", () => {
  // Don't quit on window close — we're a menu-bar app
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  showWindow();
});

app.on("before-quit", () => {
  // Ensure sidecar is stopped on quit
  stopSidecar();
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

// --- Sidecar IPC ----------------------------------------------------------
ipcMain.handle("nyvlo:startCapture", async (_event, { label }) => {
  if (sidecarProcess) {
    return { ok: false, error: "Already recording" };
  }
  const sess = await refreshIfNeeded();
  if (!sess) {
    return { ok: false, error: "Not signed in" };
  }

  // Consent: show confirmation dialog before starting
  const choice = await dialog.showMessageBox(win, {
    type: "question",
    buttons: ["Start recording", "Cancel"],
    defaultId: 0,
    cancelId: 1,
    title: "Start recording?",
    message: "Nyvlo will record your microphone and system audio for this meeting.",
    detail: "A recording indicator will be visible in your menu bar while recording is active.",
  });
  if (choice.response !== 0) {
    return { ok: false, error: "Cancelled by user" };
  }

  spawnSidecar(sess.access_token, label || "Meeting");
  return { ok: true };
});

ipcMain.handle("nyvlo:stopCapture", async () => {
  if (!sidecarProcess) {
    return { ok: false, error: "Not recording" };
  }
  stopSidecar();
  return { ok: true };
});

ipcMain.handle("nyvlo:isRecording", async () => {
  return { recording: !!sidecarProcess, sessionId: sidecarSessionId };
});
