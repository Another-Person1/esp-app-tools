const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let serialCallback = null;
let availablePorts = [];

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');

  // Handle serial port selection
  mainWindow.webContents.session.on('select-serial-port', (event, portList, webContents, callback) => {
    event.preventDefault();
    
    serialCallback = callback;
    availablePorts = portList;
    
    // Send port list to renderer to show picker UI
    mainWindow.webContents.send('show-serial-picker', portList);
  });

  // Handle port added/removed events
  mainWindow.webContents.session.on('serial-port-added', (event, port) => {
    console.log('Serial port added:', port);
    availablePorts.push(port);
    mainWindow.webContents.send('serial-port-added', port);
  });

  mainWindow.webContents.session.on('serial-port-removed', (event, port) => {
    console.log('Serial port removed:', port);
    availablePorts = availablePorts.filter(p => p.portId !== port.portId);
    mainWindow.webContents.send('serial-port-removed', port);
  });

  // Set up permission handlers
  mainWindow.webContents.session.setDevicePermissionHandler((details) => {
    return details.deviceType === 'serial';
  });

  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    return permission === 'serial';
  });
}

// Handle port selection from renderer
ipcMain.handle('select-serial-port', (event, portId) => {
  if (serialCallback) {
    serialCallback(portId);
    serialCallback = null;
    return true;
  }
  return false;
});

ipcMain.handle('cancel-serial-picker', () => {
  if (serialCallback) {
    serialCallback('');
    serialCallback = null;
  }
});

ipcMain.handle('refresh-serial-ports', async () => {
  // Note: In current Electron, we can't directly refresh ports
  // This would typically require re-triggering the requestPort
  return availablePorts;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});