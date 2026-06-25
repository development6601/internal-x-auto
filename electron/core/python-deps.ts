// ============================================================================
// IMPORTS
// ============================================================================

import { execSync, spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { devLog } from './dev-logger.js'
import { writeLog } from './logger.js'
import type { PrerequisitesCheckResult, PrerequisitesInstallResult } from './types.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type LogCallback = (entry: string) => void

// ============================================================================
// CONSTANTS
// ============================================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SCRIPTS_DIR_DEV = path.resolve(__dirname, '../scripts')
const REQUIREMENTS_FILE = 'requirements.txt'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getScriptsDir(): string {
  if (process.env.VITE_DEV_SERVER_URL) return SCRIPTS_DIR_DEV

  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath
  return resourcesPath ? path.join(resourcesPath, 'scripts') : SCRIPTS_DIR_DEV
}

export function detectPythonBinary(): string | null {
  const candidates = process.platform === 'win32'
    ? ['python', 'python3', 'py']
    : ['python3', 'python']

  for (const bin of candidates) {
    try {
      execSync(`${bin} --version`, { stdio: 'ignore' })
      return bin
    } catch {
      // try next candidate
    }
  }
  return null
}

function parseRequirementModuleNames(requirementsPath: string): string[] {
  if (!fs.existsSync(requirementsPath)) return []

  const content = fs.readFileSync(requirementsPath, 'utf8')
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => line.split(/[>=<![\s]/)[0].trim())
    .filter(Boolean)
}

function getMissingModules(pythonBin: string, moduleNames: string[]): string[] {
  const missing: string[] = []

  for (const moduleName of moduleNames) {
    try {
      execSync(`${pythonBin} -c "import ${moduleName}"`, { stdio: 'ignore' })
    } catch {
      missing.push(moduleName)
    }
  }

  return missing
}

function installPythonDependencies(
  pythonBin: string,
  requirementsPath: string,
): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const proc = spawn(
      pythonBin,
      ['-m', 'pip', 'install', '-r', requirementsPath, '--disable-pip-version-check'],
      {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )

    let stderr = ''

    proc.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    proc.on('error', (err) => {
      resolve({ ok: false, error: err.message })
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ ok: true })
        return
      }

      const trimmedStderr = stderr.trim()
      const errorMessage = trimmedStderr.length > 0
        ? trimmedStderr
        : `pip install failed (exit code: ${code ?? 'unknown'})`

      resolve({ ok: false, error: errorMessage })
    })
  })
}

// ============================================================================
// EXPORTS
// ============================================================================

export function checkPythonPrerequisites(): PrerequisitesCheckResult {
  devLog('INFO', 'Checking Python prerequisites...')

  const pythonBin = detectPythonBinary()
  if (!pythonBin) {
    devLog('WARN', 'Prerequisites check: Python not found')
    return {
      ready: false,
      pythonFound: false,
      missingModules: [],
      message: 'Python not found in PATH',
    }
  }

  const scriptsDir = getScriptsDir()
  const requirementsPath = path.join(scriptsDir, REQUIREMENTS_FILE)

  if (!fs.existsSync(requirementsPath)) {
    const message = `requirements.txt not found at: ${requirementsPath}`
    devLog('ERROR', message)
    return {
      ready: false,
      pythonFound: true,
      pythonBin,
      missingModules: [],
      message,
    }
  }

  const moduleNames = parseRequirementModuleNames(requirementsPath)
  const missingModules = getMissingModules(pythonBin, moduleNames)

  if (missingModules.length === 0) {
    devLog('INFO', 'Prerequisites check: all requirements met')
    return {
      ready: true,
      pythonFound: true,
      pythonBin,
      missingModules: [],
    }
  }

  devLog('INFO', `Prerequisites check: missing modules — ${missingModules.join(', ')}`)
  return {
    ready: false,
    pythonFound: true,
    pythonBin,
    missingModules,
    message: `Missing packages: ${missingModules.join(', ')}`,
  }
}

export async function installPythonPrerequisites(
  onLog?: LogCallback,
): Promise<PrerequisitesInstallResult> {
  devLog('INFO', 'Installing Python prerequisites...')

  const pythonBin = detectPythonBinary()
  if (!pythonBin) {
    const message = 'Python not found. Please install Python 3 and add it to PATH.'
    devLog('ERROR', message)
    return { success: false, error: message }
  }

  const scriptsDir = getScriptsDir()
  const requirementsPath = path.join(scriptsDir, REQUIREMENTS_FILE)

  if (!fs.existsSync(requirementsPath)) {
    const message = `requirements.txt not found at: ${requirementsPath}`
    devLog('ERROR', message)
    return { success: false, error: message }
  }

  const installingEntry = 'INFO — Installing Python packages from requirements.txt...'
  writeLog(installingEntry)
  onLog?.(installingEntry)

  const installResult = await installPythonDependencies(pythonBin, requirementsPath)
  if (!installResult.ok) {
    const manualHint = `Run manually: ${pythonBin} -m pip install -r "${requirementsPath}"`
    const error = installResult.error ?? 'Failed to install Python packages'
    const message = `${error}. ${manualHint}`
    devLog('ERROR', `pip install failed: ${message}`)
    return { success: false, error: message }
  }

  const moduleNames = parseRequirementModuleNames(requirementsPath)
  const missingModules = getMissingModules(pythonBin, moduleNames)

  if (missingModules.length > 0) {
    const message = `Packages installed but import still failed: ${missingModules.join(', ')}`
    devLog('ERROR', message)
    return { success: false, error: message }
  }

  const installedEntry = 'INFO — Python dependencies installed successfully'
  devLog('INFO', 'Python prerequisites installed successfully')
  writeLog(installedEntry)
  onLog?.(installedEntry)

  return { success: true }
}
