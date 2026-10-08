const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function getDataFilePath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'todos-store.json');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1050,
    height: 740,
    minWidth: 700,
    minHeight: 550,
    frame: false, // Custom modern title bar
    titleBarStyle: 'hidden',
    backgroundColor: '#090d16',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    icon: fs.existsSync(path.join(__dirname, 'assets', 'icon.png')) ? path.join(__dirname, 'assets', 'icon.png') : undefined,
    show: false
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized-state', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximized-state', false);
  });
}

// IPC Handlers for window controls
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize-toggle', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// IPC Handlers for persistent Todos storage
ipcMain.handle('todos:load', async () => {
  try {
    const filePath = getDataFilePath();
    if (!fs.existsSync(filePath)) {
      return null; // Will fallback to initial starter items
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load todos from disk:', err);
    return null;
  }
});

ipcMain.handle('todos:save', async (event, data) => {
  try {
    const filePath = getDataFilePath();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    console.error('Failed to save todos to disk:', err);
    return { success: false, error: err.message };
  }
});

// Export & Import backup feature
ipcMain.handle('todos:export', async (event, data) => {
  try {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Tasks Backup',
      defaultPath: `tasks-backup-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (filePath) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      return { success: true, filePath };
    }
    return { success: false, cancelled: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('todos:import', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Tasks Backup',
      properties: ['openFile'],
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (filePaths && filePaths.length > 0) {
      const content = fs.readFileSync(filePaths[0], 'utf8');
      const parsed = JSON.parse(content);
      return { success: true, data: parsed };
    }
    return { success: false, cancelled: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
