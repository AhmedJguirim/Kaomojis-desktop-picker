const { ipcRenderer } = require('electron')

const recorderEl = document.getElementById('recorder')
const comboEl = document.getElementById('combo')
const actionEl = document.getElementById('action')
const statusEl = document.getElementById('status')

let currentShortcut = 'Alt+Space'
let recording = false

const MODIFIER_KEYS = new Set(['Control', 'Alt', 'Shift', 'Meta', 'OS', 'AltGraph', 'CapsLock'])

const IS_MAC = process.platform === 'darwin'

// Human-readable list of modifiers for hints, per platform.
const MOD_HINT = IS_MAC
  ? 'Ctrl, Option, Shift or Cmd'
  : (process.platform === 'linux' ? 'Ctrl, Alt, Shift or Super' : 'Ctrl, Alt, Shift or Win')

// How an Electron accelerator token is displayed on a key cap, per platform.
// (The saved accelerator string itself stays platform-neutral, e.g. "Super".)
const DISPLAY = IS_MAC
  ? { Control: '⌃ Ctrl', Alt: '⌥ Option', Shift: '⇧ Shift', Super: '⌘ Cmd', Return: 'Return' }
  : { Control: 'Ctrl', Alt: 'Alt', Shift: 'Shift', Super: process.platform === 'linux' ? 'Super' : 'Win', Return: 'Enter' }

const NAMED_KEYS = {
  ' ': 'Space', ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
  Enter: 'Return', Tab: 'Tab', Backspace: 'Backspace', Delete: 'Delete', Insert: 'Insert',
  Home: 'Home', End: 'End', PageUp: 'PageUp', PageDown: 'PageDown'
}

// Convert a keydown event's non-modifier key into an Electron accelerator token.
function keyToken(e) {
  const k = e.key
  if (NAMED_KEYS[k]) return NAMED_KEYS[k]
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(k)) return k          // F1..F24
  if (k.length === 1) {
    if (/[a-z]/i.test(k)) return k.toUpperCase()
    if (/[0-9]/.test(k)) return k
    return k                                                // punctuation, etc.
  }
  return null
}

function modifiers(e) {
  const mods = []
  if (e.ctrlKey) mods.push('Control')
  if (e.altKey) mods.push('Alt')
  if (e.shiftKey) mods.push('Shift')
  if (e.metaKey) mods.push('Super')
  return mods
}

// Render an array of accelerator tokens (e.g. ['Control','Shift','E']) as key caps.
function renderCombo(tokens, { trailingHint } = {}) {
  comboEl.innerHTML = ''
  tokens.forEach((tok, i) => {
    if (i > 0) {
      const plus = document.createElement('span')
      plus.className = 'plus'
      plus.textContent = '+'
      comboEl.appendChild(plus)
    }
    const kbd = document.createElement('kbd')
    kbd.textContent = DISPLAY[tok] || tok
    comboEl.appendChild(kbd)
  })
  if (trailingHint) {
    const hint = document.createElement('span')
    hint.className = 'hint'
    hint.textContent = (tokens.length ? ' + ' : '') + trailingHint
    comboEl.appendChild(hint)
  }
}

function renderFromAccelerator(accel) {
  renderCombo(accel.split('+'))
}

function setStatus(msg, kind = 'muted') {
  statusEl.textContent = msg || ' '
  statusEl.className = 'status ' + kind
}

function startRecording() {
  recording = true
  recorderEl.classList.add('recording')
  actionEl.textContent = 'Recording…'
  renderCombo([], { trailingHint: 'press keys…' })
  setStatus('Hold a modifier, then press a key.', 'muted')
}

function stopRecording() {
  recording = false
  recorderEl.classList.remove('recording')
  actionEl.textContent = 'Click to change'
}

function cancelRecording() {
  stopRecording()
  renderFromAccelerator(currentShortcut)
  setStatus('', 'muted')
}

recorderEl.addEventListener('click', () => { if (!recording) startRecording() })
recorderEl.addEventListener('blur', () => { if (recording) cancelRecording() })

document.addEventListener('keydown', (e) => {
  if (!recording) return
  e.preventDefault()
  e.stopPropagation()

  if (e.key === 'Escape') { cancelRecording(); return }

  const mods = modifiers(e)

  // Lone modifier held: show the waiting state and keep listening.
  if (MODIFIER_KEYS.has(e.key)) {
    renderCombo(mods, { trailingHint: 'press a key…' })
    return
  }

  const token = keyToken(e)
  if (!token) return

  const isFunctionKey = /^F([1-9]|1[0-9]|2[0-4])$/.test(token)
  if (mods.length === 0 && !isFunctionKey) {
    // A bare letter would hijack that key system-wide — require a modifier.
    renderCombo([token])
    setStatus(`Add a modifier (${MOD_HINT}).`, 'err')
    return
  }

  const accelerator = [...mods, token].join('+')
  renderCombo([...mods, token])
  commit(accelerator)
})

async function commit(accelerator) {
  stopRecording()
  setStatus('Saving…', 'muted')
  try {
    const res = await ipcRenderer.invoke('set-shortcut', accelerator)
    if (res && res.ok) {
      currentShortcut = res.shortcut
      renderFromAccelerator(currentShortcut)
      setStatus('Saved ✓', 'ok')
    } else {
      renderFromAccelerator(currentShortcut)
      setStatus((res && res.error) || 'Could not set that shortcut.', 'err')
    }
  } catch (err) {
    renderFromAccelerator(currentShortcut)
    setStatus('Could not set that shortcut.', 'err')
  }
}

// Localize the hint text for the current platform.
const modhintEl = document.getElementById('modhint')
if (modhintEl) modhintEl.textContent = MOD_HINT

// Load current config on open.
ipcRenderer.invoke('get-config').then((cfg) => {
  currentShortcut = (cfg && cfg.shortcut) || 'Alt+Space'
  renderFromAccelerator(currentShortcut)
})
