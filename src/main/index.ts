import { app, BrowserWindow, ipcMain, Tray, Menu, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

import { setupSpotify } from './spotify'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width: 400,
    height: 80,
    x: screenWidth - 420,
    y: screenHeight - 90,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    show: false,
    // skipTaskbar: true, // Uncomment this to hide the widget from the Windows Taskbar (only use if Tray is enabled)
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    if (mainWindow) {
      setupSpotify(mainWindow)
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray(): void {
  tray = new Tray(join(__dirname, '../../resources/icon.png')) // Replace with real icon path
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Widget', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])
  tray.setToolTip('Spotify Taskbar Widget')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow?.show()
    }
  })
}

app.whenReady().then(() => {
  // Set app ID for Windows taskbar grouping (optional)
  if (process.platform === 'win32' && typeof app.setAppUserModelId === 'function') {
    app.setAppUserModelId('com.spotify.taskbar-widget')
  }

  app.on('browser-window-created', (_, window) => {
    if (optimizer && typeof optimizer.watchWindowShortcuts === 'function') {
      optimizer.watchWindowShortcuts(window)
    }
  })

  createWindow()
  // createTray() // Temporarily disabled until icon is added

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.on('window-command', (_, command) => {
  if (command === 'hide') {
    mainWindow?.hide()
  }
})
