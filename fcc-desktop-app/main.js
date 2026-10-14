const { app, BrowserWindow, ipcMain, shell, dialog, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');
const crypto = require('crypto');
const { spawn, exec } = require('child_process');

let pty = null;
try {
  pty = require('node-pty');
} catch (e) {
  console.warn('node-pty load error, fallback will be used:', e);
}

// Window & Processes State
let mainWindow = null;
let serverProcess = null;
let serverStatus = 'STOPPED'; // STOPPED, STARTING, RUNNING, ERROR
let serverLogs = [];
const MAX_LOGS = 1000;
let serverHealthInterval = null;

// Multi-session Terminal state
const terminals = new Map(); // id -> { ptyProcess, shellPath }

// Workspace & Storage
const userDataPath = app.getPath('userData');
const keysFilePath = path.join(userDataPath, 'api_keys_secure.json');
const settingsFilePath = path.join(userDataPath, 'ide_settings.json');
let workspaceWatcher = null;
let workspaceWatchDebounce = null;

const defaultSettings = {
  port: 8082,
  host: '127.0.0.1',
  defaultModel: 'nvidia_nim/nvidia/nemotron-3-super-120b-a12b',
  theme: 'claude', // 'claude' (terracotta/obsidian), 'light' (alabaster), 'amber', 'charcoal'
  fontSize: 13,
  wordWrap: true,
  defaultShell: 'powershell',
  language: 'en', // 'en' or 'km'
  autoStartServer: false,
  lastWorkspace: path.join(process.env.USERPROFILE || 'C:\\', 'Documents', 'uv'),
  openTabs: [],
  activeTabPath: null,
  panelSizes: {
    sidebarWidth: 260,
    terminalHeight: 220,
    aiPanelWidth: 340
  }
};

let currentWorkspace = defaultSettings.lastWorkspace;

// ============================================================================
// Settings Management
// ============================================================================
function getSettings() {
  try {
    if (fs.existsSync(settingsFilePath)) {
      const data = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
      return { ...defaultSettings, ...data };
    }
  } catch (err) {
    console.error('Failed reading settings:', err);
  }
  return { ...defaultSettings };
}

function saveSettingsData(newSettings) {
  try {
    const merged = { ...getSettings(), ...newSettings };
    fs.writeFileSync(settingsFilePath, JSON.stringify(merged, null, 2), 'utf8');
    return merged;
  } catch (err) {
    console.error('Failed saving settings:', err);
    return getSettings();
  }
}

// ============================================================================
// SafeStorage / Encrypted Keys Storage
// ============================================================================
function encryptStringSafe(plain) {
  try {
    if (safeStorage && safeStorage.isEncryptionAvailable()) {
      return { enc: safeStorage.encryptString(plain).toString('base64'), method: 'safeStorage' };
    }
  } catch (e) {
    console.warn('safeStorage encrypt failed, falling back:', e);
  }
  // Fallback AES-256-CBC with machine-bound key
  const machineKey = crypto.createHash('sha256').update(process.env.COMPUTERNAME || 'ClaudeCodeStudioIDE').digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', machineKey, iv);
  let crypted = cipher.update(plain, 'utf8', 'base64');
  crypted += cipher.final('base64');
  return { enc: iv.toString('hex') + ':' + crypted, method: 'aes' };
}

function decryptStringSafe(record) {
  if (!record) return '';
  if (typeof record === 'string') return record;
  try {
    if (record.method === 'safeStorage' && safeStorage && safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(Buffer.from(record.enc, 'base64'));
    }
  } catch (e) {
    console.warn('safeStorage decrypt failed:', e);
  }
  if (record.method === 'aes' && record.enc && record.enc.includes(':')) {
    try {
      const [ivHex, cipherText] = record.enc.split(':');
      const machineKey = crypto.createHash('sha256').update(process.env.COMPUTERNAME || 'ClaudeCodeStudioIDE').digest();
      const decipher = crypto.createDecipheriv('aes-256-cbc', machineKey, Buffer.from(ivHex, 'hex'));
      let dec = decipher.update(cipherText, 'base64', 'utf8');
      dec += decipher.final('utf8');
      return dec;
    } catch (e) {
      console.warn('AES decrypt failed:', e);
    }
  }
  return record.enc || '';
}

function getStoredKeyRecords() {
  try {
    if (fs.existsSync(keysFilePath)) {
      return JSON.parse(fs.readFileSync(keysFilePath, 'utf8'));
    }
  } catch (err) {
    console.error('Failed reading keys file:', err);
  }
  return [];
}

function saveKeyRecords(records) {
  try {
    fs.writeFileSync(keysFilePath, JSON.stringify(records, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Failed writing keys file:', err);
    return false;
  }
}

// ============================================================================
// Logging & Server Status
// ============================================================================
function appendServerLog(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const entry = { timestamp, message: String(message), type };
  serverLogs.push(entry);
  if (serverLogs.length > MAX_LOGS) serverLogs.shift();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('server:log', entry);
  }
}

function setServerStatus(newStatus) {
  serverStatus = newStatus;
  const port = getSettings().port || 8082;
  const url = `http://127.0.0.1:${port}`;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('server:statusChange', { status: serverStatus, port, url });
  }
}

function checkPortOpen(port, host = '127.0.0.1', timeoutMs = 700) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isConnected = false;
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      isConnected = true;
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

function findFccServerExecutable() {
  const userProfile = process.env.USERPROFILE || '';
  const localBin = path.join(userProfile, '.local', 'bin', 'fcc-server.exe');
  if (fs.existsSync(localBin)) return localBin;
  return 'fcc-server';
}

function startFccServer() {
  if (serverProcess) {
    return { success: false, message: 'Server is already running' };
  }

  const port = getSettings().port || 8082;
  const exePath = findFccServerExecutable();
  appendServerLog(`Initiating FCC Server: ${exePath} on port ${port}`, 'info');
  setServerStatus('STARTING');

  const userProfile = process.env.USERPROFILE || '';
  const localBin = path.join(userProfile, '.local', 'bin');
  const npmBin = path.join(userProfile, 'AppData', 'Roaming', 'npm');
  const systemRoot = process.env.SystemRoot || process.env.windir || 'C:\\Windows';
  const system32 = path.join(systemRoot, 'System32');

  const env = { ...process.env };
  env.PATH = `${localBin};${npmBin};${system32};${systemRoot};${env.PATH || ''}`;
  env.Path = env.PATH;
  env.FCC_PORT = String(port);

  try {
    serverProcess = spawn(exePath, [], {
      env,
      shell: true,
      windowsHide: true
    });

    serverProcess.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      appendServerLog(text.trimEnd(), 'stdout');
      if (text.includes('Application startup complete') || text.includes('Uvicorn running') || text.includes('http://')) {
        setServerStatus('RUNNING');
      }
    });

    serverProcess.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      appendServerLog(text.trimEnd(), 'stderr');
      if (text.includes('Application startup complete') || text.includes('Uvicorn running')) {
        setServerStatus('RUNNING');
      }
    });

    serverProcess.on('error', (err) => {
      appendServerLog(`Server spawn failed: ${err.message}`, 'error');
      serverProcess = null;
      setServerStatus('ERROR');
    });

    serverProcess.on('close', (code) => {
      appendServerLog(`Server process exited with code ${code}`, code === 0 ? 'info' : 'warn');
      serverProcess = null;
      if (serverStatus !== 'STOPPED') {
        setServerStatus(code === 0 ? 'STOPPED' : 'ERROR');
      }
    });

    // Health-check loop: poll port for up to 10 seconds
    let attempts = 0;
    if (serverHealthInterval) clearInterval(serverHealthInterval);
    serverHealthInterval = setInterval(async () => {
      attempts++;
      const isOpen = await checkPortOpen(port);
      if (isOpen) {
        clearInterval(serverHealthInterval);
        serverHealthInterval = null;
        setServerStatus('RUNNING');
        appendServerLog(`Server is online and responding at http://127.0.0.1:${port}`, 'success');
      } else if (attempts > 12) {
        clearInterval(serverHealthInterval);
        serverHealthInterval = null;
        if (serverProcess && serverStatus === 'STARTING') {
          appendServerLog(`Warning: Server port ${port} did not respond within timeout`, 'warn');
        }
      }
    }, 800);

    return { success: true };
  } catch (err) {
    appendServerLog(`Exception starting server: ${err.message}`, 'error');
    setServerStatus('ERROR');
    return { success: false, error: err.message };
  }
}

