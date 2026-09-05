const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  checkBinaries: () => ipcRenderer.invoke('app:check-binaries'),
  getDefaultPath: () => ipcRenderer.invoke('app:get-default-path'),
  readClipboard: () => ipcRenderer.invoke('clipboard:read'),
  selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),
  selectCookieFile: () => ipcRenderer.invoke('dialog:select-cookie-file'),
  openFolder: (folderPath) => ipcRenderer.invoke('shell:open-folder', folderPath),

  openLoginWindow: (platform) => ipcRenderer.invoke('auth:open-login', platform),
  checkAuthStatus: () => ipcRenderer.invoke('auth:check-status'),
  logout: () => ipcRenderer.invoke('auth:logout'),
  onAuthStatusChanged: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('auth:status-changed', handler);
    return () => ipcRenderer.removeListener('auth:status-changed', handler);
  },

  startDownload: (options) => ipcRenderer.invoke('download:start', options),
  cancelDownload: () => ipcRenderer.invoke('download:cancel'),

  onProgressData: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download:progress-data', handler);
    return () => ipcRenderer.removeListener('download:progress-data', handler);
  },

  onLog: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download:log', handler);
    return () => ipcRenderer.removeListener('download:log', handler);
  },

  onComplete: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download:complete', handler);
    return () => ipcRenderer.removeListener('download:complete', handler);
  },

  onError: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download:error', handler);
    return () => ipcRenderer.removeListener('download:error', handler);
  },

  onCancelled: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download:cancelled', handler);
    return () => ipcRenderer.removeListener('download:cancelled', handler);
  }
});
