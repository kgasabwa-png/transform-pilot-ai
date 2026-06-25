// Nyvlo desktop main process — menu-bar app with Swift sidecar audio capture.
//
// - Runs as a macOS menu-bar (Tray) app with a small popover window.
// - Spawns the NyvloCapture Swift sidecar for audio capture (Core Audio on
//   macOS 14.4+, ScreenCaptureKit fallback on older).
// - Maintains sign-in via the device-link flow (no manual tokens).
// - Visible recording indicator in the tray; explicit user "Start" action.

const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  session,
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
  return res.json();
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

// --- Tray & Window --------------------------------------------------------
let tray = null;
let win = null;
let isRecording = false;

function notifyRenderer(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

function getSidecarPath() {
  // In development: look for the compiled binary in the sidecar build dir
  const devPath = path.join(__dirname, "sidecar", ".build", "release", "NyvloCapture");
  if (fs.existsSync(devPath)) return devPath;
  // In packaged app: look in Resources/bin/
  const packaged = path.join(process.resourcesPath || __dirname, "bin", "NyvloCapture");
  if (fs.existsSync(packaged)) return packaged;
  return null;
}

function createTrayIcon() {
  // 16x16 template image for macOS menu bar (idle state)
  const idleIcon = nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAARklEQVQ4y2NgGAWDATAyMDD8J0Pvf2IGMBGp+T8lBlBkANUNYKKGF0ZcgZhogBKD/5PiBdIMYKKGIeMKJAcixQFJsyAcDAAALLwLw7vkPbcAAAAASUVORK5CYII=",
  );
  idleIcon.setTemplateImage(true);
  tray = new Tray(idleIcon);
  tray.setToolTip("Nyvlo");
  updateTrayMenu();
  tray.on("click", toggleWindow);
}

function getRecordingIcon() {
  const recIcon = nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAS0lEQVQ4y2NgGAWDADAwMPwnRe9/YgYwEan5PyUGUN0AJmp4YcQViIkGKDH4PyleIM0AJmoYMq5AciD+p8QAJmoYQnIgUhyQNAtCBgAAiasRYPgs0iUAAAAASUVORK5CYII=",
  );
  recIcon.setTemplateImage(true);
  return recIcon;
}

function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    { label: isRecording ? "⏺ Recording…" : "Nyvlo", enabled: false },
    { type: "separator" },
    {
      label: isRecording ? "Stop Recording" : "Start Recording",
      click: () => {
        if (isRecording) {
          stopSidecar();
        } else {
          startSidecar();
        }
      },
    },
    { label: "Show Window", click: () => showWindow() },
    { type: "separator" },
    { label: "Quit", click: () => app.quit() },
  ]);
  tray.setContextMenu(contextMenu);
}

function createWindow() {
  win = new BrowserWindow({
    width: 340,
    height: 460,
    title: "Nyvlo",
    resizable: true,
    show: false,
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: "#0b0b0b",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, "renderer", "index.html"));
  win.on("blur", () => {
    if (!isRecording) win.hide();
  });
  win.on("close", (e) => {
    e.preventDefault();
    win.hide();
  });
}

function toggleWindow() {
  if (!win) createWindow();
  if (win.isVisible()) {
    win.hide();
  } else {
    showWindow();
  }
}

function showWindow() {
  if (!win) createWindow();
  // Position near tray icon
  const trayBounds = tray.getBounds();
  const winBounds = win.getBounds();
  const x = Math.round(trayBounds.x + trayBounds.width / 2 - winBounds.width / 2);
  const y = trayBounds.y + trayBounds.height + 4;
  win.setPosition(x, y, false);
  win.show();
  win.focus();
}

// --- Sidecar management ---------------------------------------------------
let sidecarProcess = null;

function startSidecar() {
  const sidecarPath = getSidecarPath();
  if (!sidecarPath) {
    notifyRenderer("capture:error", {
      message: "NyvloCapture binary not found. Run: cd desktop/sidecar && swift build -c release",
    });
    return;
  }

  refreshIfNeeded().then((sess) => {
    if (!sess) {
      notifyRenderer("capture:error", { message: "Not signed in." });
      return;
    }

    const args = [
      "--token",
      sess.access_token,
      "--api",
      API_BASE,
      "--label",
      "Meeting",
      "--audio-only",
    ];

    sidecarProcess = spawn(sidecarPath, args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    isRecording = true;
    updateTrayMenu();
    tray.setImage(getRecordingIcon());
    notifyRenderer("capture:recording", { recording: true });

    let lineBuffer = "";
    sidecarProcess.stdout.on("data", (data) => {
      lineBuffer += data.toString();
      const lines = lineBuffer.split("\n");
      lineBuffer = lines.pop(); // keep incomplete line
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          notifyRenderer("capture:event", msg);
        } catch {}
      }
    });

    sidecarProcess.stderr.on("data", (data) => {
      console.warn("[sidecar stderr]", data.toString());
    });

    sidecarProcess.on("exit", (code) => {
      sidecarProcess = null;
      isRecording = false;
      updateTrayMenu();
      createTrayIcon_resetImage();
      notifyRenderer("capture:recording", { recording: false });
      notifyRenderer("capture:event", { type: "ended", exitCode: code });
    });
  });
}

function stopSidecar() {
  if (sidecarProcess && sidecarProcess.stdin.writable) {
    sidecarProcess.stdin.write(JSON.stringify({ action: "stop" }) + "\n");
  }
}

function createTrayIcon_resetImage() {
  if (!tray) return;
  const idleIcon = nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAARklEQVQ4y2NgGAWDATAyMDD8J0Pvf2IGMBGp+T8lBlBkANUNYKKGF0ZcgZhogBKD/5PiBdIMYKKGIeMKJAcixQFJsyAcDAAALLwLw7vkPbcAAAAASUVORK5CYII=",
  );
  idleIcon.setTemplateImage(true);
  tray.setImage(idleIcon);
}

// --- App lifecycle ---------------------------------------------------------
app.dock && app.dock.hide(); // Hide dock icon (menu-bar only)

app.whenReady().then(() => {
  createTrayIcon();
  createWindow();
});

app.on("window-all-closed", (e) => {
  // Don't quit on window close — we're a menu bar app
  e?.preventDefault?.();
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

ipcMain.handle("nyvlo:startCapture", async () => {
  if (isRecording) return { ok: false, error: "Already recording" };
  startSidecar();
  return { ok: true };
});

ipcMain.handle("nyvlo:stopCapture", async () => {
  if (!isRecording) return { ok: false, error: "Not recording" };
  stopSidecar();
  return { ok: true };
});

ipcMain.handle("nyvlo:isRecording", async () => {
  return isRecording;
});