function stopFccServer() {
  if (serverHealthInterval) {
    clearInterval(serverHealthInterval);
    serverHealthInterval = null;
  }

  if (!serverProcess) {
    setServerStatus('STOPPED');
    return { success: true };
  }

  appendServerLog('Stopping FCC Server...', 'info');
  try {
    if (process.platform === 'win32' && serverProcess.pid) {
      // Kill entire process tree cleanly on Windows
      exec(`taskkill /pid ${serverProcess.pid} /T /F`, (err) => {
        if (err) console.warn('Taskkill notice:', err.message);
      });
    } else {
      serverProcess.kill('SIGTERM');
    }
  } catch (err) {
    console.error('Error stopping server:', err);
  }

  serverProcess = null;
  setServerStatus('STOPPED');
  appendServerLog('FCC Server stopped.', 'warn');
  return { success: true };
}

// ============================================================================
// Shell Resolution & Integrated Terminal (node-pty)
// ============================================================================
function resolveTerminalShell(preferred = 'powershell') {
  const systemRoot = process.env.SystemRoot || process.env.windir || 'C:\\Windows';
  const defaultPs = path.join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const pwsh = path.join(programFiles, 'PowerShell', '7', 'pwsh.exe');
  const cmd = process.env.ComSpec || path.join(systemRoot, 'System32', 'cmd.exe');

  if (preferred === 'pwsh' && fs.existsSync(pwsh)) return pwsh;
  if (preferred === 'cmd' && fs.existsSync(cmd)) return cmd;
  if (fs.existsSync(defaultPs)) return defaultPs;
  if (fs.existsSync(pwsh)) return pwsh;
  return cmd;
}

