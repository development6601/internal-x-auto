// ============================================================================
// IMPORTS
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, ScrollText } from 'lucide-react'
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
  HIDE_ACTIVITY_LOG_TOOLTIP,
} from '@/constants/app.constants'
import type { AutomationMode, AutomationStatus } from '@/types/automation.types'
import { cn } from '@/utils/cn'
import { formatDuration, parseTimerInput, timerToSeconds } from '@/utils/format'

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

const APP_NAME = 'InternalX'

const NO_TIMER_TOOLTIP = (
  <>
    No stop timer set.
    <br />
    Automation will run indefinitely until manually stopped.
  </>
)

const MODE_OPTIONS: ModeOption[] = [
  {
    value: 'basic',
    label: 'Basic',
    tooltip: (
      <>
        Browser tab and editor switching only.
        <br />
        No application switching (Alt+Tab).
      </>
    ),
  },
  {
    value: 'advanced',
    label: 'Advanced',
    tooltip: (
      <>
        Full activity simulation across applications.
        <br />
        Includes Alt+Tab between browser and editor.
      </>
    ),
  },
]

const CLOSE_UPWORK_TOOLTIP = (
  <>
    Closes the Upwork Desktop App when automation stops.
    <br />
    Terminates Upwork.exe if the process is still running.
  </>
)

const SHUTDOWN_TOOLTIP = (
  <>
    Shuts down the system after automation ends.
    <br />
    Shows a 30-second countdown before shutdown — cancel anytime.
  </>
)

const EXPORT_LOG_TOOLTIP = (
  <>
    Export activity log to a file.
    <br />
    Saves the raw log content as-is.
  </>
)

const MOCK_LOG_ENTRIES = [
  '[2026-06-24 09:14:22] STOPPED (manual) — Ran for: 01:12:43',
  '[2026-06-24 08:01:39] STARTED — Mode: Advanced, Timer: 4h 30m, Close Tracker: Yes, Shutdown: No',
  '[2026-06-23 17:45:01] STOPPED (timer elapsed) — Ran for: 04:30:00',
  '[2026-06-23 13:14:58] STARTED — Mode: Basic, Timer: 4h 30m, Close Tracker: No, Shutdown: No',
  '[2026-06-23 11:02:15] Upwork tracker closed successfully',
]

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
  const [logEntries] = useState<string[]>(MOCK_LOG_ENTRIES)

  // ============================================================================
  // STATE - UI Control
  // ============================================================================
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [showIndefiniteModal, setShowIndefiniteModal] = useState(false)
  const [showShutdownModal, setShowShutdownModal] = useState(false)
  const [shutdownCountdown, setShutdownCountdown] = useState(30)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showActivityLog, setShowActivityLog] = useState(false)

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
    setErrorMessage(null)
    setStatus('countdown')
    setCountdownSeconds(START_COUNTDOWN_SECONDS)
    setElapsedSeconds(0)
    setRemainingSeconds(hasNoTimer ? null : totalTimerSeconds)
  }, [hasNoTimer, totalTimerSeconds])

  const handleStartClick = useCallback(() => {
    if (isActive) return

    if (hasNoTimer) {
      setShowIndefiniteModal(true)
      return
    }

    beginCountdown()
  }, [isActive, hasNoTimer, beginCountdown])

  const handleConfirmIndefinite = useCallback(() => {
    setShowIndefiniteModal(false)
    beginCountdown()
  }, [beginCountdown])

  const handleStopClick = useCallback(() => {
    if (!isActive) return

    setStatus('stopped')
    setCountdownSeconds(null)
    setRemainingSeconds(null)

    if (shutdownAfterStop) {
      setShutdownCountdown(30)
      setShowShutdownModal(true)
    }
  }, [isActive, shutdownAfterStop])

  const handleCancelShutdown = useCallback(() => {
    setShowShutdownModal(false)
    setShutdownCountdown(30)
  }, [])

  const handleExportLog = useCallback(() => {
    // IPC integration will be added in a later phase
  }, [])

  const handleToggleActivityLog = useCallback(() => {
    setShowActivityLog((prev) => !prev)
  }, [])

  // ============================================================================
  // EFFECTS - Countdown Timer
  // ============================================================================
  useEffect(() => {
    if (!isCountdown || countdownSeconds === null) return

    if (countdownSeconds <= 0) {
      setStatus('running')
      setCountdownSeconds(null)
      return
    }

    const timerId = window.setTimeout(() => {
      setCountdownSeconds((prev) => (prev !== null ? prev - 1 : null))
    }, 1000)

    return () => window.clearTimeout(timerId)
  }, [isCountdown, countdownSeconds])

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
      setStatus('stopped')
      setCountdownSeconds(null)
      if (shutdownAfterStop) {
        setShutdownCountdown(30)
        setShowShutdownModal(true)
      }
    }
  }, [isRunning, hasNoTimer, remainingSeconds, shutdownAfterStop])

  // ============================================================================
  // EFFECTS - Shutdown Countdown
  // ============================================================================
  useEffect(() => {
    if (!showShutdownModal) return

    if (shutdownCountdown <= 0) {
      setShowShutdownModal(false)
      return
    }

    const timerId = window.setTimeout(() => {
      setShutdownCountdown((prev) => prev - 1)
    }, 1000)

    return () => window.clearTimeout(timerId)
  }, [showShutdownModal, shutdownCountdown])

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
            <h1 className="font-display text-[23px] sm:text-[29px] font-extralight text-editorial-text-primary leading-none truncate">
              {APP_NAME}
            </h1>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
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
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 min-h-0 flex flex-col gap-3 sm:gap-4 overflow-y-auto">
          {/* Mode Selector */}
          <Card padding="xs">
            <div className="px-2 pt-2 pb-1">
              <SectionLabel className="mb-2">Automation Mode</SectionLabel>
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
              <Alert variant="error" title="Error" className="mb-3">
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
                <SectionLabel className="mb-0 border-0 pb-0 flex-1">Activity Log</SectionLabel>
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

        {/* Countdown Overlay — bottom-right, unobtrusive */}
        {isCountdown && countdownSeconds !== null && (
          <div
            className="absolute bottom-3 right-4 font-body text-[10px] text-editorial-muted opacity-50 pointer-events-none select-none"
            aria-live="polite"
          >
            Starting in {countdownSeconds}s
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
      </div>
    </div>
  )
}

export default App
