const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  scheduleNotif: (time) => ipcRenderer.send('schedule-notif', time)
});
