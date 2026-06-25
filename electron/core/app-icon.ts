// ============================================================================
// IMPORTS
// ============================================================================

import { nativeImage } from 'electron'
import type { NativeImage } from 'electron'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// ============================================================================
// CONSTANTS
// ============================================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// process.resourcesPath is the real filesystem path to the app's `resources/`
// folder outside the asar archive — set by electron-builder for packaged apps.
// Checking this first avoids loading the icon from inside the asar, which can
// fail silently on Windows when used for taskbar/window icons.
const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath

const buildIconCandidates = (preferIco: boolean): string[] => {
  const candidates: string[] = []

  // 1. Packaged app: real filesystem path outside asar (most reliable on Windows)
  if (resourcesPath) {
    if (preferIco) {
      candidates.push(path.join(resourcesPath, 'resources', 'icon.ico'))
      candidates.push(path.join(resourcesPath, 'resources', 'icon.png'))
    } else {
      candidates.push(path.join(resourcesPath, 'resources', 'icon.png'))
      candidates.push(path.join(resourcesPath, 'resources', 'icon.ico'))
    }
  }

  // 2. Relative to the bundled module inside the asar (dev + local builds)
  if (preferIco) {
    candidates.push(path.join(__dirname, 'resources', 'icon.ico'))
    candidates.push(path.join(__dirname, '../resources/icon.ico'))
    candidates.push(path.join(__dirname, 'resources', 'icon.png'))
    candidates.push(path.join(__dirname, '../resources/icon.png'))
  } else {
    candidates.push(path.join(__dirname, 'resources', 'icon.png'))
    candidates.push(path.join(__dirname, '../resources/icon.png'))
    candidates.push(path.join(__dirname, 'resources', 'icon.ico'))
    candidates.push(path.join(__dirname, '../resources/icon.ico'))
  }

  return candidates
}

const ICON_CANDIDATES_WIN     = buildIconCandidates(true)
const ICON_CANDIDATES_DEFAULT = buildIconCandidates(false)

// ============================================================================
// STATE
// ============================================================================

let cachedAppIcon: NativeImage | null = null
let cachedIconPath: string | null | undefined

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const resolveIconPath = (): string | null => {
  const candidates = process.platform === 'win32' ? ICON_CANDIDATES_WIN : ICON_CANDIDATES_DEFAULT

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }

  return null
}

const buildAppIconImage = (iconPath: string): NativeImage => {
  const image = nativeImage.createFromPath(iconPath)
  if (image.isEmpty()) return nativeImage.createEmpty()

  // Windows title bar / taskbar buttons render small sizes from the ICO asset.
  if (process.platform === 'win32' && iconPath.endsWith('.png')) {
    return image.resize({ width: 256, height: 256 })
  }

  return image
}

// ============================================================================
// EXPORTS
// ============================================================================

/** Absolute path to icon.ico / icon.png when present. */
export function getAppIconPath(): string | null {
  if (cachedIconPath === undefined) {
    cachedIconPath = resolveIconPath()
  }
  return cachedIconPath
}

/** Returns the InternalX window/taskbar/dock icon (loader pinwheel). */
export function getAppIcon(): NativeImage {
  if (!cachedAppIcon || cachedAppIcon.isEmpty()) {
    const iconPath = getAppIconPath()
    cachedAppIcon = iconPath ? buildAppIconImage(iconPath) : nativeImage.createEmpty()
  }
  return cachedAppIcon
}
