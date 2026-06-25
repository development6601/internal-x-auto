// ============================================================================
// IMPORTS
// ============================================================================

import { app, nativeImage } from 'electron'
import type { NativeImage } from 'electron'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// ============================================================================
// CONSTANTS
// ============================================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ============================================================================
// STATE
// ============================================================================

let cachedAppIcon: NativeImage | null = null
let cachedIconPath: string | null | undefined

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Build an ordered list of icon file paths to try.
 * Called at resolve-time (not module init) so process.resourcesPath is available.
 */
const buildIconCandidates = (): string[] => {
  const preferIco = process.platform === 'win32'
  const seen = new Set<string>()
  const candidates: string[] = []

  const add = (candidate: string): void => {
    const normalized = path.resolve(candidate)
    if (seen.has(normalized)) return
    seen.add(normalized)
    candidates.push(normalized)
  }

  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath

  // Packaged app — real filesystem path outside asar (most reliable on Windows)
  if (resourcesPath) {
    if (preferIco) {
      add(path.join(resourcesPath, 'resources', 'icon.ico'))
      add(path.join(resourcesPath, 'resources', 'icon.png'))
    } else {
      add(path.join(resourcesPath, 'resources', 'icon.png'))
      add(path.join(resourcesPath, 'resources', 'icon.ico'))
    }
  }

  // Dev mode — project root resources/ (always populated by predev / generate:icons)
  if (preferIco) {
    add(path.join(process.cwd(), 'resources', 'icon.ico'))
    add(path.join(process.cwd(), 'resources', 'icon.png'))
  } else {
    add(path.join(process.cwd(), 'resources', 'icon.png'))
    add(path.join(process.cwd(), 'resources', 'icon.ico'))
  }

  // Vite build output copies icons here
  if (preferIco) {
    add(path.join(__dirname, 'resources', 'icon.ico'))
    add(path.join(__dirname, '../resources/icon.ico'))
    add(path.join(__dirname, '../../resources/icon.ico'))
    add(path.join(__dirname, 'resources', 'icon.png'))
    add(path.join(__dirname, '../resources/icon.png'))
  } else {
    add(path.join(__dirname, 'resources', 'icon.png'))
    add(path.join(__dirname, '../resources/icon.png'))
    add(path.join(__dirname, 'resources', 'icon.ico'))
    add(path.join(__dirname, '../resources/icon.ico'))
    add(path.join(__dirname, '../../resources/icon.ico'))
  }

  // Packaged app root (inside asar fallback)
  try {
    if (preferIco) {
      add(path.join(app.getAppPath(), 'resources', 'icon.ico'))
      add(path.join(app.getAppPath(), 'resources', 'icon.png'))
    } else {
      add(path.join(app.getAppPath(), 'resources', 'icon.png'))
      add(path.join(app.getAppPath(), 'resources', 'icon.ico'))
    }
  } catch {
    // app not ready yet — skip
  }

  return candidates
}

const resolveIconPath = (): string | null => {
  for (const candidate of buildIconCandidates()) {
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

const buildAppIconImage = (iconPath: string): NativeImage => {
  const image = nativeImage.createFromPath(iconPath)
  if (image.isEmpty()) return nativeImage.createEmpty()

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

/** Returns the InternalX window/taskbar/dock icon. */
export function getAppIcon(): NativeImage {
  if (!cachedAppIcon || cachedAppIcon.isEmpty()) {
    const iconPath = getAppIconPath()
    cachedAppIcon = iconPath ? buildAppIconImage(iconPath) : nativeImage.createEmpty()
  }
  return cachedAppIcon
}

/**
 * Windows-only: absolute path to .ico for BrowserWindow taskbar icon.
 * macOS/Linux must use PNG via getAppIcon() — .ico paths throw on setIcon.
 */
export function getWindowsWindowIcon(): string | undefined {
  if (process.platform !== 'win32') return undefined

  const iconPath = getAppIconPath()
  if (!iconPath) return undefined
  if (iconPath.endsWith('.ico')) return iconPath

  const icoCandidate = iconPath.replace(/\.png$/i, '.ico')
  if (fs.existsSync(icoCandidate)) return icoCandidate

  return iconPath
}
