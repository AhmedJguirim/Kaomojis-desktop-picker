const { ipcRenderer } = require('electron')

const listEl = document.getElementById('list')
const countEl = document.getElementById('count')
const pathEl = document.getElementById('path')
const filterEl = document.getElementById('filter')
const addBtn = document.getElementById('add')
const saveBtn = document.getElementById('save')
const statusEl = document.getElementById('status')

let items = []        // [{ id, text, keywords }]
let nextId = 1
let dirty = false

function setStatus(msg, kind = 'muted') {
  statusEl.textContent = msg || ' '
  statusEl.className = 'status ' + kind
}

function setDirty(value) {
  dirty = value
  saveBtn.disabled = !value
  if (value) setStatus('Unsaved changes', 'dirty')
}

function visibleItems() {
  const q = filterEl.value.toLowerCase().trim()
  if (!q) return items
  return items.filter(it =>
    it.text.toLowerCase().includes(q) || it.keywords.toLowerCase().includes(q))
}

function buildRow(it) {
  const row = document.createElement('div')
  row.className = 'row'

  const text = document.createElement('input')
  text.className = 'kao'
  text.type = 'text'
  text.value = it.text
  text.placeholder = '(◕‿◕)'
  text.spellcheck = false
  text.addEventListener('input', () => { it.text = text.value; setDirty(true) })

  const kw = document.createElement('input')
  kw.type = 'text'
  kw.value = it.keywords
  kw.placeholder = 'happy smile cute'
  kw.spellcheck = false
  kw.addEventListener('input', () => { it.keywords = kw.value; setDirty(true) })

  const del = document.createElement('button')
  del.className = 'del'
  del.title = 'Delete'
  del.textContent = '✕'
  del.addEventListener('click', () => {
    items = items.filter(x => x.id !== it.id)
    setDirty(true)
    render()
  })

  row.append(text, kw, del)
  row._textInput = text
  return row
}

function render() {
  listEl.innerHTML = ''
  countEl.textContent = `${items.length} kaomoji`

  const vis = visibleItems()
  if (vis.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'empty'
    empty.textContent = items.length === 0
      ? 'No kaomoji yet — click “＋ Add kaomoji”.'
      : 'No matches for that filter.'
    listEl.appendChild(empty)
    return
  }
  vis.forEach(it => listEl.appendChild(buildRow(it)))
}

addBtn.addEventListener('click', () => {
  const it = { id: nextId++, text: '', keywords: '' }
  items.unshift(it)
  filterEl.value = '' // make sure the new row is visible
  setDirty(true)
  render()
  const first = listEl.querySelector('.row')
  if (first && first._textInput) first._textInput.focus()
})

filterEl.addEventListener('input', render)

saveBtn.addEventListener('click', save)

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    if (dirty) save()
  }
})

async function save() {
  const payload = items
    .map(it => ({ text: it.text.trim(), keywords: it.keywords.trim() }))
    .filter(it => it.text.length > 0)

  try {
    const res = await ipcRenderer.invoke('save-kaomoji', payload)
    if (res && res.ok) {
      await reload()
      setDirty(false)
      setStatus(`Saved ✓ — ${res.count} kaomoji`, 'ok')
    } else {
      setStatus((res && res.error) || 'Could not save.', 'err')
    }
  } catch {
    setStatus('Could not save.', 'err')
  }
}

async function reload() {
  const data = await ipcRenderer.invoke('get-kaomoji')
  items = data.map(e => ({ id: nextId++, text: e.text, keywords: e.keywords }))
  render()
}

async function init() {
  pathEl.textContent = await ipcRenderer.invoke('get-kaomoji-path')
  await reload()
  setStatus('', 'muted')
  saveBtn.disabled = true
}

init()
