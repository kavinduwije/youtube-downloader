// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    downloadVideo: (url) => ipcRenderer.send('download-video', url),
    onDownloadComplete: (callback) => ipcRenderer.on('download-complete', callback),
    onDownloadError: (callback) => ipcRenderer.on('download-error', callback),
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', callback)
});
