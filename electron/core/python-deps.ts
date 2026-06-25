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

const REQUIREMENTS_FILE = 'requirements.txt'
const PIP_INSTALL_TIMEOUT_MS = 10 * 60 * 1000

function requirementsExists(scriptsDir: string): boolean {
  return fs.existsSync(path.join(scriptsDir, REQUIREMENTS_FILE))
}

/**
 * Resolve the Python scripts directory across dev, bundled, and packaged builds.
 * Picks the first candidate that contains requirements.txt (Windows + macOS).
 */
function buildScriptsDirCandidates(): string[] {
  const candidates: string[] = []
  const seen = new Set<string>()

  const addCandidate = (dir: string): void => {
    const normalized = path.resolve(dir)
    if (seen.has(normalized)) return
    seen.add(normalized)
    candidates.push(normalized)
  }

  // Dev / npm run dev — cwd is always the project root
  addCandidate(path.resolve(process.cwd(), 'scripts'))

  // Packaged Electron app (electron-builder resources)
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath
  if (resourcesPath) {
    addCandidate(path.join(resourcesPath, 'scripts'))
  }

  // Vite build output copies scripts here for production-like local builds
  addCandidate(path.resolve(process.cwd(), 'dist-electron', 'scripts'))

  // Relative to bundled main.js (dist-electron/) or split chunk (dist-electron/core/)
  const moduleDir = __dirname
  addCandidate(path.join(moduleDir, 'scripts'))
  addCandidate(path.resolve(moduleDir, '..', 'scripts'))
  addCandidate(path.resolve(moduleDir, '../..', 'scripts'))

  return candidates
}

export function getScriptsDir(): string {
  const candidates = buildScriptsDirCandidates()

  for (const candidate of candidates) {
    if (requirementsExists(candidate)) {
      devLog('INFO', `Scripts dir resolved: ${candidate}`)
      return candidate
    }
  }

  const fallback = path.resolve(process.cwd(), 'scripts')
  devLog('WARN', `Scripts dir fallback (requirements.txt missing): ${fallback}`)
  devLog('WARN', `Tried: ${candidates.join(' | ')}`)
  return fallback
}

export function getRequirementsPath(): string {
  return path.join(getScriptsDir(), REQUIREMENTS_FILE)
}

export function detectPythonBinary(): string | null {
  const candidates = process.platform === 'win32'
    ? ['python', 'python3', 'py']
    : ['python3', 'python']

  for (const bin of candidates) {
    try {
      execSync(`${bin} --version`, { stdio: 'ignore', timeout: 5000 })
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
      // 8s timeout per module — prevents hanging on macOS HID/IOKit access
      // (e.g. the `keyboard` package blocks without root on macOS)
      execSync(`${pythonBin} -c "import ${moduleName}"`, {
        stdio: 'ignore',
        timeout: 8000,
      })
    } catch {
      missing.push(moduleName)
    }
  }

  return missing
}

function buildPipInstallArgs(requirementsPath: string, includeBreakSystemPackages: boolean): string[] {
  const args = [
    '-m',
    'pip',
    'install',
    '-r',
    requirementsPath,
    '--disable-pip-version-check',
    '--no-input',
    '--prefer-binary',    // use pre-built wheels; avoids C compilation hang on macOS
    '--timeout', '60',   // per-request network timeout
    '--user',
  ]

  if (includeBreakSystemPackages) {
    args.push('--break-system-packages')
  }

  return args
}

function isExternallyManagedPipError(output: string): boolean {
  return output.toLowerCase().includes('externally-managed-environment')
}

function streamPipOutput(
  chunk: Buffer,
  isStderr: boolean,
  buffers: { stdout: string; stderr: string },
  onLog?: LogCallback,
): void {
  const text = chunk.toString()

  if (isStderr) {
    buffers.stderr += text
  } else {
    buffers.stdout += text
  }

  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
  for (const line of lines) {
    devLog(isStderr ? 'STDERR' : 'INFO', `pip: ${line}`)
    onLog?.(`pip — ${line}`)
  }
}

