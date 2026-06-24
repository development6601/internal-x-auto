// ============================================================================
// IMPORTS
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Eyebrow,
  Input,
  Label,
  Modal,
  RadioGroup,
  SectionLabel,
} from '@/components/ui'
import type { AutomationMode, AutomationStatus } from '@/types/automation.types'
import { formatDuration, parseTimerInput, timerToSeconds } from '@/utils/format'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ModeOption {
  value: AutomationMode
  label: string
  description: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const APP_NAME = 'InternalX'

const MODE_OPTIONS: ModeOption[] = [
  {
    value: 'basic',
    label: 'Basic Mode',
    description: 'Browser tab and editor switching only — no application switching.',
  },
  {
    value: 'advanced',
    label: 'Advanced Mode',
    description: 'Full activity simulation including Alt+Tab between applications.',
  },
]

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
    <div className="min-h-full flex flex-col relative">
      {/* Header */}
      <header className="border-b border-editorial-border bg-editorial-base px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Eyebrow className="mb-3">Internal Automation</Eyebrow>
            <h1 className="font-display text-4xl font-light text-editorial-text-primary leading-none">
              {APP_NAME}
            </h1>
          </div>
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-0">
        {/* Left Column — Configuration */}
        <div className="flex flex-col gap-6 overflow-y-auto">
          {/* Mode Selector */}
          <Card>
            <SectionLabel>Automation Mode</SectionLabel>
            <RadioGroup
              name="automation-mode"
              value={mode}
              options={MODE_OPTIONS}
              onChange={setMode}
              disabled={controlsDisabled}
            />
          </Card>

          {/* Timer Configuration */}
          <Card>
            <SectionLabel>Stop Timer</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
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
            {hasNoTimer && (
              <Alert variant="warning" title="No Timer Set" className="mt-4">
                No stop timer set. Automation will run indefinitely until manually stopped.
              </Alert>
            )}
          </Card>

          {/* Options */}
          <Card>
            <SectionLabel>Post-Stop Options</SectionLabel>
            <div className="flex flex-col gap-4">
              <Checkbox
                label="Close Upwork Tracker when automation stops"
                checked={closeTracker}
                onChange={(event) => setCloseTracker(event.target.checked)}
                disabled={controlsDisabled}
              />
              <Checkbox
                label="Shut down system after automation ends"
                checked={shutdownAfterStop}
                onChange={(event) => setShutdownAfterStop(event.target.checked)}
                disabled={controlsDisabled}
              />
            </div>
          </Card>

          {/* Controls */}
          <Card>
            <SectionLabel>Controls</SectionLabel>
            {errorMessage && (
              <Alert variant="error" title="Error" className="mb-4">
                {errorMessage}
              </Alert>
            )}
            <div className="flex gap-3">
              <Button
                variant="primary"
                className="flex-[2]"
                onClick={handleStartClick}
                disabled={isActive}
              >
                Start Automation
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={handleStopClick}
                disabled={!isActive}
              >
                Stop Automation
              </Button>
            </div>

            {isRunning && (
              <div className="mt-5 pt-5 border-t border-editorial-border grid grid-cols-2 gap-4">
                <div>
                  <p className="font-body text-[10px] font-bold uppercase tracking-label text-editorial-muted mb-1">
                    Running
                  </p>
                  <p className="font-body text-lg text-editorial-text-primary">
                    {formatDuration(elapsedSeconds)}
                  </p>
                </div>
                <div>
                  <p className="font-body text-[10px] font-bold uppercase tracking-label text-editorial-muted mb-1">
                    Time Remaining
                  </p>
                  <p className="font-body text-lg text-editorial-text-primary">
                    {remainingDisplay}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column — Activity Log */}
        <Card className="flex flex-col min-h-[320px] xl:min-h-0 xl:h-full overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <SectionLabel className="mb-0 border-0 pb-0 flex-1">Activity Log</SectionLabel>
            <Button variant="ghost" size="sm" onClick={handleExportLog}>
              Export Log
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto border border-editorial-border rounded-editorial bg-editorial-base">
            {logEntries.length === 0 ? (
              <p className="p-4 font-body text-sm text-editorial-muted text-center">
                No activity recorded yet.
              </p>
            ) : (
              <ul className="divide-y divide-editorial-border">
                {logEntries.map((entry) => (
                  <li
                    key={entry}
                    className="px-4 py-3 font-body text-sm text-editorial-text-secondary hover:bg-editorial-secondary transition-colors duration-150"
                  >
                    {entry}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </main>

      {/* Countdown Overlay — bottom-right, unobtrusive */}
      {isCountdown && countdownSeconds !== null && (
        <div
          className="fixed bottom-3 right-4 font-body text-[10px] text-editorial-muted opacity-50 pointer-events-none select-none"
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
  )
}

export default App
