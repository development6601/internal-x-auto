// ============================================================================
// IMPORTS
// ============================================================================

import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SoundUrls {
  startEnd: string
  secondBeep: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SOUND_FILENAMES = {
  startEnd: 'start-end.mp3',
  secondBeep: 'second-beep.mp3',
} as const

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Resolve absolute file:// URLs for UI sound assets.
 *
 * Packaged builds store sounds in extraResources (`resources/sound/`).
 * Dev mode uses `public/sound/` (copied from `resources/sound/` at build start).
 * Absolute `/sound/...` paths break under Electron's `file://` page load.
 */
export function resolveSoundUrls(): SoundUrls {
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath

  const candidateDirs = [
    resourcesPath ? path.join(resourcesPath, 'resources', 'sound') : null,
    path.join(process.cwd(), 'public', 'sound'),
    path.join(process.cwd(), 'resources', 'sound'),
    path.join(process.cwd(), 'dist', 'sound'),
  ].filter((dir): dir is string => !!dir)

  for (const dir of candidateDirs) {
    const startPath = path.join(dir, SOUND_FILENAMES.startEnd)
    if (!fs.existsSync(startPath)) continue

    return {
      startEnd: pathToFileURL(startPath).href,
      secondBeep: pathToFileURL(path.join(dir, SOUND_FILENAMES.secondBeep)).href,
    }
  }

  return {
    startEnd: './sound/start-end.mp3',
    secondBeep: './sound/second-beep.mp3',
  }
}