function runPipInstall(
  pythonBin: string,
  requirementsPath: string,
  includeBreakSystemPackages: boolean,
  onLog?: LogCallback,
): Promise<{ ok: boolean; error?: string; output: string }> {
  const pipArgs = buildPipInstallArgs(requirementsPath, includeBreakSystemPackages)
  const commandLabel = `${pythonBin} ${pipArgs.join(' ')}`

  devLog('INFO', `Running: ${commandLabel}`)
  onLog?.(`INFO — Running: ${commandLabel}`)

  return new Promise((resolve) => {
    const proc = spawn(pythonBin, pipArgs, {
      windowsHide: true,
      env: {
        ...process.env,
        PIP_DISABLE_PIP_VERSION_CHECK: '1',
        PYTHONUNBUFFERED: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    const buffers = { stdout: '', stderr: '' }
    let settled = false

    const finish = (result: { ok: boolean; error?: string; output: string }) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(result)
    }

    const timer = setTimeout(() => {
      proc.kill('SIGTERM')
      const timeoutMessage = `pip install timed out after ${PIP_INSTALL_TIMEOUT_MS / 1000}s`
      devLog('ERROR', timeoutMessage)
      finish({
        ok: false,
        error: `${timeoutMessage}. Try manually: ${commandLabel}`,
        output: `${buffers.stdout}\n${buffers.stderr}`,
      })
    }, PIP_INSTALL_TIMEOUT_MS)

    proc.stdout?.on('data', (data: Buffer) => {
      streamPipOutput(data, false, buffers, onLog)
    })

    proc.stderr?.on('data', (data: Buffer) => {
      streamPipOutput(data, true, buffers, onLog)
    })

    proc.on('error', (err) => {
      finish({ ok: false, error: err.message, output: buffers.stderr })
    })

    proc.on('close', (code) => {
      const combinedOutput = `${buffers.stderr}\n${buffers.stdout}`.trim()

      if (code === 0) {
        finish({ ok: true, output: combinedOutput })
        return
      }

      const errorMessage = combinedOutput.length > 0
        ? combinedOutput
        : `pip install failed (exit code: ${code ?? 'unknown'})`

      finish({ ok: false, error: errorMessage, output: combinedOutput })
    })
  })
}

async function installPythonDependencies(
  pythonBin: string,
  requirementsPath: string,
  onLog?: LogCallback,
): Promise<{ ok: boolean; error?: string }> {
  const firstAttempt = await runPipInstall(pythonBin, requirementsPath, false, onLog)

  if (firstAttempt.ok) {
    return { ok: true }
  }

  if (process.platform === 'darwin' && isExternallyManagedPipError(firstAttempt.output)) {
    devLog('WARN', 'Retrying pip install with --break-system-packages for macOS Homebrew Python')
    onLog?.('WARN — Retrying pip install with --break-system-packages')
    const retryAttempt = await runPipInstall(pythonBin, requirementsPath, true, onLog)
    return { ok: retryAttempt.ok, error: retryAttempt.error }
  }

  return { ok: false, error: firstAttempt.error }
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

  const requirementsPath = getRequirementsPath()

  if (!fs.existsSync(requirementsPath)) {
    const tried = buildScriptsDirCandidates().join(' | ')
    const message = `requirements.txt not found at: ${requirementsPath}. Tried: ${tried}`
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

  const requirementsPath = getRequirementsPath()

  if (!fs.existsSync(requirementsPath)) {
    const tried = buildScriptsDirCandidates().join(' | ')
    const message = `requirements.txt not found at: ${requirementsPath}. Tried: ${tried}`
    devLog('ERROR', message)
    return { success: false, error: message }
  }

  const installingEntry = 'INFO — Installing Python packages from requirements.txt...'
  writeLog(installingEntry)
  onLog?.(installingEntry)

  const installResult = await installPythonDependencies(pythonBin, requirementsPath, onLog)
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
