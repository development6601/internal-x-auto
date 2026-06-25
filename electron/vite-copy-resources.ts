import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs'
import path from 'path'
import type { Plugin } from 'vite'

const RESOURCE_FILES = ['icon.ico', 'icon.png'] as const

const copyPythonScripts = (srcDir: string, destDir: string): void => {
  if (!existsSync(srcDir)) return

  mkdirSync(destDir, { recursive: true })

  for (const entry of readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, entry)
    const destPath = path.join(destDir, entry)
    const stats = statSync(srcPath)

    if (stats.isDirectory()) {
      if (entry === 'lib') {
        cpSync(srcPath, destPath, { recursive: true })
      }
      continue
    }

    if (entry.endsWith('.py') || entry === 'requirements.txt') {
      cpSync(srcPath, destPath)
    }
  }
}

/** Copy raster app icons and runtime scripts into dist-electron. */
function copyAppResources(): void {
  const resourceSrc = path.resolve(process.cwd(), 'resources')
  const resourceDest = path.resolve(process.cwd(), 'dist-electron/resources')
  const electronScriptSrc = path.resolve(process.cwd(), 'electron/scripts')
  const pythonScriptSrc = path.resolve(process.cwd(), 'scripts')
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

  mkdirSync(scriptDest, { recursive: true })

  copyPythonScripts(pythonScriptSrc, scriptDest)

  if (existsSync(electronScriptSrc)) {
    for (const file of readdirSync(electronScriptSrc)) {
      if (file.endsWith('.ps1') || file.endsWith('.applescript')) {
        cpSync(path.join(electronScriptSrc, file), path.join(scriptDest, file))
      }
    }
  }
}

export function copyAppResourcesPlugin(): Plugin {
  return {
    name: 'copy-app-resources',
    // Dev: copy icons before Electron starts so taskbar icon resolves immediately
    buildStart() {
      copyAppResources()
    },
    closeBundle() {
      copyAppResources()
    },
  }
}
