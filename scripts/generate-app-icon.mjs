// ============================================================================
// Generate Windows/macOS app icon assets from public/app-icon.svg
// Run: npm run generate:icons
// ============================================================================

import { Resvg } from '@resvg/resvg-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pngToIco from 'png-to-ico'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SVG_PATH = path.join(ROOT, 'public', 'app-icon.svg')
const OUT_DIR = path.join(ROOT, 'resources')
const ICO_SIZES = [16, 32, 48, 64, 128, 256]

const renderPng = (svg, size) => {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
  })
  return Buffer.from(resvg.render().asPng())
}

const main = async () => {
  const svg = fs.readFileSync(SVG_PATH)
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const pngBuffers = ICO_SIZES.map((size) => renderPng(svg, size))
  const png256 = pngBuffers[pngBuffers.length - 1]

  fs.writeFileSync(path.join(OUT_DIR, 'icon.png'), png256)
  fs.writeFileSync(path.join(OUT_DIR, 'icon.ico'), await pngToIco(pngBuffers))

  console.log(`Generated ${path.join(OUT_DIR, 'icon.png')}`)
  console.log(`Generated ${path.join(OUT_DIR, 'icon.ico')}`)
}

main().catch((error) => {
  console.error('Failed to generate app icons:', error)
  process.exit(1)
})
