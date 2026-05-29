// Loads and saves user settings to <userData>/config.json.
const { app } = require('electron')
const path = require('path')
const fs = require('fs')

const DEFAULTS = {
  shortcut: 'Alt+Space'
}

function configPath() {
  return path.join(app.getPath('userData'), 'config.json')
}

function load() {
  try {
    const raw = fs.readFileSync(configPath(), 'utf8')
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

function save(config) {
  try {
    fs.writeFileSync(configPath(), JSON.stringify(config, null, 2), 'utf8')
    return true
  } catch (err) {
    console.error('Failed to save config:', err)
    return false
  }
}

module.exports = { DEFAULTS, load, save, configPath }
