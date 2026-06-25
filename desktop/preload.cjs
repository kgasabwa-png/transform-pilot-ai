const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("nyvlo", {
  quit: () => ipcRenderer.invoke("nyvlo:quit"),
  getSession: () => ipcRenderer.invoke("nyvlo:getSession"),
  getAccessToken: () => ipcRenderer.invoke("nyvlo:getAccessToken"),
  signIn: () => ipcRenderer.invoke("nyvlo:signIn"),
  signOut: () => ipcRenderer.invoke("nyvlo:signOut"),
  apiBase: () => ipcRenderer.invoke("nyvlo:apiBase"),

  // Sidecar capture control
  startCapture: (label) => ipcRenderer.invoke("nyvlo:startCapture", { label }),
  stopCapture: () => ipcRenderer.invoke("nyvlo:stopCapture"),
  isRecording: () => ipcRenderer.invoke("nyvlo:isRecording"),

  // Event listeners
  onAuthEvent: (cb) => {
    const handler = (_e, payload) => cb(payload);
    ipcRenderer.on("auth:signed-in", handler);
    ipcRenderer.on("auth:waiting", handler);
    return () => {
      ipcRenderer.removeListener("auth:signed-in", handler);
      ipcRenderer.removeListener("auth:waiting", handler);
    };
  },
  onCaptureEvent: (cb) => {
    const events = [
      "capture:started",
      "capture:chunk",
      "capture:ended",
      "capture:stopped",
      "capture:error",
      "capture:event",
    ];
    const handlers = [];
    for (const ev of events) {
      const h = (_e, payload) => cb({ event: ev.replace("capture:", ""), ...payload });
      ipcRenderer.on(ev, h);
      handlers.push([ev, h]);
    }
    return () => {
      for (const [ev, h] of handlers) {
        ipcRenderer.removeListener(ev, h);
      }
    };
  },
});
