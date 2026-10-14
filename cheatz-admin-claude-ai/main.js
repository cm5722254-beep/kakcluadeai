const { app, BrowserWindow, ipcMain, shell, clipboard } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const http = require('http');

let mainWindow = null;
let serverProcess = null;

const FCC_EXE_PATH = 'C:\\Users\\NIN\\.local\\bin\\fcc-server.exe';
const SERVER_PORT = 8082;

function checkPortOpen(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/admin/api/status`, { timeout: 1500 }, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 880,
    minWidth: 1080,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#090b10',
    icon: path.join(__dirname, 'assets', 'logo.jpg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // allow direct fetch to localhost:8082
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Window control IPC
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

ipcMain.on('open-external', (event, url) => {
  if (url) shell.openExternal(url);
});

ipcMain.on('copy-text', (event, text) => {
  if (text) clipboard.writeText(text);
});

// Server Process Control
ipcMain.handle('check-server-process', async () => {
  const isOnline = await checkPortOpen(SERVER_PORT);
  return { online: isOnline, port: SERVER_PORT, path: FCC_EXE_PATH };
});

ipcMain.handle('start-server-process', async () => {
  const isOnline = await checkPortOpen(SERVER_PORT);
  if (isOnline) {
    return { success: true, message: 'Server is already running on port 8082' };
  }

  try {
    serverProcess = spawn(FCC_EXE_PATH, [], {
      detached: true,
      stdio: 'ignore',
      windowsHide: false
    });
    serverProcess.unref();
    return { success: true, message: 'Launched FCC Server process' };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('restart-server-process', async () => {
  // Attempt to kill previous server and start fresh
  exec('taskkill /F /IM fcc-server.exe', (err) => {
    setTimeout(async () => {
      try {
        serverProcess = spawn(FCC_EXE_PATH, [], {
          detached: true,
          stdio: 'ignore',
          windowsHide: false
        });
        serverProcess.unref();
      } catch (e) {
        console.error(e);
      }
    }, 1000);
  });
  return { success: true, message: 'Restart command issued' };
});

ipcMain.handle('stop-server-process', async () => {
  return new Promise((resolve) => {
    exec('taskkill /F /IM fcc-server.exe', (err) => {
      resolve({ success: !err, message: err ? err.message : 'Server stopped' });
    });
  });
});

ipcMain.handle('launch-claude-cli', async () => {
  try {
    // Launch cmd window running fcc-claude
    spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/k', 'fcc-claude'], {
      detached: true,
      stdio: 'ignore'
    }).unref();
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
