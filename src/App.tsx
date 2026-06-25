// ============================================================================
// IMPORTS
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Copy, Download, ScrollText, Terminal, Trash2 } from 'lucide-react'
import PrerequisiteStatusButton from '@/components/features/PrerequisiteStatusButton'
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Input,
  Label,
  Modal,
  RadioGroup,
  SectionLabel,
  Tooltip,
  WarningHint,
} from '@/components/ui'
import {
  ACTIVITY_LOG_TOOLTIP,
  APP_MAX_WIDTH,
  APP_NAME,
  HIDE_ACTIVITY_LOG_TOOLTIP,
} from '@/constants/app.constants'
import type { AutomationMode, AutomationStatus } from '@/types/automation.types'
import { cn } from '@/utils/cn'
import { formatDuration, parseTimerInput, timerToSeconds } from '@/utils/format'
import useAutomation from '@/hooks/useAutomation'
import useActivityLog from '@/hooks/useActivityLog'
import useDevLog from '@/hooks/useDevLog'
import usePrerequisites from '@/hooks/usePrerequisites'
import useVoice from '@/hooks/useVoice'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ModeOption {
  value: AutomationMode
  label: string
  tooltip: React.ReactNode
}

// ============================================================================
// CONSTANTS
// ============================================================================

const NO_TIMER_TOOLTIP = (
  <>
    No stop timer set. Automation will run indefinitely until manually stopped.
  </>
)

const MODE_OPTIONS: ModeOption[] = [
  {
    value: 'basic',
    label: 'Basic',
    tooltip: (
      <>
        Browser tab and editor switching only. No application switching (Alt+Tab).
      </>
    ),
  },
  {
    value: 'advanced',
    label: 'Advanced',
    tooltip: (
      <>
        Full activity simulation across applications. Includes Alt+Tab between browser and editor.
      </>
    ),
  },
]

const CLOSE_UPWORK_TOOLTIP = (
  <>
    Closes the Upwork Desktop App when automation stops. Graceful close first, then force kill if needed. Check Dev Log for steps.
  </>
)

const SHUTDOWN_TOOLTIP = (
  <>
    Shuts down the system after automation ends. Shows a 30-second countdown before shutdown — cancel anytime.
  </>
)

const EXPORT_LOG_TOOLTIP = (
  <>
    Export activity log to a file.
    <br />
    Saves the raw log content as-is.
  </>
)

