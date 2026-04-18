import { app, BrowserWindow, ipcMain, Tray, Menu, screen, nativeImage } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { setupSpotify } from './spotify'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createWindow(): void {
  const iconName = 'Spotify_Icon_512.png'
  const iconPath = app.isPackaged 
    ? join(process.resourcesPath, iconName)
    : join(__dirname, '../../', iconName)

  mainWindow = new BrowserWindow({
    width: 350,
    height: 80,
    icon: nativeImage.createFromPath(iconPath),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    show: false,
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
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

function toggleWindow(): void {
  if (!mainWindow) return

  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    const { width: screenWidth, height: screenHeight, x: screenX, y: screenY } = screen.getPrimaryDisplay().workArea
    const windowBounds = mainWindow.getBounds()
    
    // Position the window bottom-right, just 2px above/beside the work area boundaries
    const x = screenX + screenWidth - windowBounds.width - 2
    const y = screenY + screenHeight - windowBounds.height - 2
    
    mainWindow.setPosition(Math.round(x), Math.round(y))
    mainWindow.show()
    mainWindow.focus()
  }
}

function createTray(): void {
  const iconName = 'Spotify_Icon_512.png'
  const possiblePaths = [
    join(__dirname, '../../', iconName),
    join(process.resourcesPath, iconName),
    join(process.cwd(), iconName)
  ]
  
  let icon = nativeImage.createEmpty()
  for (const p of possiblePaths) {
    const img = nativeImage.createFromPath(p)
    if (!img.isEmpty()) {
      icon = img.resize({ width: 16, height: 16 })
      break
    }
  }
  
  tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Widget', click: () => toggleWindow() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])
  
  tray.setToolTip('Spotify Taskbar Widget')
  tray.setContextMenu(contextMenu)
  
  tray.on('click', () => {
    toggleWindow()
  })
}

app.whenReady().then(() => {
  if (process.platform === 'win32' && typeof app.setAppUserModelId === 'function') {
    app.setAppUserModelId('com.spotify.taskbar-widget')
    
    // Set the app to launch automatically on Windows startup
    app.setLoginItemSettings({
      openAtLogin: true,
      path: app.getPath('exe')
    })
  }

  createWindow()
  createTray()

  // Show the window automatically once it's created
  setTimeout(() => {
    toggleWindow()
  }, 1000)

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
