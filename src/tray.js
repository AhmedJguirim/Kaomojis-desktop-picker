// System-tray / menu-bar icon with a context menu. Works on Windows
// (notification area), macOS (menu bar), and Linux (AppIndicator).
const { app, Tray, Menu, nativeImage } = require('electron')
const path = require('path')

let tray = null

function trayIcon() {
  // macOS menu bar uses a monochrome "template" image that adapts to
  // light/dark. Windows and Linux use the colored icon.
  if (process.platform === 'darwin') {
    const img = nativeImage.createFromPath(path.join(__dirname, 'assets', 'trayTemplate.png'))
    img.setTemplateImage(true)
    return img
  }
  return nativeImage.createFromPath(path.join(__dirname, 'assets', 'tray.png'))
}

function create({ onShow, onSettings, onManage, getShortcut }) {
  tray = new Tray(trayIcon())
  tray.setToolTip('emojis — kaomoji picker')

  const rebuildMenu = () => {
    const menu = Menu.buildFromTemplate([
      { label: `Picker (${getShortcut()})`, click: onShow },
      { label: 'Manage kaomoji…', click: onManage },
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