const START_COUNTDOWN_SECONDS = 10

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getStatusBadge = (status: AutomationStatus) => {
  if (status === 'running') return { label: 'Running', variant: 'running' as const }
  if (status === 'countdown') return { label: 'Starting', variant: 'warning' as const }
  if (status === 'error') return { label: 'Error', variant: 'error' as const }
  return { label: 'Stopped', variant: 'neutral' as const }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const App = () => {
  // ============================================================================
  // STATE - Core Data
  // ============================================================================
  const [status, setStatus] = useState<AutomationStatus>('stopped')
  const [mode, setMode] = useState<AutomationMode>('advanced')
  const [timerHours, setTimerHours] = useState('0')
  const [timerMinutes, setTimerMinutes] = useState('0')
  const [closeTracker, setCloseTracker] = useState(false)
  const [shutdownAfterStop, setShutdownAfterStop] = useState(false)

  // ============================================================================
  // STATE - UI Control
  // ============================================================================

  /** Captures start payload at countdown-begin time so the effect can use it safely. */
  const startPayloadRef = useRef<{
    mode: AutomationMode
    durationSeconds: number
    closeTracker: boolean
    shutdown: boolean
  } | null>(null)

  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [showIndefiniteModal, setShowIndefiniteModal] = useState(false)
  const [showShutdownModal, setShowShutdownModal] = useState(false)
  const [shutdownCountdown, setShutdownCountdown] = useState(30)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showActivityLog, setShowActivityLog] = useState(false)
  const [showDevLog, setShowDevLog] = useState(false)
  const [devLogCopied, setDevLogCopied] = useState(false)
  const [showPrereqSuccessModal, setShowPrereqSuccessModal] = useState(false)
  const [showPrereqFailureModal, setShowPrereqFailureModal] = useState(false)
  const [prereqFailureMessage, setPrereqFailureMessage] = useState<string | null>(null)

  // ============================================================================
  // CUSTOM HOOKS - IPC Bridge
  // ============================================================================

  const handleIpcStatus = useCallback((ipcStatus: 'running' | 'stopped' | 'error') => {
    setStatus((prev) => {
      if (ipcStatus === 'running') return 'running'
      if (ipcStatus === 'error') return 'error'
      // 'stopped' from IPC: only update if we're not already stopped
      if (ipcStatus === 'stopped' && prev !== 'stopped') return 'stopped'
      return prev
    })
  }, [])

  const handleIpcError = useCallback((message: string) => {
    setErrorMessage(message)
  }, [])

  const { start: automationStart, stop: automationStop } = useAutomation({
    onStatus: handleIpcStatus,
    onError: handleIpcError,
  })

  const { entries: logEntries, exportLog } = useActivityLog()
  const { entries: devLogEntries, clearEntries: clearDevLogEntries } = useDevLog()

  const handlePrereqInstallSuccess = useCallback(() => {
    setShowPrereqSuccessModal(true)
  }, [])

  const handlePrereqInstallFailure = useCallback((message: string) => {
    setPrereqFailureMessage(message)
    setShowPrereqFailureModal(true)
  }, [])

  const {
    status: prereqStatus,
    isReady: prerequisitesReady,
    install: installPrerequisites,
  } = usePrerequisites({
    onInstallSuccess: handlePrereqInstallSuccess,
    onInstallFailure: handlePrereqInstallFailure,
  })

  const { announceCountdownStart, announceStarted, announceStopped, announceShutdown } = useVoice()

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  const parsedHours = useMemo(() => parseTimerInput(timerHours), [timerHours])
  const parsedMinutes = useMemo(() => parseTimerInput(timerMinutes), [timerMinutes])
  const totalTimerSeconds = useMemo(
    () => timerToSeconds(parsedHours, parsedMinutes),
    [parsedHours, parsedMinutes],
  )
  const hasNoTimer = totalTimerSeconds === 0
  const isRunning = status === 'running'
  const isCountdown = status === 'countdown'
  const isActive = isRunning || isCountdown
  const statusBadge = useMemo(() => getStatusBadge(status), [status])
  const controlsDisabled = isActive

  const activityLogTooltip = showActivityLog
    ? HIDE_ACTIVITY_LOG_TOOLTIP
    : ACTIVITY_LOG_TOOLTIP

  const remainingDisplay = useMemo(() => {
    if (!isRunning) return null
    if (hasNoTimer) return 'No limit set'
    if (remainingSeconds === null) return '—'
    return formatDuration(remainingSeconds)
  }, [isRunning, hasNoTimer, remainingSeconds])

  // ============================================================================
  // FUNCTIONS - Event Handlers
  // ============================================================================
  const beginCountdown = useCallback(() => {
    // Capture the current config so the countdown effect can read it safely
    startPayloadRef.current = {
      mode,
      durationSeconds: totalTimerSeconds,
      closeTracker,
      shutdown: shutdownAfterStop,
    }
    setErrorMessage(null)
    setStatus('countdown')
    setCountdownSeconds(START_COUNTDOWN_SECONDS)
    setElapsedSeconds(0)
    setRemainingSeconds(hasNoTimer ? null : totalTimerSeconds)
    announceCountdownStart()
  }, [mode, totalTimerSeconds, closeTracker, shutdownAfterStop, hasNoTimer, announceCountdownStart])

  const handleStartClick = useCallback(() => {
    if (isActive) return

    if (!prerequisitesReady) {
      setErrorMessage('Requirements not met. Click the package icon in the header to install.')
      return
    }

    if (hasNoTimer) {
      setShowIndefiniteModal(true)
      return
    }

    beginCountdown()
  }, [isActive, prerequisitesReady, hasNoTimer, beginCountdown])

  const handleConfirmIndefinite = useCallback(() => {
    setShowIndefiniteModal(false)
    beginCountdown()
  }, [beginCountdown])

  const handleStopClick = useCallback(() => {
    if (!isActive) return

    // Only send IPC stop if Python was actually started
    if (isRunning) {
      automationStop({ reason: 'manual', elapsedSeconds })
    }

    announceStopped()
    setStatus('stopped')
    setCountdownSeconds(null)
    setRemainingSeconds(null)

    if (shutdownAfterStop) {
      setShutdownCountdown(30)
      setShowShutdownModal(true)
      announceShutdown()
    }
  }, [isActive, isRunning, elapsedSeconds, shutdownAfterStop, automationStop, announceStopped, announceShutdown])

  const handleCancelShutdown = useCallback(() => {
    setShowShutdownModal(false)
    setShutdownCountdown(30)
  }, [])

  const handleExportLog = useCallback(async () => {
    await exportLog()
  }, [exportLog])

  const handleToggleActivityLog = useCallback(() => {
    setShowActivityLog((prev) => !prev)
  }, [])

  const handleToggleDevLog = useCallback(() => {
    setShowDevLog((prev) => !prev)
  }, [])

  const handleClosePrereqSuccessModal = useCallback(() => {
    setShowPrereqSuccessModal(false)
  }, [])

  const handleClosePrereqFailureModal = useCallback(() => {
    setShowPrereqFailureModal(false)
    setPrereqFailureMessage(null)
  }, [])

  const handlePrereqInstallClick = useCallback(() => {
    void installPrerequisites()
  }, [installPrerequisites])

  const handleCopyDevLog = useCallback(() => {
    if (devLogEntries.length === 0) return
    navigator.clipboard.writeText(devLogEntries.join('\n')).then(() => {
      setDevLogCopied(true)
      setTimeout(() => setDevLogCopied(false), 1500)
    })
  }, [devLogEntries])

  // ============================================================================
  // EFFECTS - Countdown Timer
  // ============================================================================
  useEffect(() => {
    if (!isCountdown || countdownSeconds === null) return

    if (countdownSeconds <= 0) {
      // Spawn the Python script via Electron IPC
      if (startPayloadRef.current) {
        automationStart(startPayloadRef.current)
      }
      setStatus('running') // Optimistic — confirmed via IPC onStatus callback
      setCountdownSeconds(null)
      announceStarted()
      return
    }

    const timerId = window.setTimeout(() => {
      setCountdownSeconds((prev) => (prev !== null ? prev - 1 : null))
    }, 1000)

    return () => window.clearTimeout(timerId)
  }, [isCountdown, countdownSeconds, automationStart, announceStarted])

  // ============================================================================
  // EFFECTS - Running Timers
  // ============================================================================
  useEffect(() => {
    if (!isRunning) return

    const timerId = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
      if (!hasNoTimer) {
        setRemainingSeconds((prev) => {
          if (prev === null || prev <= 1) return 0
          return prev - 1
        })
      }
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [isRunning, hasNoTimer])

  useEffect(() => {
    if (isRunning && !hasNoTimer && remainingSeconds === 0) {
      automationStop({ reason: 'timer', elapsedSeconds })
      announceStopped()
      setStatus('stopped')
      setCountdownSeconds(null)
      if (shutdownAfterStop) {
        setShutdownCountdown(30)
        setShowShutdownModal(true)
        announceShutdown()
      }
    }
  }, [isRunning, hasNoTimer, remainingSeconds, shutdownAfterStop, elapsedSeconds, automationStop, announceStopped, announceShutdown])

  // ============================================================================
  // EFFECTS - Shutdown Countdown
  // ============================================================================
  useEffect(() => {
    if (!showShutdownModal) return

    if (shutdownCountdown <= 0) {
      setShowShutdownModal(false)
      // Dispatch OS shutdown via IPC — Main runs platform-specific shutdown
      window.electronAPI?.postStop?.executeShutdown()
      return
    }

    const timerId = window.setTimeout(() => {
      setShutdownCountdown((prev) => prev - 1)
    }, 1000)

    return () => window.clearTimeout(timerId)
  }, [showShutdownModal, shutdownCountdown])

  // ============================================================================
  // EFFECTS - Tray IPC subscriptions
  // We use refs to avoid re-subscribing every time the callbacks change.
  // The refs always point to the latest handler without the effect re-running.
  // ============================================================================
  const handleStartClickRef = useRef(handleStartClick)
  const handleStopClickRef = useRef(handleStopClick)

  useEffect(() => { handleStartClickRef.current = handleStartClick }, [handleStartClick])
  useEffect(() => { handleStopClickRef.current = handleStopClick }, [handleStopClick])

  useEffect(() => {
    if (!window.electronAPI?.tray) return

    const unsubStart = window.electronAPI.tray.onRequestStart(() => {
      handleStartClickRef.current()
    })
    const unsubStop = window.electronAPI.tray.onRequestStop(() => {
      handleStopClickRef.current()
    })

    return () => {
      unsubStart()
      unsubStop()
    }
  }, []) // stable — subscribes once, uses refs for latest handlers

  // ============================================================================
  // EFFECTS - Mode sync to tray
  // ============================================================================
  useEffect(() => {
    window.electronAPI?.tray?.notifyModeChanged(mode)
  }, [mode])

  // ============================================================================
  // RENDER - Main Component
  // ============================================================================
  return (
    <div className="h-full w-full flex justify-center bg-editorial-base overflow-hidden">
      <div
        className="w-full h-full flex flex-col relative overflow-hidden"
        style={{ maxWidth: APP_MAX_WIDTH }}
      >
        {/* Header */}
        <header className="relative z-20 flex-shrink-0 border-b border-editorial-border bg-editorial-base px-4 sm:px-5 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display  text-2xl sm:text-4xl font-light text-editorial-text-primary leading-none truncate">
              {APP_NAME}
            </h1>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>

              <PrerequisiteStatusButton
                status={prereqStatus}
                onInstall={handlePrereqInstallClick}
                disabled={isActive}
              />

              {/* Activity Log toggle */}
              <Tooltip content={activityLogTooltip} maxWidth={220} placement="bottom">
                <button
                  type="button"
                  onClick={handleToggleActivityLog}
                  aria-label={showActivityLog ? 'Hide activity log' : 'Show activity log'}
                  aria-pressed={showActivityLog}
                  className={cn(
                    'inline-flex items-center justify-center w-8 h-8 rounded-editorial border-[1.5px]',
                    'transition-colors duration-150',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-editorial-primary focus-visible:outline-offset-2',
                    showActivityLog
                      ? 'border-editorial-primary bg-editorial-primary text-white'
                      : 'border-editorial-border text-editorial-muted hover:bg-editorial-secondary hover:text-editorial-text-primary',
                  )}
                >
                  <ScrollText size={16} strokeWidth={2} />
                </button>
              </Tooltip>

              {/* Developer log toggle */}
              <Tooltip content="Developer log — internal debug events" maxWidth={220} placement="bottom">
                <button
                  type="button"
                  onClick={handleToggleDevLog}
                  aria-label={showDevLog ? 'Hide developer log' : 'Show developer log'}
                  aria-pressed={showDevLog}
                  className={cn(
                    'inline-flex items-center justify-center w-8 h-8 rounded-editorial border-[1.5px]',
                    'transition-colors duration-150',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-editorial-primary focus-visible:outline-offset-2',
                    showDevLog
                      ? 'border-[#56b6c2] bg-[#0f1117] text-[#56b6c2]'
                      : 'border-editorial-border text-editorial-muted hover:bg-editorial-secondary hover:text-editorial-text-primary',
                  )}
                >
                  <Terminal size={16} strokeWidth={2} />
                </button>
              </Tooltip>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 min-h-0 flex flex-col gap-3 sm:gap-4 overflow-y-auto">
          {/* Mode Selector */}
          <Card padding="xs">
            <div className="px-2 pt-2 pb-1">
              <SectionLabel className="!mb-2">Automation Mode</SectionLabel>
            </div>
            <RadioGroup
              name="automation-mode"
              value={mode}
              options={MODE_OPTIONS}
              onChange={setMode}
              disabled={controlsDisabled}
              layout="inline"
            />
          </Card>

          {/* Timer Configuration */}
          <Card padding="sm">
            <div className="flex items-center justify-between gap-2 border-b border-editorial-border pb-2 mb-4">
              <SectionLabel bordered={false} className="mb-0 pb-0">
                Stop Timer
              </SectionLabel>
              {hasNoTimer && (
                <Tooltip content={NO_TIMER_TOOLTIP} maxWidth={240} placement="auto">
                  <WarningHint aria-label="No timer set warning" />
                </Tooltip>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="timer-hours">Hours</Label>
                <Input
                  id="timer-hours"
                  type="number"
                  min={0}
                  max={99}
                  value={timerHours}
                  onChange={(event) => setTimerHours(event.target.value)}
                  disabled={controlsDisabled}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="timer-minutes">Minutes</Label>
                <Input
                  id="timer-minutes"
                  type="number"
                  min={0}
                  max={59}
                  value={timerMinutes}
                  onChange={(event) => setTimerMinutes(event.target.value)}
                  disabled={controlsDisabled}
                  placeholder="0"
                />
              </div>
            </div>
          </Card>

          {/* Options */}
          <Card padding="sm">
            <SectionLabel>Post-Stop Options</SectionLabel>
            <div className="flex flex-wrap gap-x-5 gap-y-3">
              <Checkbox
                label="Close Upwork"
                tooltip={CLOSE_UPWORK_TOOLTIP}
                checked={closeTracker}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setCloseTracker(event.target.checked)
                }
                disabled={controlsDisabled}
              />
              <Checkbox
                label="Shutdown"
                tooltip={SHUTDOWN_TOOLTIP}
                checked={shutdownAfterStop}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setShutdownAfterStop(event.target.checked)
                }
                disabled={controlsDisabled}
              />
            </div>
          </Card>

          {/* Controls */}
          <Card padding="sm">
            <SectionLabel>Controls</SectionLabel>
            {errorMessage && (
              <Alert variant="error" title="Error" className="!mb-2">
                {errorMessage}
              </Alert>
            )}
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                variant="primary"
                size="sm"
                fullWidth
                className="w-full"
                onClick={handleStartClick}
                disabled={isActive}
              >
                Start
              </Button>
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                className="w-full"
                onClick={handleStopClick}
                disabled={!isActive}
              >
                Stop
              </Button>
            </div>

            {isRunning && (
              <div className="mt-4 pt-4 border-t border-editorial-border grid grid-cols-2 gap-3">
                <div className="min-w-0">
                  <p className="font-body text-[10px] font-bold uppercase tracking-label text-editorial-muted mb-1">
                    Running
                  </p>
                  <p className="font-body text-sm sm:text-base text-editorial-text-primary truncate">
                    {formatDuration(elapsedSeconds)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="font-body text-[10px] font-bold uppercase tracking-label text-editorial-muted mb-1">
                    Remaining
                  </p>
                  <p className="font-body text-sm sm:text-base text-editorial-text-primary truncate">
                    {remainingDisplay}
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Activity Log — hidden by default */}
          {showActivityLog && (
            <Card className="flex flex-col min-h-[200px] max-h-[280px] overflow-hidden" padding="sm">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <SectionLabel className="mb-0 border-0 pb-0 flex-1 text-xs font-extrabold">
                  Activity Log
                </SectionLabel>
                <Tooltip content={EXPORT_LOG_TOOLTIP} maxWidth={220} placement="top">
                  <button
                    type="button"
                    onClick={handleExportLog}
                    aria-label="Export activity log"
                    className={cn(
                      'inline-flex items-center justify-center w-8 h-8 rounded-editorial',
                      'text-editorial-muted hover:text-editorial-text-primary hover:bg-editorial-secondary',
                      'transition-colors duration-150',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-editorial-primary focus-visible:outline-offset-2',
                    )}
                  >
                    <Download size={16} strokeWidth={2} />
                  </button>
                </Tooltip>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto border border-editorial-border rounded-editorial bg-editorial-base">
                {logEntries.length === 0 ? (
                  <p className="p-4 font-body text-sm text-editorial-muted text-center">
                    No activity recorded yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-editorial-border">
                    {logEntries.map((entry) => (
                      <li
                        key={entry}
                        className="px-3 py-2 font-body text-xs text-editorial-text-secondary hover:bg-editorial-secondary transition-colors duration-150"
                      >
                        {entry}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          )}
        </main>

        {/* Countdown Overlay */}
        {isCountdown && countdownSeconds !== null && (
          <div
            className="absolute bottom-4 right-5 flex flex-row items-end gap-2 pointer-events-none select-none"
            aria-live="polite"
          >
            <span className="font-body text-[10px] font-bold uppercase tracking-eyebrow text-editorial-muted opacity-70 mb-[5px]">
              Starting in
            </span>
            <span className="font-body text-[38px] font-bold leading-none text-editorial-primary opacity-80 tabular-nums inline-block w-[4.5rem] text-right">
              {countdownSeconds}s
            </span>
          </div>
        )}

        {/* Developer Log Panel — terminal-style overlay above main content */}
        {showDevLog && (
          <div className="absolute inset-x-0 bottom-0 top-[57px] z-30 flex flex-col bg-[#0d1017] border-t border-[#2a2d3a]">
            {/* Panel header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2d3a] bg-[#0a0d14] flex-shrink-0">
              <div className="flex items-center gap-2">
                <Terminal size={13} className="text-[#56b6c2]" strokeWidth={2} />
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#56b6c2]">
                  Dev Log
                </span>
                <span className="font-mono text-[10px] text-[#3d4255] ml-1 tabular-nums">
                  {devLogEntries.length} entries
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopyDevLog}
                  aria-label="Copy developer log"
                  disabled={devLogEntries.length === 0}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-colors duration-150',
                    devLogCopied
                      ? 'text-[#98c379] bg-[#1a2a1a]'
                      : 'text-[#5a6070] hover:text-[#abb2bf] hover:bg-[#1a1d2a] disabled:opacity-30 disabled:cursor-not-allowed',
                  )}
                >
                  <Copy size={11} strokeWidth={2} />
                  {devLogCopied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  type="button"
                  onClick={clearDevLogEntries}
                  aria-label="Clear developer log"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono text-[#5a6070] hover:text-[#e06c75] hover:bg-[#1a1d2a] transition-colors duration-150"
                >
                  <Trash2 size={11} strokeWidth={2} />
                  Clear
                </button>
              </div>
            </div>

            {/* Entries — oldest at top, newest at bottom */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {devLogEntries.length === 0 ? (
                <p className="font-mono text-[11px] text-[#3d4255] text-center py-8">
                  No events yet. Start automation to see debug output.
                </p>
              ) : (
                <ul>
                  {devLogEntries.map((entry, idx) => {
                    const levelMatch = entry.match(/\[(\w+)\](?:\s*\[(\w+)\])?/)
                    const level = levelMatch ? (levelMatch[2] ?? levelMatch[1]) : 'INFO'
                    const levelColor =
                      level === 'ERROR'  ? 'text-[#e06c75]' :
                      level === 'WARN'   ? 'text-[#e5c07b]' :
                      level === 'SCRIPT' ? 'text-[#56b6c2]' :
                      level === 'STDERR' ? 'text-[#d19a66]' :
                                           'text-[#61afef]'
                    const rowBg = idx % 2 === 0 ? '' : 'bg-[#0a0d14]'
                    // Split: timestamp+level prefix vs message body
                    const prefixEnd = entry.indexOf(']', entry.indexOf('[', 5)) + 1
                    const prefix = entry.substring(0, prefixEnd)
                    const body = entry.substring(prefixEnd + 1)
                    return (
                      <li
                        key={idx}
                        className={cn(
                          'flex gap-2 px-3 py-[5px] font-mono text-[11.5px] leading-snug',
                          'hover:bg-[#151822] transition-colors duration-75',
                          rowBg,
                        )}
                      >
                        <span className={cn('shrink-0 font-semibold', levelColor)}>
                          {prefix}
                        </span>
                        <span className="text-[#c8cdd8] break-all">
                          {body}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Indefinite Timer Warning Modal */}
        <Modal
          isOpen={showIndefiniteModal}
          onClose={() => setShowIndefiniteModal(false)}
          eyebrow="Confirm Start"
          title="Run Without Timer?"
          description="No stop timer set. Automation will run indefinitely until manually stopped."
          confirmLabel="Start Anyway"
          cancelLabel="Go Back"
          onConfirm={handleConfirmIndefinite}
        />

        {/* Shutdown Countdown Modal */}
        <Modal
          isOpen={showShutdownModal}
          onClose={handleCancelShutdown}
          eyebrow="System Shutdown"
          title="Shutting Down"
          description={`System shutting down in ${shutdownCountdown} seconds...`}
          confirmLabel="Cancel Shutdown"
          cancelLabel="Dismiss"
          onConfirm={handleCancelShutdown}
          showActions
        />

        {/* Prerequisites Success Modal */}
        <Modal
          isOpen={showPrereqSuccessModal}
          onClose={handleClosePrereqSuccessModal}
          eyebrow="Setup"
          title="Requirements Installed"
          description="Python packages are ready. You can start automation now."
          confirmLabel="Done"
          cancelLabel="Close"
          onConfirm={handleClosePrereqSuccessModal}
        />

        {/* Prerequisites Failure Modal */}
        <Modal
          isOpen={showPrereqFailureModal}
          onClose={handleClosePrereqFailureModal}
          eyebrow="Setup"
          title="Installation Failed"
          description={prereqFailureMessage ?? 'Could not install Python requirements.'}
          confirmLabel="Close"
          cancelLabel="Dismiss"
          onConfirm={handleClosePrereqFailureModal}
        />
      </div>
    </div>
  )
}

export default App