function buildTerminalEnv() {
  const env = { ...process.env };
  const userProfile = process.env.USERPROFILE || '';
  const localBin = path.join(userProfile, '.local', 'bin');
  const npmBin = path.join(userProfile, 'AppData', 'Roaming', 'npm');
  const systemRoot = process.env.SystemRoot || process.env.windir || 'C:\\Windows';
  const system32 = path.join(systemRoot, 'System32');
  const wbem = path.join(systemRoot, 'System32', 'Wbem');
  const psHome = path.join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0');

  const existingPath = env.PATH || env.Path || '';
  env.PATH = `${localBin};${npmBin};${psHome};${system32};${systemRoot};${wbem};${existingPath}`;
  env.Path = env.PATH;
  env.SystemRoot = systemRoot;
  env.windir = systemRoot;
  env.ANTHROPIC_BASE_URL = `http://localhost:${getSettings().port || 8082}`;
  env.ANTHROPIC_API_KEY = 'sk-fcc-direct-access';
  env.TERM = 'xterm-256color';
  return env;
}

function createPtyTerminal(options = {}) {
  const id = options.id || `term-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const cols = options.cols || 80;
  const rows = options.rows || 24;
  const cwd = options.cwd || currentWorkspace || process.env.USERPROFILE || 'C:\\';
  const shellPath = resolveTerminalShell(options.shell || getSettings().defaultShell);

  if (terminals.has(id)) {
    try { terminals.get(id).ptyProcess.kill(); } catch (e) {}
    terminals.delete(id);
  }

  const env = buildTerminalEnv();

  if (pty) {
    try {
      const ptyProcess = pty.spawn(shellPath, [], {
        name: 'xterm-256color',
        cols,
        rows,
        cwd: fs.existsSync(cwd) ? cwd : (process.env.USERPROFILE || 'C:\\'),
        env
      });

      ptyProcess.onData((data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('term:data', { id, data });
        }
      });

      ptyProcess.onExit(({ exitCode }) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('term:exit', { id, exitCode });
        }
        terminals.delete(id);
      });

      terminals.set(id, { ptyProcess, shellPath });
      return { id, shell: shellPath, success: true };
    } catch (err) {
      appendServerLog(`node-pty spawn error: ${err.message}`, 'error');
    }
  }

  // Fallback to standard spawn if pty fails
  try {
    const cp = spawn(shellPath, ['-NoLogo', '-NoExit'], {
      cwd: fs.existsSync(cwd) ? cwd : (process.env.USERPROFILE || 'C:\\'),
      env,
      shell: true,
      windowsHide: true
    });

    cp.stdout.on('data', (d) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('term:data', { id, data: d.toString() });
      }
    });
    cp.stderr.on('data', (d) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('term:data', { id, data: d.toString() });
      }
    });
    cp.on('close', (code) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('term:exit', { id, exitCode: code });
      }
      terminals.delete(id);
    });

    terminals.set(id, {
      ptyProcess: {
        write: (d) => { if (cp.stdin && cp.stdin.writable) cp.stdin.write(d); },
        resize: () => {},
        kill: () => cp.kill()
      },
      shellPath
    });

    return { id, shell: shellPath, success: true };
  } catch (fallbackErr) {
    appendServerLog(`Fallback spawn error: ${fallbackErr.message}`, 'error');
    return { id, shell: shellPath, success: false, error: fallbackErr.message };
  }
}

// ============================================================================
// File System Operations & Watcher
// ============================================================================
function readDirectoryRecursive(dirPath, depth = 0, maxDepth = 3) {
  if (depth > maxDepth || !fs.existsSync(dirPath)) return [];
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    const result = [];
    const ignoreList = new Set(['.git', 'node_modules', '__pycache__', '.pytest_cache', 'dist', 'build', '.fcc', '.gemini']);

    for (const item of items) {
      if (ignoreList.has(item.name)) continue;
      const fullPath = path.join(dirPath, item.name);
      if (item.isDirectory()) {
        result.push({
          name: item.name,
          path: fullPath,
          isDir: true,
          children: depth < maxDepth ? readDirectoryRecursive(fullPath, depth + 1, maxDepth) : []
        });
      } else {
        result.push({
          name: item.name,
          path: fullPath,
          isDir: false,
          size: item.size
        });
      }
    }

    result.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });

    return result;
  } catch (err) {
    console.error('Error reading dir:', dirPath, err);
    return [];
  }
}

function startWorkspaceWatcher(targetDir) {
  if (workspaceWatcher) {
    try { workspaceWatcher.close(); } catch (e) {}
    workspaceWatcher = null;
  }
  if (!fs.existsSync(targetDir)) return;

  try {
    workspaceWatcher = fs.watch(targetDir, { recursive: true }, (eventType, filename) => {
      if (filename && (filename.includes('.git') || filename.includes('node_modules'))) return;
      clearTimeout(workspaceWatchDebounce);
      workspaceWatchDebounce = setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('fs:change', { eventType, filename });
        }
      }, 350);
    });
  } catch (e) {
    console.warn('Workspace watch notice:', e.message);
  }
}

// ============================================================================
// Window Creation
// ============================================================================
function createWindow() {
  const settings = getSettings();
  currentWorkspace = settings.lastWorkspace || path.join(process.env.USERPROFILE || 'C:\\', 'Documents');

  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 960,
    minHeight: 600,
    frame: false, // Custom styled title bar
    title: 'Claude Code Studio IDE',
    backgroundColor: '#181816',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false // needed for node-pty & contextBridge
    },
    show: false
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    startWorkspaceWatcher(currentWorkspace);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  stopFccServer();
  for (const [id, t] of terminals.entries()) {
    try { t.ptyProcess.kill(); } catch (e) {}
  }
  terminals.clear();
  if (workspaceWatcher) {
    try { workspaceWatcher.close(); } catch (e) {}
  }
});

app.on('window-all-closed', () => {
  stopFccServer();
  if (process.platform !== 'darwin') app.quit();
});

// ============================================================================
// IPC Handlers: Window Controls
// ============================================================================
ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (!mainWindow) return false;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    return false;
  } else {
    mainWindow.maximize();
    return true;
  }
});

ipcMain.handle('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// ============================================================================
// IPC Handlers: Server Management
// ============================================================================
ipcMain.handle('server:start', async () => startFccServer());
ipcMain.handle('server:stop', async () => stopFccServer());
ipcMain.handle('server:status', async () => {
  const port = getSettings().port || 8082;
  const isUp = await checkPortOpen(port);
  if (isUp && serverStatus === 'STOPPED') {
    serverStatus = 'RUNNING';
  }
  return {
    status: serverStatus,
    port,
    url: `http://127.0.0.1:${port}`,
    logs: serverLogs
  };
});
ipcMain.handle('server:logs', async () => serverLogs);

