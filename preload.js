const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // From main to renderer
  onShowSerialPicker: (callback) => ipcRenderer.on('show-serial-picker', callback),
  onSerialPortAdded: (callback) => ipcRenderer.on('serial-port-added', callback),
  onSerialPortRemoved: (callback) => ipcRenderer.on('serial-port-removed', callback),
  
  // From renderer to main
  selectSerialPort: (portId) => ipcRenderer.invoke('select-serial-port', portId),
  cancelSerialPicker: () => ipcRenderer.invoke('cancel-serial-picker'),
  refreshSerialPorts: () => ipcRenderer.invoke('refresh-serial-ports'),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});