const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');
const expressApp = require('../server');
const { setupVite } = require('../server/vite');
const { createServer } = require('http');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

async function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, '../public/favicon.svg')
  });

  // Wait for the server to be ready
  const PORT = 5000;
  
  // Load the app from the local server
  mainWindow.loadURL(`http://localhost:${PORT}`);

  // Open DevTools in development mode
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  const server = createServer(expressApp);
  await setupVite(expressApp, server);
  
  server.listen(5000, () => {
    console.log('Server is running on port 5000');
    createWindow();
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS applications keep their menu bar active until Cmd + Q is pressed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window when the dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});