// ============================================================================
// IPC Handlers: File System & Workspace
// ============================================================================
ipcMain.handle('dialog:openFolder', async (event, defaultPath) => {
  const res = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    defaultPath: defaultPath || currentWorkspace
  });
  if (!res.canceled && res.filePaths.length > 0) {
    currentWorkspace = res.filePaths[0];
    saveSettingsData({ lastWorkspace: currentWorkspace });
    startWorkspaceWatcher(currentWorkspace);
    return currentWorkspace;
  }
  return null;
});

// Legacy alias
ipcMain.handle('fs:selectFolder', async () => {
  return ipcMain.emit ? null : null; // Handled directly above
});

ipcMain.handle('fs:readDir', async (event, dirPath) => {
  const target = dirPath || currentWorkspace;
  return {
    root: target,
    items: readDirectoryRecursive(target, 0, 3)
  };
});
ipcMain.handle('fs:readDirTree', async (event, dirPath) => {
  const target = dirPath || currentWorkspace;
  return {
    root: target,
    items: readDirectoryRecursive(target, 0, 3)
  };
});

ipcMain.handle('fs:readFile', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { success: true, content, path: filePath, name: path.basename(filePath) };
  } catch (err) {
    return { success: false, error: err.message, path: filePath, name: path.basename(filePath) };
  }
});

