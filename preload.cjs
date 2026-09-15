const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('scoreStorage', {
  read: () => ipcRenderer.invoke('scores:read'),
  add: entry => ipcRenderer.invoke('scores:add', entry),
  clear: () => ipcRenderer.invoke('scores:clear'),
});
