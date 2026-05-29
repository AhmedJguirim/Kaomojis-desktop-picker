// Registers / re-registers the global hotkey that toggles the picker.
const { globalShortcut } = require('electron')

let current = null

// Try to register `accelerator`. Returns true on success. On failure the
// previously working shortcut (if any) is restored so the app stays usable.
function apply(accelerator, onTrigger) {
  globalShortcut.unregisterAll()
  let ok = false
  try {
    ok = globalShortcut.register(accelerator, onTrigger)
  } catch {
    ok = false
  }
  if (ok) {
    current = accelerator
    return true
  }
  // Restore the last good shortcut so we don't end up with nothing bound.
  if (current && current !== accelerator) {
    try { globalShortcut.register(current, onTrigger) } catch { /* ignore */ }
  }
  return false
}

function unregisterAll() {
  globalShortcut.unregisterAll()
  current = null
}

module.exports = { apply, unregisterAll, get current() { return current } }