ipcMain.handle('fs:writeFile', async (event, filePath, content) => {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fs:create', async (event, itemPath, isDirectory = false) => {
  try {
    if (fs.existsSync(itemPath)) return { success: false, error: 'Item already exists' };
    if (isDirectory) {
      fs.mkdirSync(itemPath, { recursive: true });
    } else {
      const dir = path.dirname(itemPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(itemPath, '', 'utf8');
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
ipcMain.handle('fs:createFile', async (event, filePath) => {
  try {
    if (fs.existsSync(filePath)) return { success: false, error: 'File already exists' };
    fs.writeFileSync(filePath, '', 'utf8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
ipcMain.handle('fs:createDirectory', async (event, dirPath) => {
  try {
    if (fs.existsSync(dirPath)) return { success: false, error: 'Directory already exists' };
    fs.mkdirSync(dirPath, { recursive: true });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fs:rename', async (event, oldPath, newPath) => {
  try {
    if (!fs.existsSync(oldPath)) return { success: false, error: 'Source not found' };
    fs.renameSync(oldPath, newPath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
ipcMain.handle('fs:renameItem', async (event, oldPath, newPath) => {
  try {
    if (!fs.existsSync(oldPath)) return { success: false, error: 'Source not found' };
    fs.renameSync(oldPath, newPath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fs:delete', async (event, itemPath) => {
  try {
    if (!fs.existsSync(itemPath)) return { success: false, error: 'Item not found' };
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      fs.rmSync(itemPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(itemPath);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
ipcMain.handle('fs:deleteItem', async (event, itemPath) => {
  try {
    if (!fs.existsSync(itemPath)) return { success: false, error: 'Item not found' };
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      fs.rmSync(itemPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(itemPath);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fs:watch', async (event, dirPath) => {
  startWorkspaceWatcher(dirPath);
  return { success: true };
});

ipcMain.handle('fs:getWorkspacePath', async () => currentWorkspace);
ipcMain.handle('fs:setWorkspacePath', async (event, dirPath) => {
  if (fs.existsSync(dirPath)) {
    currentWorkspace = dirPath;
    saveSettingsData({ lastWorkspace: currentWorkspace });
    startWorkspaceWatcher(currentWorkspace);
    return true;
  }
  return false;
});

ipcMain.handle('fs:searchWorkspace', async (event, query) => {
  if (!query || query.trim().length < 2) return [];
  const results = [];
  const lowerQuery = query.toLowerCase();

  function scan(dir, depth = 0) {
    if (depth > 4 || results.length >= 75 || !fs.existsSync(dir)) return;
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      const ignore = new Set(['.git', 'node_modules', 'dist', 'build', '__pycache__', '.pytest_cache', '.fcc', '.gemini']);
      for (const item of items) {
        if (ignore.has(item.name)) continue;
        const full = path.join(dir, item.name);
        if (item.isDirectory()) {
          scan(full, depth + 1);
        } else {
          const lowerName = item.name.toLowerCase();
          if (lowerName.includes(lowerQuery)) {
            results.push({
              path: full,
              name: item.name,
              matchType: 'filename',
              line: 1,
              preview: `Matching file name: ${item.name}`
            });
          } else {
            try {
              const stat = fs.statSync(full);
              if (stat.size < 500000) {
                const text = fs.readFileSync(full, 'utf8');
                const idx = text.toLowerCase().indexOf(lowerQuery);
                if (idx !== -1) {
                  const lines = text.split('\n');
                  let count = 0;
                  let lineNum = 1;
                  let lineText = '';
                  for (let i = 0; i < lines.length; i++) {
                    count += lines[i].length + 1;
                    if (count > idx) {
                      lineNum = i + 1;
                      lineText = lines[i].trim();
                      break;
                    }
                  }
                  results.push({
                    path: full,
                    name: item.name,
                    matchType: 'content',
                    line: lineNum,
                    preview: lineText.length > 90 ? lineText.substring(0, 90) + '...' : lineText
                  });
                }
              }
            } catch (e) {}
          }
          if (results.length >= 75) return;
        }
      }
    } catch (e) {}
  }

  scan(currentWorkspace);
  return results;
});

// ============================================================================
// IPC Handlers: Terminal Management (Multi-Session node-pty)
// ============================================================================
ipcMain.handle('term:create', async (event, options = {}) => {
  return createPtyTerminal(options);
});

ipcMain.handle('term:write', async (event, { id, data }) => {
  const session = terminals.get(id);
  if (session && session.ptyProcess) {
    session.ptyProcess.write(data);
    return true;
  }
  return false;
});

ipcMain.handle('term:resize', async (event, { id, cols, rows }) => {
  const session = terminals.get(id);
  if (session && session.ptyProcess && session.ptyProcess.resize) {
    try {
      session.ptyProcess.resize(cols, rows);
      return true;
    } catch (e) {}
  }
  return false;
});

ipcMain.handle('term:kill', async (event, { id }) => {
  const session = terminals.get(id);
  if (session) {
    try { session.ptyProcess.kill(); } catch (e) {}
    terminals.delete(id);
    return true;
  }
  return false;
});

// Legacy terminal aliases
ipcMain.handle('terminal:start', async () => createPtyTerminal({ id: 'default-term' }));
ipcMain.handle('terminal:write', async (event, data) => {
  let session = terminals.get('default-term');
  if (!session) {
    session = createPtyTerminal({ id: 'default-term' });
  }
  const s = terminals.get('default-term');
  if (s && s.ptyProcess) {
    s.ptyProcess.write(data);
    return true;
  }
  return false;
});
ipcMain.handle('terminal:resize', async (event, { cols, rows }) => {
  const s = terminals.get('default-term');
  if (s && s.ptyProcess && s.ptyProcess.resize) {
    s.ptyProcess.resize(cols, rows);
    return true;
  }
  return false;
});
ipcMain.handle('terminal:restart', async () => {
  const s = terminals.get('default-term');
  if (s) {
    try { s.ptyProcess.kill(); } catch (e) {}
    terminals.delete('default-term');
  }
  return createPtyTerminal({ id: 'default-term' });
});

// Claude Code CLI Quick Launcher
ipcMain.handle('claude:launch', async (event, options = {}) => {
  const settings = getSettings();
  const port = settings.port || 8082;
  const baseUrl = `http://localhost:${port}`;
  const apiKey = options.apiKey || 'sk-fcc-direct-access';
  const dir = options.cwd || currentWorkspace || process.cwd();

  appendServerLog(`Launching Claude Code in external console in: ${dir}`, 'info');

  const psScript = `
    Set-Location -Path '${dir.replace(/'/g, "''")}';
    $Host.UI.RawUI.WindowTitle = 'Claude Code CLI';
    $env:ANTHROPIC_BASE_URL = '${baseUrl}';
    $env:ANTHROPIC_API_KEY = '${apiKey}';
    $env:Path = '$env:USERPROFILE\\.local\\bin;$env:APPDATA\\npm;' + $env:Path;
    Write-Host '==================================================' -ForegroundColor Cyan;
    Write-Host '  Claude Code connected to ${baseUrl}' -ForegroundColor Green;
    Write-Host '==================================================' -ForegroundColor Cyan;
    if (Get-Command fcc-claude -ErrorAction SilentlyContinue) {
      fcc-claude
    } elseif (Get-Command claude -ErrorAction SilentlyContinue) {
      claude
    } else {
      Write-Host 'Claude Code not found. Please run Auto-Setup!' -ForegroundColor Red;
    }
  `.replace(/\r?\n\s*/g, ' ');

  const psExe = resolveTerminalShell();
  exec(`start "" "${psExe}" -NoExit -Command "${psScript}"`, { env: buildTerminalEnv() }, (err) => {
    if (err) appendServerLog(`Launch error: ${err.message}`, 'error');
  });

  return { success: true };
});

ipcMain.handle('shell:openExternal', async (event, url) => shell.openExternal(url));

// ============================================================================
// IPC Handlers: Key Manager (Encrypted with safeStorage)
// ============================================================================
ipcMain.handle('keys:generate', async (event, data = {}) => {
  const randomHex = crypto.randomBytes(16).toString('hex');
  const generatedKey = `sk-fcc-${randomHex}`;
  const encrypted = encryptStringSafe(generatedKey);

  const newKeyRecord = {
    id: crypto.randomUUID(),
    name: data.name || `Key-${new Date().toLocaleDateString()}`,
    provider: data.provider || 'NVIDIA Nemotron 120B (Free)',
    encKey: encrypted,
    last4: generatedKey.slice(-4),
    createdAt: new Date().toISOString()
  };

  const records = getStoredKeyRecords();
  records.unshift(newKeyRecord);
  saveKeyRecords(records);
  appendServerLog(`Generated key: ${newKeyRecord.name} (${newKeyRecord.provider})`, 'info');

  return {
    id: newKeyRecord.id,
    name: newKeyRecord.name,
    provider: newKeyRecord.provider,
    maskedKey: `sk-fcc-••••••••${newKeyRecord.last4}`,
    createdAt: newKeyRecord.createdAt
  };
});

ipcMain.handle('keys:list', async () => {
  const records = getStoredKeyRecords();
  return records.map(r => ({
    id: r.id,
    name: r.name,
    provider: r.provider,
    maskedKey: `sk-fcc-••••••••${r.last4 || 'xxxx'}`,
    createdAt: r.createdAt
  }));
});

// Legacy alias
ipcMain.handle('keys:get', async () => {
  const records = getStoredKeyRecords();
  return records.map(r => ({
    id: r.id,
    name: r.name,
    provider: r.provider,
    key: `sk-fcc-••••••••${r.last4 || 'xxxx'}`,
    createdAt: r.createdAt
  }));
});

ipcMain.handle('keys:revoke', async (event, id) => {
  let records = getStoredKeyRecords();
  records = records.filter(k => k.id !== id);
  saveKeyRecords(records);
  return { success: true };
});
ipcMain.handle('keys:delete', async (event, id) => {
  let records = getStoredKeyRecords();
  records = records.filter(k => k.id !== id);
  saveKeyRecords(records);
  return { success: true };
});

ipcMain.handle('keys:getPlain', async (event, id) => {
  const records = getStoredKeyRecords();
  const found = records.find(k => k.id === id);
  if (!found) return { success: false, error: 'Key not found' };
  const plain = decryptStringSafe(found.encKey);
  return { success: true, key: plain };
});

// ============================================================================
// IPC Handlers: Auto Installer & System Diagnostics
// ============================================================================
let activeInstallerProcess = null;

async function checkSystemDependencies() {
  const result = {
    node: { ok: false, version: '', path: '' },
    claude: { ok: false, version: '', path: '' },
    uv: { ok: false, version: '', path: '' },
    fcc: { ok: false, version: '', path: '' }
  };

  const shellExe = resolveTerminalShell();
  const env = buildTerminalEnv();

  const runCmd = (cmd) => new Promise((resolve) => {
    exec(cmd, { env, shell: shellExe }, (err, stdout) => {
      resolve(err ? null : stdout.trim());
    });
  });

  const nodeVer = await runCmd('node -v');
  if (nodeVer && nodeVer.startsWith('v')) {
    result.node.ok = true;
    result.node.version = nodeVer;
    result.node.path = (await runCmd('(Get-Command node -ErrorAction SilentlyContinue).Source')) || 'node in PATH';
  }

  const claudeVer = await runCmd('claude --version');
  if (claudeVer && !claudeVer.includes('not recognized')) {
    result.claude.ok = true;
    result.claude.version = claudeVer;
    result.claude.path = (await runCmd('(Get-Command claude -ErrorAction SilentlyContinue).Source')) || 'claude in PATH';
  }

  const uvVer = await runCmd('uv --version');
  if (uvVer && uvVer.includes('uv')) {
    result.uv.ok = true;
    result.uv.version = uvVer;
    result.uv.path = (await runCmd('(Get-Command uv -ErrorAction SilentlyContinue).Source')) || 'uv in PATH';
  }

  const fccPath = findFccServerExecutable();
  if (fs.existsSync(fccPath)) {
    const fccCheck = await runCmd(`& "${fccPath}" --version`);
    if (fccCheck && !fccCheck.includes('Traceback') && !fccCheck.includes('ModuleNotFoundError')) {
      result.fcc.ok = true;
      result.fcc.version = 'Ready (v1.0.0)';
      result.fcc.path = fccPath;
    } else {
      result.fcc.ok = false;
      result.fcc.version = 'Module missing (Needs 1-Click Setup)';
      result.fcc.path = fccPath;
    }
  } else {
    result.fcc.ok = false;
    result.fcc.version = 'Not found';
  }

  return result;
}

async function runAutoInstaller() {
  appendServerLog('Starting Auto Setup execution...', 'info');

  const notify = (step, percent, status, log = '', failingCommand = '') => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('installer:progress', { step, percent, status, log, failingCommand });
      mainWindow.webContents.send('setup:progress', { step, percent, status });
    }
  };

  const shellExe = resolveTerminalShell();
  const env = buildTerminalEnv();

  const runStep = (cmd, stepName, percent) => new Promise((resolve, reject) => {
    notify(stepName, percent, 'running', `Executing: ${cmd}`);

    activeInstallerProcess = exec(cmd, { env, shell: shellExe }, (err, stdout, stderr) => {
      activeInstallerProcess = null;
      if (err) {
        appendServerLog(`Step "${stepName}" failed: ${err.message}`, 'error');
        notify(stepName, percent, 'error', stderr || err.message, cmd);
        reject({ error: err, cmd, stderr });
      } else {
        appendServerLog(`Step "${stepName}" passed: ${stdout.trim()}`, 'success');
        notify(stepName, percent, 'step-done', stdout);
        resolve(stdout);
      }
    });
  });

  try {
    const diag = await checkSystemDependencies();

    if (!diag.uv.ok) {
      await runStep('irm https://astral.sh/uv/install.ps1 | iex', 'Installing uv package manager', 30);
    }

    if (!diag.claude.ok) {
      await runStep('npm install -g @anthropic-ai/claude-code --allow-scripts=@anthropic-ai/claude-code', 'Installing Claude Code CLI', 65);
    }

    if (!diag.fcc.ok) {
      await runStep('$env:Path = "$env:USERPROFILE\\.local\\bin;" + $env:Path; uv tool install --force git+https://github.com/Alishahryar1/free-claude-code.git', 'Installing Free Claude Code Server', 90);
    }

    notify('Setup Completed! All tools are installed and ready.', 100, 'done');
    return { success: true };
  } catch (errInfo) {
    return {
      success: false,
      error: errInfo.error?.message || String(errInfo),
      failingCommand: errInfo.cmd
    };
  }
}

ipcMain.handle('installer:check', async () => checkSystemDependencies());
ipcMain.handle('system:check', async () => {
  const check = await checkSystemDependencies();
  return {
    nodeInstalled: check.node.ok,
    claudeInstalled: check.claude.ok,
    uvInstalled: check.uv.ok,
    fccInstalled: check.fcc.ok,
    versions: {
      node: check.node.version,
      claude: check.claude.version,
      uv: check.uv.version,
      fcc: check.fcc.version
    }
  };
});

ipcMain.handle('installer:run', async () => runAutoInstaller());
ipcMain.handle('system:autoSetup', async () => runAutoInstaller());

ipcMain.handle('installer:cancel', async () => {
  if (activeInstallerProcess) {
    try { activeInstallerProcess.kill(); } catch (e) {}
    activeInstallerProcess = null;
    return true;
  }
  return false;
});

// ============================================================================
// IPC Handlers: AI Assistant (Chat, Streaming & Cancel)
// ============================================================================
const activeChatRequests = new Map(); // id -> http.ClientRequest

ipcMain.handle('ai:chat', async (event, payload) => {
  const { messages, model, fileContext } = payload;
  const port = getSettings().port || 8082;

  const chatMessages = [...messages];
  if (fileContext && fileContext.content) {
    chatMessages.unshift({
      role: 'system',
      content: `You are an expert AI code assistant inside Claude Code Studio IDE.\nCurrently open file: ${fileContext.name} (${fileContext.path})\nFile content:\n\`\`\`\n${fileContext.content}\n\`\`\`\n`
    });
  }

  const requestBody = JSON.stringify({
    model: model || getSettings().defaultModel,
    messages: chatMessages,
    temperature: 0.7,
    max_tokens: 4096
  });

  return new Promise((resolve) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-fcc-direct-access',
        'Content-Length': Buffer.byteLength(requestBody)
      },
      timeout: 45000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const reply = parsed.choices?.[0]?.message?.content || parsed.error?.message || 'Empty response received.';
          resolve({ success: true, text: reply });
        } catch (e) {
          resolve({ success: true, text: data || 'Server returned empty body.' });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        success: false,
        error: `Server is stopped or unreachable on port ${port}. Please click "Start Server" in the top bar! (${err.message})`
      });
    });

    req.write(requestBody);
    req.end();
  });
});

ipcMain.handle('ai:stream', async (event, payload) => {
  const { id = `chat-${Date.now()}`, messages, model, fileContext } = payload;
  const port = getSettings().port || 8082;

  const chatMessages = [...messages];
  if (fileContext && fileContext.content) {
    chatMessages.unshift({
      role: 'system',
      content: `You are an expert AI software engineer inside Claude Code Studio IDE.\nCurrently open file: ${fileContext.name} (${fileContext.path})\nFile content:\n\`\`\`\n${fileContext.content}\n\`\`\`\n`
    });
  }

  const requestBody = JSON.stringify({
    model: model || getSettings().defaultModel,
    messages: chatMessages,
    stream: true,
    temperature: 0.7,
    max_tokens: 4096
  });

  let accumulatedText = '';

  const req = http.request({
    hostname: '127.0.0.1',
    port,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-fcc-direct-access',
      'Content-Length': Buffer.byteLength(requestBody)
    },
    timeout: 60000
  }, (res) => {
    let buffer = '';

    res.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Retain incomplete line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (trimmed === 'data: [DONE]') {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('ai:end', { id, fullText: accumulatedText });
          }
          activeChatRequests.delete(id);
          return;
        }

        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              accumulatedText += delta;
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('ai:chunk', { id, chunk: delta });
              }
            }
          } catch (e) {
            // Non-JSON SSE chunk fallback
            accumulatedText += trimmed.slice(6);
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('ai:chunk', { id, chunk: trimmed.slice(6) });
            }
          }
        }
      }
    });

    res.on('end', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('ai:end', { id, fullText: accumulatedText });
      }
      activeChatRequests.delete(id);
    });
  });

  req.on('error', (err) => {
    activeChatRequests.delete(id);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('ai:error', {
        id,
        error: `Server is stopped or unreachable on port ${port}. Please click "Start Server" in the top bar! (${err.message})`
      });
    }
  });

  activeChatRequests.set(id, req);
  req.write(requestBody);
  req.end();

  return { id, success: true };
});

ipcMain.handle('ai:cancel', async (event, { id }) => {
  const req = activeChatRequests.get(id);
  if (req) {
    try { req.destroy(); } catch (e) {}
    activeChatRequests.delete(id);
    return true;
  }
  return false;
});

// ============================================================================
// IPC Handlers: Settings
// ============================================================================
ipcMain.handle('settings:get', async () => getSettings());
ipcMain.handle('settings:set', async (event, newSettings) => {
  const updated = saveSettingsData(newSettings);
  return { success: true, settings: updated };
});
ipcMain.handle('settings:save', async (event, newSettings) => {
  saveSettingsData(newSettings);
  return { success: true };
});
