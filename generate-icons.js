// generate-icons.js
// Generates the app/tray icons from scratch (no image libraries needed).
// Produces: build/icon.ico + build/icon.png (installer & exe icon)
//           src/assets/tray.png (system-tray icon, bundled at runtime)
// Run with:  node generate-icons.js
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
  // rows with filter byte 0
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// ---- draw a smiley face ----
function draw(size) {
  const buf = Buffer.alloc(size * size * 4) // transparent
  const cx = size / 2, cy = size / 2
  const r = size * 0.46
  const face = [0xd4, 0xa0, 0x4f] // accent gold
  const ink = [0x1c, 0x1c, 0x22]  // dark
  const set = (x, y, rgb, a) => {
    x = Math.round(x); y = Math.round(y)
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    const na = a, ia = 1 - a
    buf[i]     = Math.round(rgb[0] * na + buf[i] * ia)
    buf[i + 1] = Math.round(rgb[1] * na + buf[i + 1] * ia)
    buf[i + 2] = Math.round(rgb[2] * na + buf[i + 2] * ia)
    buf[i + 3] = Math.max(buf[i + 3], Math.round(255 * na))
  }
  const stamp = (x0, y0, rad, rgb) => {
    for (let y = Math.floor(y0 - rad - 1); y <= y0 + rad + 1; y++)
      for (let x = Math.floor(x0 - rad - 1); x <= x0 + rad + 1; x++) {
        const d = Math.hypot(x + 0.5 - x0, y + 0.5 - y0)
        const a = Math.max(0, Math.min(1, rad - d + 0.5))
        if (a > 0) set(x, y, rgb, a)
      }
  }
  // face disk (anti-aliased edge)
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
      const a = Math.max(0, Math.min(1, r - d + 0.5))
      if (a > 0) set(x, y, face, a)
    }
  // eyes
  stamp(cx - 0.22 * r, cy - 0.18 * r, r * 0.085, ink)
  stamp(cx + 0.22 * r, cy - 0.18 * r, r * 0.085, ink)
  // smile (parabola of stamped dots)
  const mw = r * 0.42, baseY = cy + 0.34 * r, lift = 0.20 * r
  for (let t = -mw; t <= mw; t += r * 0.02) {
    const x = cx + t
    const y = baseY - lift * (t / mw) * (t / mw)
    stamp(x, y, r * 0.055, ink)
  }
  return encodePNG(size, size, buf)
}

// ---- wrap a PNG into a single-image .ico ----
function pngToIco(png, size) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)  // reserved
  header.writeUInt16LE(1, 2)  // type = icon
  header.writeUInt16LE(1, 4)  // count
  const entry = Buffer.alloc(16)
  entry[0] = size >= 256 ? 0 : size // width (0 => 256)
  entry[1] = size >= 256 ? 0 : size // height
  entry[2] = 0  // palette
  entry[3] = 0  // reserved
  entry.writeUInt16LE(1, 4)        // planes
  entry.writeUInt16LE(32, 6)       // bpp
  entry.writeUInt32LE(png.length, 8)
  entry.writeUInt32LE(6 + 16, 12)  // offset
  return Buffer.concat([header, entry, png])
}

const root = __dirname
fs.mkdirSync(path.join(root, 'build'), { recursive: true })
fs.mkdirSync(path.join(root, 'src', 'assets'), { recursive: true })

const png256 = draw(256)
const png32 = draw(32)
fs.writeFileSync(path.join(root, 'build', 'icon.png'), png256)
fs.writeFileSync(path.join(root, 'build', 'icon.ico'), pngToIco(png256, 256))
fs.writeFileSync(path.join(root, 'src', 'assets', 'tray.png'), png32)
fs.writeFileSync(path.join(root, 'src', 'assets', 'icon.png'), png256)
console.log('Icons generated: build/icon.ico, build/icon.png, src/assets/tray.png, src/assets/icon.png')
