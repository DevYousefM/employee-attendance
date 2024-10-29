const path = require('path');
const { app, BrowserWindow } = require('electron');

// Only include `electron-reload` in development mode
if (process.env.NODE_ENV !== 'production') {
    require('electron-reload')(path.join(__dirname, '.'), {
        electron: path.join(__dirname, 'node_modules', '.bin', 'electron'), // path to electron binary
        hardResetMethod: 'exit' // Ensures full reload on changes
    });
}

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', createWindow);
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
app.on('activate', function () {
    if (mainWindow === null) createWindow();
});
