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

const ICON_CANDIDATES_WIN = [
  path.join(__dirname, 'resources', 'icon.ico'),
  path.join(__dirname, '../resources/icon.ico'),
  path.join(__dirname, 'resources', 'icon.png'),
  path.join(__dirname, '../resources/icon.png'),
]

const ICON_CANDIDATES_DEFAULT = [
  path.join(__dirname, 'resources', 'icon.png'),
  path.join(__dirname, '../resources/icon.png'),
  path.join(__dirname, 'resources', 'icon.ico'),
  path.join(__dirname, '../resources/icon.ico'),
]

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
