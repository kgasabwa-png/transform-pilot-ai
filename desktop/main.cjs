// Nyvlo desktop main process.
// Creates a small always-on-top recording window with mic + system-audio capture.
const { app, BrowserWindow, ipcMain, desktopCapturer, session, dialog } = require("electron");
const path = require("path");

let win;

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

  // Confirm with the user before granting getDisplayMedia. Required on
  // Electron 28+ for navigator.mediaDevices.getDisplayMedia() — without the
  // prompt the OS-granted Screen Recording permission would let Nyvlo capture
  // silently if invoked by a malicious page or stale renderer.
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

ipcMain.handle("nyvlo:quit", () => app.quit());
