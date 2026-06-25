const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("nyvlo", {
  quit: () => ipcRenderer.invoke("nyvlo:quit"),
  getSession: () => ipcRenderer.invoke("nyvlo:getSession"),
  getAccessToken: () => ipcRenderer.invoke("nyvlo:getAccessToken"),
  signIn: () => ipcRenderer.invoke("nyvlo:signIn"),
  signOut: () => ipcRenderer.invoke("nyvlo:signOut"),
  apiBase: () => ipcRenderer.invoke("nyvlo:apiBase"),

  // Sidecar capture controls
  startCapture: () => ipcRenderer.invoke("nyvlo:startCapture"),
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
    const handler = (_e, payload) => cb(payload);
    ipcRenderer.on("capture:event", handler);
    ipcRenderer.on("capture:recording", handler);
    ipcRenderer.on("capture:error", handler);
    return () => {
      ipcRenderer.removeListener("capture:event", handler);
      ipcRenderer.removeListener("capture:recording", handler);
      ipcRenderer.removeListener("capture:error", handler);
    };
  },
});
