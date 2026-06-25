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
    const handler = (_e, payload) => cb(payload);
    for (const ev of events) {
      ipcRenderer.on(ev, (_e, payload) => cb({ event: ev.replace("capture:", ""), ...payload }));
    }
    return () => {
      for (const ev of events) {
        ipcRenderer.removeAllListeners(ev);
      }
    };
  },
});
