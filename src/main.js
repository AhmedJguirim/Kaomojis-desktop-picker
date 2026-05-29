const { app, ipcMain, clipboard } = require('electron')
const config = require('./config')
const shortcuts = require('./shortcuts')
const windows = require('./windows')
const tray = require('./tray')

// Process / Task Manager name. (When packaged, the .exe is also named "emojis"
// via build.productName; running unpackaged it still shows as "Electron".)
app.setName('emojis')

let settings = config.load()
let trayCtl = null

// Only one instance — a second launch just pops the picker.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => windows.showPicker())

  app.whenReady().then(() => {
    windows.createPicker()

    trayCtl = tray.create({
      onShow: () => windows.showPicker(),
      onSettings: () => windows.openSettings(),
      getShortcut: () => settings.shortcut
    })

    const ok = shortcuts.apply(settings.shortcut, () => windows.togglePicker())
    if (!ok) console.error(`Failed to register shortcut: ${settings.shortcut}`)
  })
}

// Keep running in the tray when windows close.
app.on('window-all-closed', (e) => {
  if (!app.isQuitting) e.preventDefault()
})

app.on('will-quit', () => shortcuts.unregisterAll())

// ---- IPC ----
ipcMain.on('copy-and-close', (_e, text) => {
  clipboard.writeText(text)
  const picker = windows.getPicker()
  if (picker) picker.hide()
})

ipcMain.on('close-window', () => {
  const picker = windows.getPicker()
  if (picker) picker.hide()
})

// Settings window asks for the current config.
ipcMain.handle('get-config', () => settings)

// Settings window proposes a new shortcut. Returns { ok, shortcut, error }.
ipcMain.handle('set-shortcut', (_e, accelerator) => {
  const ok = shortcuts.apply(accelerator, () => windows.togglePicker())
  if (ok) {
    settings = { ...settings, shortcut: accelerator }
    config.save(settings)
    if (trayCtl) trayCtl.rebuildMenu()
    return { ok: true, shortcut: accelerator }
  }
  return { ok: false, error: 'That shortcut is unavailable (already in use by another app).' }
})
