import { cpSync, existsSync, mkdirSync, readdirSync } from 'fs'
import path from 'path'
import type { Plugin } from 'vite'

const RESOURCE_FILES = ['icon.ico', 'icon.png'] as const

/** Copy raster app icons and helper scripts into dist-electron for runtime. */
export function copyAppResourcesPlugin(): Plugin {
  return {
    name: 'copy-app-resources',
    closeBundle() {
      const resourceSrc = path.resolve(process.cwd(), 'resources')
      const resourceDest = path.resolve(process.cwd(), 'dist-electron/resources')
      const scriptSrc = path.resolve(process.cwd(), 'electron/scripts')
      const scriptDest = path.resolve(process.cwd(), 'dist-electron/scripts')

      if (existsSync(resourceSrc)) {
        mkdirSync(resourceDest, { recursive: true })
        for (const file of RESOURCE_FILES) {
          const src = path.join(resourceSrc, file)
          if (existsSync(src)) {
            cpSync(src, path.join(resourceDest, file))
          }
        }
      }

      if (existsSync(scriptSrc)) {
        mkdirSync(scriptDest, { recursive: true })
        for (const file of readdirSync(scriptSrc)) {
          if (file.endsWith('.ps1')) {
            cpSync(path.join(scriptSrc, file), path.join(scriptDest, file))
          }
        }
      }
    },
  }
}
