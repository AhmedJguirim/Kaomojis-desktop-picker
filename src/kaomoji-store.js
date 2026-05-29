// Owns the user's kaomoji list, stored as JSON in <userData>/kaomoji.json.
// On first run (or if the file is missing/corrupt) it is seeded from the
// bundled defaults. After that, the JSON file is the source of truth.
const { app } = require('electron')
const path = require('path')
const fs = require('fs')
const DEFAULTS = require('./data/kaomoji')

function filePath() {
  return path.join(app.getPath('userData'), 'kaomoji.json')
}

function isValid(entry) {
  return entry && typeof entry.text === 'string' && typeof entry.keywords === 'string'
}

// Normalize arbitrary input into clean { text, keywords } entries.
function sanitize(list) {
  if (!Array.isArray(list)) return []
  return list
    .filter(isValid)
    .map(e => ({ text: e.text.trim(), keywords: e.keywords.trim() }))
    .filter(e => e.text.length > 0)
}

function seed() {
  const data = DEFAULTS.map(e => ({ text: e.text, keywords: e.keywords }))
  save(data)
  return data
}

function load() {
  try {
    const raw = fs.readFileSync(filePath(), 'utf8')
    const data = JSON.parse(raw)
    if (Array.isArray(data)) return sanitize(data)
    return seed()
  } catch {
    return seed()
  }
}

function save(list) {
  try {
    fs.writeFileSync(filePath(), JSON.stringify(sanitize(list), null, 2), 'utf8')
    return true
  } catch (err) {
    console.error('Failed to save kaomoji:', err)
    return false
  }
}

module.exports = { load, save, seed, sanitize, filePath }
