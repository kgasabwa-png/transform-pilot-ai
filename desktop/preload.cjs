const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("nyvlo", {
  quit: () => ipcRenderer.invoke("nyvlo:quit"),
  getSession: () => ipcRenderer.invoke("nyvlo:getSession"),
  getAccessToken: () => ipcRenderer.invoke("nyvlo:getAccessToken"),
  signIn: () => ipcRenderer.invoke("nyvlo:signIn"),
  signOut: () => ipcRenderer.invoke("nyvlo:signOut"),
  apiBase: () => ipcRenderer.invoke("nyvlo:apiBase"),
  onAuthEvent: (cb) => {
    const handler = (_e, payload) => cb(payload);
    ipcRenderer.on("auth:signed-in", handler);
    ipcRenderer.on("auth:waiting", handler);
    return () => {
      ipcRenderer.removeListener("auth:signed-in", handler);
      ipcRenderer.removeListener("auth:waiting", handler);
    };
  },
});
