const { ipcRenderer } = require('electron')

const searchEl = document.getElementById('search')
const resultsEl = document.getElementById('results')
const copiedEl = document.getElementById('copied')

let KAOMOJI = []
let filtered = []
let activeIndex = 0

async function loadData() {
  try {
    KAOMOJI = await ipcRenderer.invoke('get-kaomoji')
  } catch {
    KAOMOJI = []
  }
  render()
}

// Refresh the list when the manager saves changes.
ipcRenderer.on('kaomoji-updated', loadData)

function score(item, query) {
  const q = query.toLowerCase().trim()
  if (!q) return 1
  const kw = item.keywords.toLowerCase()
  // Exact keyword match ranks highest
  const words = kw.split(/\s+/)
  if (words.includes(q)) return 3
  if (words.some(w => w.startsWith(q))) return 2
  if (kw.includes(q)) return 1
  return 0
}

function render() {
  const query = searchEl.value
  filtered = KAOMOJI
    .map(item => ({ item, s: score(item, query) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map(x => x.item)

  activeIndex = 0
  resultsEl.innerHTML = ''

  if (filtered.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'empty'
    empty.textContent = 'No kaomoji found'
    resultsEl.appendChild(empty)
    return
  }

  filtered.forEach((item, i) => {
    const row = document.createElement('div')
    row.className = 'row' + (i === 0 ? ' active' : '')
    row.dataset.index = i

    const kao = document.createElement('span')
    kao.className = 'kao'
    kao.textContent = item.text

    const kw = document.createElement('span')
    kw.className = 'kw'
    kw.textContent = item.keywords.split(/\s+/).slice(0, 4).join(', ')

    row.appendChild(kao)
    row.appendChild(kw)
    row.addEventListener('mouseenter', () => setActive(i))
    row.addEventListener('click', () => copySelected())
    resultsEl.appendChild(row)
  })
}

function setActive(i) {
  const rows = resultsEl.querySelectorAll('.row')
  rows.forEach(r => r.classList.remove('active'))
  activeIndex = Math.max(0, Math.min(i, filtered.length - 1))
  const active = rows[activeIndex]
  if (active) {
    active.classList.add('active')
    active.scrollIntoView({ block: 'nearest' })
  }
}

function copySelected() {
  if (filtered.length === 0) return
  const item = filtered[activeIndex]
  ipcRenderer.send('copy-and-close', item.text)
  // brief flash before window hides
  copiedEl.classList.add('show')
}

searchEl.addEventListener('input', render)

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    setActive(activeIndex + 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    setActive(activeIndex - 1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    copySelected()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    ipcRenderer.send('close-window')
  }
})

// When the window is shown, reload the list, clear and refocus
ipcRenderer.on('focus-search', () => {
  searchEl.value = ''
  copiedEl.classList.remove('show')
  loadData()
  searchEl.focus()
})

loadData()
searchEl.focus()
