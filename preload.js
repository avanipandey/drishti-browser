'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('drishti', {
  cmd: (c, a) => ipcRenderer.send('cmd', c, a),
  onTabs: (f) => ipcRenderer.on('tabs', (_e, tabs, active) => f(tabs, active)),
  onFocusUrl: (f) => ipcRenderer.on('focus-url', f),
});
