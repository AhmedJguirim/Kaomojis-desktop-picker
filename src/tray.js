// System-tray icon (the notification area by the clock) with a right-click menu.
const { app, Tray, Menu } = require('electron')
const path = require('path')

let tray = null

function create({ onShow, onSettings, getShortcut }) {
  tray = new Tray(path.join(__dirname, 'assets', 'tray.png'))
  tray.setToolTip('emojis — kaomoji picker')

  const rebuildMenu = () => {
    const menu = Menu.buildFromTemplate([
      { label: `Picker (${getShortcut()})`, click: onShow },
      { label: 'Settings…', click: onSettings },
      { type: 'separator' },
      { label: 'Quit emojis', click: () => { app.isQuitting = true; app.quit() } }
    ])
    tray.setContextMenu(menu)
  }

  rebuildMenu()
  // Single click also opens the picker.
  tray.on('click', onShow)

  return { tray, rebuildMenu }
}

module.exports = { create }
