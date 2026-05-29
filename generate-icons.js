// generate-icons.js
// Generates the app/tray icons from scratch (no image libraries needed).
// Produces:
//   build/icon.png            1024px master (electron-builder derives mac/linux/win icons)
//   build/icon.ico            Windows .exe / installer icon
//   src/assets/icon.png       window icon (256px)
//   src/assets/tray.png       colored tray icon for Windows & Linux (32px)
//   src/assets/trayTemplate.png  monochrome macOS menu-bar template (22px)
// Run with:  node generate-icons.js   (or  npm run icons)
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

// ---- tiny PNG encoder (RGBA, 8-bit) ----
const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 6   // color type RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

const clamp01 = (v) => Math.max(0, Math.min(1, v))

// ---- compute anti-aliased coverage maps for the smiley ----
function coverage(size) {
  const n = size * size
  const face = new Float64Array(n) // face disk
  const feat = new Float64Array(n) // eyes + mouth
  const cx = size / 2, cy = size / 2, r = size * 0.46

  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
      face[y * size + x] = clamp01(r - d + 0.5)
    }

  const stamp = (x0, y0, rad) => {
    for (let y = Math.floor(y0 - rad - 1); y <= y0 + rad + 1; y++)
      for (let x = Math.floor(x0 - rad - 1); x <= x0 + rad + 1; x++) {
        if (x < 0 || y < 0 || x >= size || y >= size) continue
        const d = Math.hypot(x + 0.5 - x0, y + 0.5 - y0)
        const a = clamp01(rad - d + 0.5)
        const i = y * size + x
        if (a > feat[i]) feat[i] = a
      }
  }
  stamp(cx - 0.22 * r, cy - 0.18 * r, r * 0.085)
  stamp(cx + 0.22 * r, cy - 0.18 * r, r * 0.085)
  const mw = r * 0.42, baseY = cy + 0.34 * r, lift = 0.20 * r
  for (let t = -mw; t <= mw; t += r * 0.02) {
    const x = cx + t
    const y = baseY - lift * (t / mw) * (t / mw)
    stamp(x, y, r * 0.055)
  }
  return { face, feat, size }
}

// Colored icon: gold face, dark eyes/mouth.
function colored(maps) {
  const { face, feat, size } = maps
  const gold = [0xd4, 0xa0, 0x4f], ink = [0x1c, 0x1c, 0x22]
  const buf = Buffer.alloc(size * size * 4)
  for (let i = 0; i < size * size; i++) {
    const fa = face[i]
    if (fa <= 0) continue
    const fe = Math.min(feat[i], fa)
    const o = i * 4
    buf[o] = Math.round(gold[0] * (1 - fe) + ink[0] * fe)
    buf[o + 1] = Math.round(gold[1] * (1 - fe) + ink[1] * fe)
    buf[o + 2] = Math.round(gold[2] * (1 - fe) + ink[2] * fe)
    buf[o + 3] = Math.round(255 * fa)
  }
  return encodePNG(size, size, buf)
}

// macOS template: solid black, eyes/mouth knocked out of the alpha channel.
function template(maps) {
  const { face, feat, size } = maps
  const buf = Buffer.alloc(size * size * 4)
  for (let i = 0; i < size * size; i++) {
    const fa = face[i]
    if (fa <= 0) continue
    const fe = Math.min(feat[i], fa)
    const o = i * 4
    buf[o] = 0; buf[o + 1] = 0; buf[o + 2] = 0
    buf[o + 3] = Math.round(255 * fa * (1 - fe))
  }
  return encodePNG(size, size, buf)
}

// ---- wrap a PNG into a single-image .ico ----
function pngToIco(png, size) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)
  const entry = Buffer.alloc(16)
  entry[0] = size >= 256 ? 0 : size
  entry[1] = size >= 256 ? 0 : size
  entry.writeUInt16LE(1, 4)
  entry.writeUInt16LE(32, 6)
  entry.writeUInt32LE(png.length, 8)
  entry.writeUInt32LE(6 + 16, 12)
  return Buffer.concat([header, entry, png])
}

const root = __dirname
fs.mkdirSync(path.join(root, 'build'), { recursive: true })
fs.mkdirSync(path.join(root, 'src', 'assets'), { recursive: true })

fs.writeFileSync(path.join(root, 'build', 'icon.png'), colored(coverage(1024)))
fs.writeFileSync(path.join(root, 'build', 'icon.ico'), pngToIco(colored(coverage(256)), 256))
fs.writeFileSync(path.join(root, 'src', 'assets', 'icon.png'), colored(coverage(256)))
fs.writeFileSync(path.join(root, 'src', 'assets', 'tray.png'), colored(coverage(32)))
fs.writeFileSync(path.join(root, 'src', 'assets', 'trayTemplate.png'), template(coverage(22)))
console.log('Icons generated:')
console.log('  build/icon.png (1024), build/icon.ico (256)')
console.log('  src/assets/icon.png (256), src/assets/tray.png (32), src/assets/trayTemplate.png (22)')
