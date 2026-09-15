const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('node:path');
const { createScoreStore } = require('./score-store.cjs');

// Mantener un nombre estable conserva el ranking al actualizar el ejecutable.
app.setName('Neon Breaker');
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let mainWindow;
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app.whenReady().then(() => {
    const store = createScoreStore(app.getPath('userData'));
    function fromGame(event) {
      if (!mainWindow || event.sender !== mainWindow.webContents || event.senderFrame !== mainWindow.webContents.mainFrame) {
        throw new Error('Origen inválido');
      }
    }
    ipcMain.handle('scores:read', event => { fromGame(event); return store.read(); });
    ipcMain.handle('scores:add', (event, entry) => { fromGame(event); return store.add(entry); });
    ipcMain.handle('scores:clear', event => { fromGame(event); return store.clear(); });
    // Sin el menú predeterminado, Ctrl+Shift+R llega al juego y no fuerza una recarga.
    Menu.setApplicationMenu(null);
    mainWindow = new BrowserWindow({
      width: 1040, height: 900, minWidth: 740, minHeight: 700,
      backgroundColor: '#080c18',
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true, nodeIntegration: false, sandbox: true,
      },
    });
    mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    mainWindow.webContents.on('will-navigate', event => event.preventDefault());
    mainWindow.loadFile('index.html');
    mainWindow.on('closed', () => { mainWindow = null; });
  });
  app.on('window-all-closed', () => app.quit());
}
