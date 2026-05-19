const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');

let win;
let notifJob = null;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });
  win.loadFile('index.html');
}

function scheduleNotif(time) {
  if (notifJob) clearInterval(notifJob);
  notifJob = setInterval(() => {
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    if (hhmm === time) {
      new Notification({ title: 'ClearCents', body: 'Time to log your expenses!' }).show();
    }
  }, 60000);
}

ipcMain.on('schedule-notif', (_, time) => scheduleNotif(time));

app.whenReady().then(() => {
  createWindow();
  // Default daily reminder at 20:00
  scheduleNotif('20:00');
});

app.on('window-all-closed', () => app.quit());
