// ============================================================================
// Generate Windows/macOS app icon + tray icon assets from public/app-icon.svg
// Run: npm run generate:icons
//
// Outputs:
//   resources/icon.png          — 512×512 app/dock icon
//   resources/icon.ico          — multi-size ICO for Windows
//   resources/tray-running.png  — 32×32 tray icon, green bg (automation running)
//   resources/tray-running@2x.png — 64×64 retina variant
//   resources/tray-stopped.png  — 32×32 tray icon, red bg (automation stopped)
//   resources/tray-stopped@2x.png — 64×64 retina variant
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
const ICO_SIZES = [16, 20, 24, 32, 40, 48, 64, 128, 256]
const MAC_ICON_SIZE = 512

// ─── Tray icon colours ────────────────────────────────────────────────────────
// #2d6a4f = --color-success (running)
// #9b2335 = --color-error   (stopped)
const TRAY_BG_RUNNING = '#2d6a4f'
const TRAY_BG_STOPPED = '#9b2335'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const renderPng = (svg, size) => {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
  })
  return Buffer.from(resvg.render().asPng())
}

/**
 * Build a tray icon SVG by swapping the background fill of the app-icon SVG.
 * The SVG viewBox stays at 256×256 so resvg scales it to any output size
 * with perfect quality and the correct border-radius proportion.
 */
const buildTraySvg = (sourceSvg, bgColor) => {
  // Replace the first rect's fill with the status colour.
  return sourceSvg.toString().replace(
    /(<rect[^>]*fill=")[^"]*(")/,
    `$1${bgColor}$2`,
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const main = async () => {
  const svg = fs.readFileSync(SVG_PATH)
  fs.mkdirSync(OUT_DIR, { recursive: true })

  // ── App icon (unchanged) ─────────────────────────────────────────────────
  const pngBuffers = ICO_SIZES.map((size) => renderPng(svg, size))
  const png512 = renderPng(svg, MAC_ICON_SIZE)

  fs.writeFileSync(path.join(OUT_DIR, 'icon.png'), png512)
  fs.writeFileSync(path.join(OUT_DIR, 'icon.ico'), await pngToIco(pngBuffers))
  console.log('✓ icon.png  (512px)')
  console.log('✓ icon.ico  (multi-size)')

  // ── Tray icons — running (green) + stopped (red) ─────────────────────────
  for (const [label, bg] of [['running', TRAY_BG_RUNNING], ['stopped', TRAY_BG_STOPPED]]) {
    const traySvg = buildTraySvg(svg, bg)

    // 1× (32px) and 2× (64px) for retina / high-DPI displays.
    // Electron automatically picks the @2x variant on retina screens when
    // both files exist alongside each other.
    const png32 = renderPng(traySvg, 32)
    const png64 = renderPng(traySvg, 64)

    fs.writeFileSync(path.join(OUT_DIR, `tray-${label}.png`), png32)
    fs.writeFileSync(path.join(OUT_DIR, `tray-${label}@2x.png`), png64)

    console.log(`✓ tray-${label}.png  (32px)`)
    console.log(`✓ tray-${label}@2x.png  (64px, retina)`)
  }
}

main().catch((error) => {
  console.error('Failed to generate icons:', error)
  process.exit(1)
})
