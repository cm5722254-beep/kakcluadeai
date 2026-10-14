const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cheatzAPI', {
  // Window control
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // External shell
  openExternal: (url) => ipcRenderer.send('open-external', url),

  // Server management
  checkServerProcess: () => ipcRenderer.invoke('check-server-process'),
  startServerProcess: () => ipcRenderer.invoke('start-server-process'),
  restartServerProcess: () => ipcRenderer.invoke('restart-server-process'),
  stopServerProcess: () => ipcRenderer.invoke('stop-server-process'),

  // Claude CLI integration
  launchClaudeCli: () => ipcRenderer.invoke('launch-claude-cli'),

  // Native clipboard & notification
  copyText: (text) => ipcRenderer.send('copy-text', text)
});
