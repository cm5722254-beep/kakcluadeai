const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File System & Dialogs
  openFolderDialog: (defaultPath) => ipcRenderer.invoke('dialog:openFolder', defaultPath),
  selectFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),
  readDir: (dirPath) => ipcRenderer.invoke('fs:readDir', dirPath),
  readDirTree: (dirPath) => ipcRenderer.invoke('fs:readDirTree', dirPath),
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
  createItem: (itemPath, isDir) => ipcRenderer.invoke('fs:create', itemPath, isDir),
  createFile: (filePath) => ipcRenderer.invoke('fs:createFile', filePath),
  createDirectory: (dirPath) => ipcRenderer.invoke('fs:createDirectory', dirPath),
  renameItem: (oldPath, newPath) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
  deleteItem: (itemPath) => ipcRenderer.invoke('fs:delete', itemPath),
  watchWorkspace: (dirPath) => ipcRenderer.invoke('fs:watch', dirPath),
  searchWorkspace: (query) => ipcRenderer.invoke('fs:searchWorkspace', query),
  getWorkspacePath: () => ipcRenderer.invoke('fs:getWorkspacePath'),
  setWorkspacePath: (dirPath) => ipcRenderer.invoke('fs:setWorkspacePath', dirPath),
  onFileChange: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('fs:change', handler);
    return () => ipcRenderer.removeListener('fs:change', handler);
  },

  // Server Management
  startServer: () => ipcRenderer.invoke('server:start'),
  stopServer: () => ipcRenderer.invoke('server:stop'),
  getServerStatus: () => ipcRenderer.invoke('server:status'),
  getServerLogs: () => ipcRenderer.invoke('server:logs'),
  onServerLog: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('server:log', handler);
    return () => ipcRenderer.removeListener('server:log', handler);
  },
  onServerStatus: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('server:statusChange', handler);
    return () => ipcRenderer.removeListener('server:statusChange', handler);
  },

  // Terminal (node-pty multi-session)
  createTerminal: (options) => ipcRenderer.invoke('term:create', options),
  writeTerminalSession: (id, data) => ipcRenderer.invoke('term:write', { id, data }),
  resizeTerminalSession: (id, cols, rows) => ipcRenderer.invoke('term:resize', { id, cols, rows }),
  killTerminalSession: (id) => ipcRenderer.invoke('term:kill', { id }),
  onTermData: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('term:data', handler);
    return () => ipcRenderer.removeListener('term:data', handler);
  },
  onTermExit: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('term:exit', handler);
    return () => ipcRenderer.removeListener('term:exit', handler);
  },
  // Legacy Terminal bindings
  startTerminal: () => ipcRenderer.invoke('terminal:start'),
  writeTerminal: (data) => ipcRenderer.invoke('terminal:write', data),
  resizeTerminal: (cols, rows) => ipcRenderer.invoke('terminal:resize', { cols, rows }),
  restartTerminal: () => ipcRenderer.invoke('terminal:restart'),
  onTerminalData: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('term:data', (event, pkg) => callback(typeof pkg === 'object' ? pkg.data : pkg));
    return () => {};
  },

  // Key Manager (safeStorage encrypted)
  generateKey: (data) => ipcRenderer.invoke('keys:generate', data),
  listKeys: () => ipcRenderer.invoke('keys:list'),
  getKeys: () => ipcRenderer.invoke('keys:list'),
  revokeKey: (id) => ipcRenderer.invoke('keys:revoke', id),
  deleteKey: (id) => ipcRenderer.invoke('keys:revoke', id),
  getPlainKey: (id) => ipcRenderer.invoke('keys:getPlain', id),

  // Auto Installer & System Diagnostics
  checkInstaller: () => ipcRenderer.invoke('installer:check'),
  runInstaller: () => ipcRenderer.invoke('installer:run'),
  cancelInstaller: () => ipcRenderer.invoke('installer:cancel'),
  onInstallerProgress: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('installer:progress', handler);
    return () => ipcRenderer.removeListener('installer:progress', handler);
  },
  // Legacy setup bindings
  checkSystem: () => ipcRenderer.invoke('system:check'),
  runAutoSetup: () => ipcRenderer.invoke('system:autoSetup'),
  onSetupProgress: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('setup:progress', handler);
    return () => ipcRenderer.removeListener('setup:progress', handler);
  },

  // AI Assistant (Streaming, Chat, Cancel)
  sendAIChat: (payload) => ipcRenderer.invoke('ai:chat', payload),
  startAIStream: (payload) => ipcRenderer.invoke('ai:stream', payload),
  cancelAIStream: (id) => ipcRenderer.invoke('ai:cancel', { id }),
  onAIChunk: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('ai:chunk', handler);
    return () => ipcRenderer.removeListener('ai:chunk', handler);
  },
  onAIEnd: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('ai:end', handler);
    return () => ipcRenderer.removeListener('ai:end', handler);
  },
  onAIError: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('ai:error', handler);
    return () => ipcRenderer.removeListener('ai:error', handler);
  },

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:set', settings),

  // Claude CLI & External Shell
  launchClaudeCode: (options) => ipcRenderer.invoke('claude:launch', options),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),

  // Window Controls (frameless titlebar)
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isWindowMaximized: () => ipcRenderer.invoke('window:isMaximized')
});
