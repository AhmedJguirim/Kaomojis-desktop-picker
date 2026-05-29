// Creates and manages the app's two windows: the picker and the settings panel.
const { BrowserWindow, screen } = require('electron')
const path = require('path')

const ICON = path.join(__dirname, 'assets', 'icon.png')

const PICKER_W = 480
const PICKER_H = 420

let picker = null
let settings = null

function createPicker() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  picker = new BrowserWindow({
    width: PICKER_W,
    height: PICKER_H,
    x: Math.floor(width / 2 - PICKER_W / 2),
    y: Math.floor(height / 2 - PICKER_H / 2),
    frame: false,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    transparent: true,
    icon: ICON,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  picker.loadFile(path.join(__dirname, 'picker', 'index.html'))
  picker.on('blur', () => picker.hide())
  return picker
}

function getPicker() {
  return picker
}

// Show the picker centered on whichever monitor the cursor is on.
function showPicker() {
  if (!picker) return
  const cursor = screen.getCursorScreenPoint()
  const { bounds } = screen.getDisplayNearestPoint(cursor)
  picker.setPosition(
    Math.floor(bounds.x + bounds.width / 2 - PICKER_W / 2),
    Math.floor(bounds.y + bounds.height / 2 - PICKER_H / 2)
  )
  picker.show()
  picker.focus()
  picker.webContents.send('focus-search')
}

function togglePicker() {
  if (!picker) return
  if (picker.isVisible()) picker.hide()
  else showPicker()
}

function openSettings() {
  if (settings && !settings.isDestroyed()) {
    settings.show()
    settings.focus()
    return
  }
  settings = new BrowserWindow({
    width: 460,
    height: 360,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: 'emojis — Settings',
    icon: ICON,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })
  settings.loadFile(path.join(__dirname, 'settings', 'settings.html'))
  settings.on('closed', () => { settings = null })
}

module.exports = { createPicker, getPicker, showPicker, togglePicker, openSettings }
