const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("nyvlo", {
  quit: () => ipcRenderer.invoke("nyvlo:quit"),
});
