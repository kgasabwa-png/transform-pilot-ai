// Nyvlo desktop main process.
// - Runs as a menu-bar (Tray) app with a small recording indicator.
// - Manages sign-in via the device-link flow against the Nyvlo web app
//   (no manual tokens, no copy-paste). Opens default browser, user approves
//   once, tokens are stored locally and auto-refreshed.
// - Launches the Swift sidecar (NyvloCapture) as a child process for
//   mic + system audio capture via Core Audio process-tap (macOS 14.4+)
//   or ScreenCaptureKit fallback.
const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
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
    expires_at: result.expires_at, // seconds
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
let tray;

function notifyRenderer(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

// --- Sidecar binary path --------------------------------------------------
function sidecarBinaryPath() {
  // When packaged, the sidecar binary lives in Contents/Resources/bin/
  const resourcesBin = path.join(process.resourcesPath || "", "bin", "NyvloCapture");
  if (fs.existsSync(resourcesBin)) return resourcesBin;
  // During development, look for the swift build output
  const devBin = path.join(__dirname, "sidecar", ".build", "release", "NyvloCapture");
  if (fs.existsSync(devBin)) return devBin;
  return null;
}

// --- Sidecar child process ------------------------------------------------
let sidecarProcess = null;

function startSidecar(token, label) {
  const binPath = sidecarBinaryPath();
  if (!binPath) {
    notifyRenderer("sidecar:error", {
      message:
        "NyvloCapture binary not found. Build it with: cd desktop/sidecar && swift build -c release",
    });
    return false;
  }

  const args = [
    "--token",
    token,
    "--api",
    API_BASE,
    "--label",
    label || "Capture session",
    "--audio-only",
  ];

  sidecarProcess = spawn(binPath, args, { stdio: ["pipe", "pipe", "pipe"] });

  let lineBuf = "";
  sidecarProcess.stdout.on("data", (data) => {
    lineBuf += data.toString();
    const lines = lineBuf.split("\n");
    lineBuf = lines.pop(); // keep incomplete last line
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        notifyRenderer(`sidecar:${msg.type}`, msg);
        if (msg.type === "started") {
          updateTrayRecording(true);
        } else if (msg.type === "ended") {
          updateTrayRecording(false);
        }
      } catch {
        console.warn("[nyvlo] sidecar unparseable:", line);
      }
    }
  });

  sidecarProcess.stderr.on("data", (data) => {
    console.warn("[nyvlo] sidecar stderr:", data.toString());
  });

  sidecarProcess.on("close", (code) => {
    console.log("[nyvlo] sidecar exited:", code);
    sidecarProcess = null;
    updateTrayRecording(false);
    notifyRenderer("sidecar:exited", { code });
  });

  sidecarProcess.on("error", (err) => {
    console.error("[nyvlo] sidecar spawn error:", err);
    sidecarProcess = null;
    notifyRenderer("sidecar:error", { message: err.message });
  });

  return true;
}

function stopSidecar() {
  if (!sidecarProcess) return;
  try {
    sidecarProcess.stdin.write('{"action":"stop"}\n');
  } catch {
    // If stdin is already closed, just kill the process
    sidecarProcess.kill("SIGTERM");
  }
}

// --- Tray (menu-bar app) --------------------------------------------------

function createTrayIcon(recording) {
  if (recording) {
    // Red recording dot
    return nativeImage.createFromDataURL(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAARklEQVQ4T2P8z8Dwn4EIwEg0AwYYwH8GBgZGYjTDNDMSYwDIGUQZMOpcQJTrGUddMOoCMjwxalcPfBDhyY8oP6JHI1FhAACz1RoRhoyHhgAAAABJRU5ErkJggg==",
    );
  }
  // Idle/normal icon — dark circle outline
  return nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAPUlEQVQ4T2P8z8Dwn4EIwEg0A+gfBIxEG0C0BqLCgGjXD3wQjbqAKBeMusDIyYIRkxlH0wOiXE9UGAAA9LkKER3JsaMAAAAASUVORK5CYII=",
  );
}

function updateTrayRecording(recording) {
  if (!tray) return;
  tray.setImage(createTrayIcon(recording));
  tray.setToolTip(recording ? "Nyvlo — Recording…" : "Nyvlo");
  rebuildTrayMenu(recording);
}

function rebuildTrayMenu(recording) {
  const template = [];

  if (recording) {
    template.push({ label: "● Recording…", enabled: false });
    template.push({
      label: "Stop Recording",
      click: () => {
        stopSidecar();
        notifyRenderer("sidecar:stopping", {});
      },
    });
  } else {
    template.push({
      label: "Start Recording",
      click: () => {
        if (win && !win.isDestroyed()) {
          win.show();
          win.focus();
        }
      },
    });
  }

  template.push({ type: "separator" });
  template.push({
    label: "Show Window",
    click: () => {
      if (win && !win.isDestroyed()) {
        win.show();
        win.focus();
      }
    },
  });
  template.push({ type: "separator" });
  template.push({
    label: "Quit Nyvlo",
    click: () => {
      stopSidecar();
      app.quit();
    },
  });

  tray.setContextMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  win = new BrowserWindow({
    width: 380,
    height: 540,
    title: "Nyvlo",
    resizable: true,
    alwaysOnTop: false,
    backgroundColor: "#0b0b0b",
    skipTaskbar: true,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Keep the display-media handler for the in-window fallback path
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
    const { desktopCapturer } = require("electron");
    const sources = await desktopCapturer.getSources({ types: ["screen"] });
    callback({ video: sources[0], audio: "loopback" });
  });

  // Hide to tray on close instead of quitting (macOS convention)
  win.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });

  win.loadFile(path.join(__dirname, "renderer", "index.html"));
}

app.on("before-quit", () => {
  app.isQuitting = true;
  stopSidecar();
});

app.whenReady().then(() => {
  // Set up tray
  tray = new Tray(createTrayIcon(false));
  tray.setToolTip("Nyvlo");
  rebuildTrayMenu(false);

  tray.on("click", () => {
    if (win && !win.isDestroyed()) {
      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
        win.focus();
      }
    }
  });

  createWindow();

  // macOS: hide dock icon for true menu-bar app experience
  if (process.platform === "darwin") {
    app.dock.hide();
  }
});

app.on("window-all-closed", () => {
  // On macOS, keep running in menu bar even when window is closed
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (win && !win.isDestroyed()) {
    win.show();
    win.focus();
  } else if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// --- IPC ------------------------------------------------------------------
ipcMain.handle("nyvlo:quit", () => {
  stopSidecar();
  app.quit();
});

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
ipcMain.handle("nyvlo:sidecarAvailable", async () => {
  return sidecarBinaryPath() !== null;
});

ipcMain.handle("nyvlo:startSidecar", async (_event, { label }) => {
  if (sidecarProcess) return { ok: false, error: "Already recording" };
  const sess = await refreshIfNeeded();
  if (!sess) return { ok: false, error: "Not signed in" };
  const ok = startSidecar(sess.access_token, label);
  return { ok };
});

ipcMain.handle("nyvlo:stopSidecar", async () => {
  stopSidecar();
  return { ok: true };
});

ipcMain.handle("nyvlo:sidecarStatus", async () => {
  return { running: sidecarProcess !== null };
});
