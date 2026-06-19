// Nyvlo desktop main process.
// Creates a small always-on-top recording window with mic + system-audio capture.
const { app, BrowserWindow, ipcMain, desktopCapturer, session } = require("electron");
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

  // Auto-grant getDisplayMedia by handing back the first screen source.
  // Required on Electron 28+ for navigator.mediaDevices.getDisplayMedia().
  session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
    desktopCapturer.getSources({ types: ["screen"] }).then((sources) => {
      callback({ video: sources[0], audio: "loopback" });
    });
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
