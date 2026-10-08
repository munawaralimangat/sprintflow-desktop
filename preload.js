const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  toggleMaximizeWindow: () => ipcRenderer.send('window-maximize-toggle'),
  closeWindow: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximizedState: (callback) => {
    ipcRenderer.on('window-maximized-state', (_event, state) => callback(state));
  },

  // Storage
  loadTodos: () => ipcRenderer.invoke('todos:load'),
  saveTodos: (todos) => ipcRenderer.invoke('todos:save', todos),
  exportTodos: (todos) => ipcRenderer.invoke('todos:export', todos),
  importTodos: () => ipcRenderer.invoke('todos:import')
});
