// ============================================================================
// IMPORTS
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Bot, Download, Moon, Power, ShieldCheck, ScrollText, SlidersHorizontal, Sun, Timer, Zap } from 'lucide-react'
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
  Switch,
  Tooltip,
  WarningHint,
} from '@/components/ui'
import { APP_MAX_WIDTH, APP_NAME, APP_VERSION } from '@/constants/app.constants'
import type { AutomationMode, AutomationStatus } from '@/types/automation.types'
import { cn } from '@/utils/cn'
import { formatDuration, parseTimerInput, timerToSeconds } from '@/utils/format'
import useAutomation from '@/hooks/useAutomation'
import useActivityLog from '@/hooks/useActivityLog'
import usePrerequisites from '@/hooks/usePrerequisites'
import useTheme from '@/hooks/useTheme'
import useSound from '@/hooks/useSound'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ModeOption {
  value: AutomationMode
  label: string
  tooltip: React.ReactNode
}

interface PostStopSnapshot {
  screenLock: boolean
  shutdown: boolean
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
        Switching multiple files or tabs within the last opened app.
      </>
    ),
  },
  {
    value: 'advanced',
    label: 'Advanced',
    tooltip: (
      <>
        Switching multiple files or tabs across multiple applications.
      </>
    ),
  },
]

const SCREEN_LOCK_TOOLTIP = (
  <>
    Locks the screen when automation stops. Must be enabled before Shutdown can be selected.
  </>
)

const SHUTDOWN_TOOLTIP = (
  <>
    Shuts down the system after automation ends. Requires Screen Lock to be enabled first. Locks the screen first, then shows a 30-second shutdown countdown. You can cancel anytime.
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

const DOT_DECORATION = (
  <div className="flex-shrink-0 grid grid-cols-4 gap-[3.5px] opacity-[0.18]" aria-hidden>
    {Array.from({ length: 12 }).map((_, i) => (
      <span key={i} className="w-[3px] h-[3px] rounded-full bg-editorial-muted block" />
    ))}
  </div>
)

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
// SUB-COMPONENTS
// ============================================================================

const SectionIcon = ({ children }: { children: ReactNode }) => (
  <div className="w-7 h-7 rounded-editorial flex items-center justify-center bg-editorial-secondary text-editorial-primary flex-shrink-0">
    {children}
  </div>
)

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const App = () => {
  // ============================================================================
  // STATE - Core Data
  // ============================================================================
  const [status, setStatus] = useState<AutomationStatus>('stopped')
  const [mode, setMode] = useState<AutomationMode>('basic')
  const [timerHours, setTimerHours] = useState('')
  const [timerMinutes, setTimerMinutes] = useState('')
  const [screenLock, setScreenLock] = useState(false)
  const [shutdownAfterStop, setShutdownAfterStop] = useState(false)

  /** Post-stop choices locked when a run starts — shown read-only while active. */
  const [lockedPostStopOptions, setLockedPostStopOptions] = useState<{
    screenLock: boolean
    shutdown: boolean
  } | null>(null)

  // ============================================================================
  // STATE - UI Control
  // ============================================================================

  /** Captures start payload at countdown-begin time so the effect can use it safely. */
  const startPayloadRef = useRef<{
    mode: AutomationMode
    durationSeconds: number
    screenLock: boolean
    shutdown: boolean
  } | null>(null)

  /**
   * Wall-clock timestamp (ms) when the automation transitioned to 'running'.
   * Used to compute elapsed/remaining from real time instead of counting
   * setInterval ticks, which Chromium throttles when the window is hidden.
   */
  const runStartTimeRef = useRef<number | null>(null)
  /** Total duration (seconds) captured when automation starts. */
  const runTotalSecondsRef = useRef<number>(0)

  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [showIndefiniteModal, setShowIndefiniteModal] = useState(false)
  const [showShutdownModal, setShowShutdownModal] = useState(false)
  const [shutdownCountdown, setShutdownCountdown] = useState(30)
  const [showScreenLockModal, setShowScreenLockModal] = useState(false)
  const [screenLockCountdown, setScreenLockCountdown] = useState(10)
  /** When true, screen lock countdown is followed by the shutdown countdown. */
  const [pendingShutdownAfterLock, setPendingShutdownAfterLock] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'main' | 'log'>('main')
  const [showPrereqSuccessModal, setShowPrereqSuccessModal] = useState(false)
  const [showPrereqFailureModal, setShowPrereqFailureModal] = useState(false)
  const [prereqFailureMessage, setPrereqFailureMessage] = useState<string | null>(null)
  const [isStopTimerOpen, setIsStopTimerOpen] = useState(false)
  const [isAfterTimerEndsOpen, setIsAfterTimerEndsOpen] = useState(false)

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
  const { isDark, cycleTheme, themeMode } = useTheme()

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

  const { playStartEnd, playSecondBeep } = useSound()

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
  const timerDisabled = hasNoTimer && !isActive

  const remainingDisplay = useMemo(() => {
    if (!isRunning) return null
    if (hasNoTimer) return 'No limit set'
    if (remainingSeconds === null) return '—'
    return formatDuration(remainingSeconds)
  }, [isRunning, hasNoTimer, remainingSeconds])

  const displayScreenLock = lockedPostStopOptions?.screenLock ?? screenLock
  const displayShutdownAfterStop = lockedPostStopOptions?.shutdown ?? shutdownAfterStop

  const footerStatus = useMemo(() => {
    if (status === 'running') return { label: 'Running', color: 'bg-editorial-success' }
    if (status === 'countdown') return { label: 'Starting', color: 'bg-editorial-warning' }
    if (status === 'error') return { label: 'Error', color: 'bg-editorial-error' }
    return { label: 'Ready', color: 'bg-editorial-success' }
  }, [status])

  const screenLockModalDescription = useMemo(() => {
    if (pendingShutdownAfterLock) {
      return `Screen will lock in ${screenLockCountdown} seconds, then a 30-second shutdown countdown will begin...`
    }
    return `Screen will lock in ${screenLockCountdown} seconds...`
  }, [pendingShutdownAfterLock, screenLockCountdown])

  // ============================================================================
  // FUNCTIONS - Event Handlers
  // ============================================================================
  const beginPostStopSequence = useCallback((options: PostStopSnapshot) => {
    if (options.shutdown) {
      // Lock first, then shutdown — screen lock countdown always runs before shutdown.
      setPendingShutdownAfterLock(true)
      setScreenLockCountdown(10)
      setShowScreenLockModal(true)
      return
    }

    if (options.screenLock) {
      setPendingShutdownAfterLock(false)
      setScreenLockCountdown(10)
      setShowScreenLockModal(true)
    }
  }, [])

  const resolvePostStopOptions = useCallback((): PostStopSnapshot => {
    return lockedPostStopOptions ?? { screenLock, shutdown: shutdownAfterStop }
  }, [lockedPostStopOptions, screenLock, shutdownAfterStop])
  const beginCountdown = useCallback((overrideDurationSeconds?: number) => {
    const durationSecs = overrideDurationSeconds ?? totalTimerSeconds

    const postStopSnapshot = {
      screenLock,
      shutdown: shutdownAfterStop,
    }

    // Capture the current config so the countdown effect can read it safely
    startPayloadRef.current = {
      mode,
      durationSeconds: durationSecs,
      screenLock: postStopSnapshot.screenLock,
      shutdown: postStopSnapshot.shutdown,
    }
    setLockedPostStopOptions(postStopSnapshot)
    setErrorMessage(null)
    setStatus('countdown')
    setCountdownSeconds(START_COUNTDOWN_SECONDS)
    setElapsedSeconds(0)
    setRemainingSeconds(durationSecs === 0 ? null : durationSecs)
  }, [mode, totalTimerSeconds, screenLock, shutdownAfterStop])

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

  const handleStartPreset = useCallback((hours: number) => {
    if (isActive) return
    if (!prerequisitesReady) {
      setErrorMessage('Requirements not met. Click the package icon in the header to install.')
      return
    }
    // Update the timer display so the UI reflects what was started
    setTimerHours(String(hours))
    setTimerMinutes('0')
    // Pass the duration directly — bypasses UI state which may not have updated yet
    beginCountdown(hours * 3600)
  }, [isActive, prerequisitesReady, beginCountdown])

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

    playStartEnd()
    setStatus('stopped')
    setCountdownSeconds(null)
    setRemainingSeconds(null)

    const postStopOptions = resolvePostStopOptions()
    setLockedPostStopOptions(null)
    beginPostStopSequence(postStopOptions)
  }, [isActive, isRunning, elapsedSeconds, resolvePostStopOptions, beginPostStopSequence, automationStop, playStartEnd])

  const handleCancelShutdown = useCallback(() => {
    setShowShutdownModal(false)
    setShutdownCountdown(30)
  }, [])

  const handleCancelScreenLock = useCallback(() => {
    setShowScreenLockModal(false)
    setScreenLockCountdown(10)
    setPendingShutdownAfterLock(false)
  }, [])

  const handleExportLog = useCallback(async () => {
    await exportLog()
  }, [exportLog])

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

  const handleStopTimerAccordionToggle = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setIsStopTimerOpen(event.target.checked)
  }, [])

  const handleAfterTimerEndsAccordionToggle = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setIsAfterTimerEndsOpen(event.target.checked)
  }, [])

  // ============================================================================
  // EFFECTS - Countdown Timer
  // ============================================================================
  useEffect(() => {
    if (!isCountdown || countdownSeconds === null || countdownSeconds <= 0) return
    playSecondBeep()
  }, [isCountdown, countdownSeconds, playSecondBeep])

  useEffect(() => {
    if (!isCountdown || countdownSeconds === null) return

    if (countdownSeconds <= 0) {
      // Spawn the Python script via Electron IPC
      if (startPayloadRef.current) {
        const { mode: payloadMode, durationSeconds, shutdown } = startPayloadRef.current
        automationStart({ mode: payloadMode, durationSeconds, shutdown })
      }
      setStatus('running') // Optimistic — confirmed via IPC onStatus callback
      setCountdownSeconds(null)
      playStartEnd()
      return
    }

    const timerId = window.setTimeout(() => {
      setCountdownSeconds((prev) => (prev !== null ? prev - 1 : null))
    }, 1000)

    return () => window.clearTimeout(timerId)
  }, [isCountdown, countdownSeconds, automationStart, playStartEnd])

  // ============================================================================
  // EFFECTS - Running Timers
  // ============================================================================
  useEffect(() => {
    if (!isRunning) {
      runStartTimeRef.current = null
      return
    }

    // Anchor elapsed to wall-clock time so the timer stays accurate even
    // when the window is hidden to tray and Chromium throttles setInterval.
    runStartTimeRef.current = Date.now()
    runTotalSecondsRef.current = totalTimerSeconds

    const update = () => {
      if (!runStartTimeRef.current) return
      const elapsed = Math.floor((Date.now() - runStartTimeRef.current) / 1000)
      setElapsedSeconds(elapsed)
      if (!hasNoTimer) {
        setRemainingSeconds(Math.max(0, runTotalSecondsRef.current - elapsed))
      }
    }

    // Poll at 500 ms — still resolves to whole-second values but catches
    // the exact expiry moment within half a second even if throttled to 1 Hz.
    const timerId = window.setInterval(update, 500)
    return () => window.clearInterval(timerId)
  }, [isRunning, hasNoTimer, totalTimerSeconds])

  useEffect(() => {
    if (isRunning && !hasNoTimer && remainingSeconds === 0) {
      automationStop({ reason: 'timer', elapsedSeconds })
      playStartEnd()
      setStatus('stopped')
      setCountdownSeconds(null)
      const postStopOptions = resolvePostStopOptions()
      setLockedPostStopOptions(null)
      beginPostStopSequence(postStopOptions)
    }
  }, [isRunning, hasNoTimer, remainingSeconds, resolvePostStopOptions, beginPostStopSequence, elapsedSeconds, automationStop, playStartEnd])

  // ============================================================================
  // EFFECTS - Shutdown Countdown
  // ============================================================================
  useEffect(() => {
    if (!showShutdownModal) return

    if (shutdownCountdown <= 0) {
      setShowShutdownModal(false)
      window.electronAPI?.postStop?.executeShutdown()
      return
    }

    const timerId = window.setTimeout(() => {
      setShutdownCountdown((prev) => prev - 1)
    }, 1000)

    return () => window.clearTimeout(timerId)
  }, [showShutdownModal, shutdownCountdown])

  // ============================================================================
  // EFFECTS - Screen Lock Countdown
  // ============================================================================
  useEffect(() => {
    if (!showScreenLockModal) return

    if (screenLockCountdown <= 0) {
      setShowScreenLockModal(false)
      window.electronAPI?.postStop?.lockScreen()

      if (pendingShutdownAfterLock) {
        setPendingShutdownAfterLock(false)
        setShutdownCountdown(30)
        setShowShutdownModal(true)
      }
      return
    }

    const timerId = window.setTimeout(() => {
      setScreenLockCountdown((prev) => prev - 1)
    }, 1000)

    return () => window.clearTimeout(timerId)
  }, [showScreenLockModal, screenLockCountdown, pendingShutdownAfterLock])

  // ============================================================================
  // EFFECTS - Tray IPC subscriptions
  // We use refs to avoid re-subscribing every time the callbacks change.
  // The refs always point to the latest handler without the effect re-running.
  // ============================================================================
  const handleStartClickRef = useRef(handleStartClick)
  const handleStopClickRef = useRef(handleStopClick)
  const handleStartPresetRef = useRef(handleStartPreset)

  useEffect(() => { handleStartClickRef.current = handleStartClick }, [handleStartClick])
  useEffect(() => { handleStopClickRef.current = handleStopClick }, [handleStopClick])
  useEffect(() => { handleStartPresetRef.current = handleStartPreset }, [handleStartPreset])

  useEffect(() => {
    if (!window.electronAPI?.tray) return

    const unsubStart = window.electronAPI.tray.onRequestStart(() => {
      handleStartClickRef.current()
    })
    const unsubStop = window.electronAPI.tray.onRequestStop(() => {
      handleStopClickRef.current()
    })
    const unsubPreset = window.electronAPI.tray.onRequestStartPreset(({ hours }) => {
      handleStartPresetRef.current(hours)
    })
    // Tray checkbox clicked: sync back into React state
    const unsubScreenLock = window.electronAPI.tray.onSetScreenLock(({ value }) => {
      setScreenLock(value)
      if (!value) setShutdownAfterStop(false)
    })
    const unsubShutdown = window.electronAPI.tray.onSetShutdown(({ value }) => {
      // Shutdown depends on Screen Lock — the tray only allows toggling it when
      // Screen Lock is already enabled, so we just mirror the value here.
      setShutdownAfterStop(value)
    })

    return () => {
      unsubStart()
      unsubStop()
      unsubPreset()
      unsubScreenLock()
      unsubShutdown()
    }
  }, []) // stable — subscribes once, uses refs for latest handlers

  // ============================================================================
  // EFFECTS - Mode sync to tray
  // ============================================================================
  useEffect(() => {
    window.electronAPI?.tray?.notifyModeChanged(mode)
  }, [mode])

  // ============================================================================
  // EFFECTS - Post-stop options sync to tray
  // ============================================================================
  useEffect(() => {
    window.electronAPI?.tray?.notifyPostStopOptionsChanged(screenLock, shutdownAfterStop)
  }, [screenLock, shutdownAfterStop])

  // ============================================================================
  // EFFECTS - After Timer Ends accordion
  // ============================================================================
  useEffect(() => {
    if (timerDisabled) {
      setIsAfterTimerEndsOpen(false)
    }
  }, [timerDisabled])

  // ============================================================================
  // EFFECTS - Remaining timer sync to tray tooltip
  // ============================================================================
  useEffect(() => {
    if (!isRunning) return
    window.electronAPI?.tray?.notifyTimerUpdated(remainingSeconds, hasNoTimer)
  }, [isRunning, remainingSeconds, hasNoTimer])

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
            {/* <h1 className="font-display  text-2xl sm:text-4xl font-light text-editorial-text-primary leading-none truncate">
              {APP_NAME}
            </h1> */}

            {/* Tab Bar */}
            <div className="flex-shrink-0 flex items-center bg-editorial-base">
              <div
                className="flex items-center gap-0.5 p-1 rounded-full"
                style={{ background: 'var(--color-bg-secondary)' }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('main')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 rounded-full font-body text-[11px] font-bold tracking-widest transition-all duration-200 select-none',
                    activeTab === 'main'
                      ? 'bg-editorial-surface text-editorial-text-primary'
                      : 'text-editorial-muted hover:text-editorial-text-secondary',
                  )}
                  style={activeTab === 'main' ? { boxShadow: '0 1px 4px rgba(44,24,16,0.10)' } : undefined}
                >
                  <SlidersHorizontal size={12} strokeWidth={2.5} />
                  Main
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('log')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 rounded-full font-body text-[11px] font-bold tracking-widest transition-all duration-200 select-none',
                    activeTab === 'log'
                      ? 'bg-editorial-surface text-editorial-text-primary'
                      : 'text-editorial-muted hover:text-editorial-text-secondary',
                  )}
                  style={activeTab === 'log' ? { boxShadow: '0 1px 4px rgba(44,24,16,0.10)' } : undefined}
                >
                  <ScrollText size={12} strokeWidth={2.5} />
                  Log
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>

              <PrerequisiteStatusButton
                status={prereqStatus}
                onInstall={handlePrereqInstallClick}
                disabled={isActive}
              />

              {/* Theme toggle — switches between light and dark */}
              <Tooltip
                content={
                  themeMode === 'light'
                    ? 'Appearance: Light mode — click to switch to Dark'
                    : 'Appearance: Dark mode — click to switch to Light'
                }
                maxWidth={220}
                placement="bottom"
              >
                <button
                  type="button"
                  onClick={cycleTheme}
                  aria-label={`Appearance: ${themeMode} mode`}
                  className={cn(
                    'inline-flex items-center justify-center w-8 h-8 rounded-editorial border-[1.5px]',
                    'transition-colors duration-150',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-editorial-primary focus-visible:outline-offset-2',
                    'border-editorial-border text-editorial-muted hover:bg-editorial-secondary hover:text-editorial-text-primary',
                  )}
                >
                  {isDark ? <Moon size={15} strokeWidth={2} /> : <Sun size={15} strokeWidth={2} />}
                </button>
              </Tooltip>
            </div>
          </div>
        </header>



        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 min-h-0 flex flex-col gap-3 sm:gap-4 overflow-y-auto">
          {activeTab === 'main' && (
            <>
              {/* Mode Selector */}
              <Card padding="sm">
                <div className="border-b border-editorial-border pb-1 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <SectionIcon><Bot size={13} strokeWidth={1.75} /></SectionIcon>
                      <SectionLabel bordered={false} className="mb-0 pb-0">Automation Mode</SectionLabel>
                    </div>
                    {DOT_DECORATION}
                  </div>
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
                <div
                  className={cn(
                    'flex items-center justify-between gap-2',
                    isStopTimerOpen && 'border-b border-editorial-border pb-2 mb-4',
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <SectionIcon><Timer size={13} strokeWidth={1.75} /></SectionIcon>
                    <SectionLabel bordered={false} className="mb-0 pb-0">Set Timer</SectionLabel>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasNoTimer && (
                      <Tooltip content={NO_TIMER_TOOLTIP} maxWidth={240} placement="auto">
                        <WarningHint aria-label="No timer set warning" />
                      </Tooltip>
                    )}
                    <Switch
                      aria-label="Toggle Set Timer section"
                      checked={isStopTimerOpen}
                      onChange={handleStopTimerAccordionToggle}
                    />
                  </div>
                </div>
                {isStopTimerOpen && (
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
                        placeholder="Hours"
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
                        placeholder="Minutes"
                      />
                    </div>
                  </div>
                )}
              </Card>

              {/* Options */}
              <Card padding="sm">
                <div
                  className={cn(
                    'flex items-center justify-between gap-2',
                    isAfterTimerEndsOpen && 'border-b border-editorial-border pb-2 mb-4',
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <SectionIcon><Power size={13} strokeWidth={1.75} /></SectionIcon>
                    <SectionLabel bordered={false} className="mb-0 pb-0">After Timer Ends</SectionLabel>
                  </div>
                  <Switch
                    aria-label="Toggle After Timer Ends section"
                    checked={isAfterTimerEndsOpen}
                    onChange={handleAfterTimerEndsAccordionToggle}
                    disabled={timerDisabled}
                  />
                </div>
                {isAfterTimerEndsOpen && (
                  <div className={cn('flex flex-wrap gap-x-5 gap-y-3 py-1', timerDisabled && 'pointer-events-none')}>
                    <Checkbox
                      label="Screen Lock"
                      tooltip={SCREEN_LOCK_TOOLTIP}
                      checked={displayScreenLock}
                      disabled={timerDisabled}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const checked = event.target.checked
                        setScreenLock(checked)
                        // Uncheck Shutdown when Screen Lock is disabled — shutdown requires it
                        if (!checked) setShutdownAfterStop(false)
                      }}
                      readOnly={isActive}
                    />
                    <Checkbox
                      label="Shutdown"
                      tooltip={SHUTDOWN_TOOLTIP}
                      checked={displayShutdownAfterStop}
                      disabled={timerDisabled || !displayScreenLock}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        // Shutdown is only selectable once Screen Lock is enabled
                        setShutdownAfterStop(event.target.checked)
                      }}
                      readOnly={isActive}
                    />
                  </div>
                )}
              </Card>

              {/* Controls */}
              <Card padding="sm">
                <div className="flex items-center justify-between gap-2 border-b border-editorial-border pb-2 mb-5">
                  <div className="flex items-center gap-2.5">
                    <SectionIcon><Zap size={13} strokeWidth={1.75} /></SectionIcon>
                    <SectionLabel bordered={false} className="mb-0 pb-0">Controls</SectionLabel>
                  </div>
                  {DOT_DECORATION}
                </div>
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
                    variant="danger"
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
            </>
          )}

          {activeTab === 'log' && (
            <Card className="flex flex-col flex-1 min-h-0 overflow-hidden" padding="sm">
              <div className="flex items-center justify-between mb-4 flex-shrink-0 border-b border-editorial-border pb-2">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <SectionIcon><ScrollText size={13} strokeWidth={1.75} /></SectionIcon>
                  <SectionLabel bordered={false} className="mb-0 pb-0">Activity Log</SectionLabel>
                </div>
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

              <div className="flex-1 min-h-0 overflow-y-auto rounded-editorial bg-editorial-base pr-1">
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

        {/* Footer */}
        <footer className="flex-shrink-0 flex items-center justify-between px-4 sm:px-5 py-2 border-t border-editorial-border bg-editorial-base">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={11} className="text-editorial-muted" strokeWidth={2} />
            <span className="font-body text-[12px] text-editorial-muted">
              {APP_NAME}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-body text-[10px] text-editorial-disabled">{APP_VERSION}</span>
            <div className="flex items-center gap-1.5">
              <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', footerStatus.color)} />
              <span className="font-body text-[10px] text-editorial-muted">{footerStatus.label}</span>
            </div>
          </div>
        </footer>

        {/* Countdown Overlay */}
        {isCountdown && countdownSeconds !== null && (
          <div
            className="absolute bottom-10 right-5 flex flex-row items-end gap-2 pointer-events-none select-none"
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

        {/* Screen Lock Countdown Modal */}
        <Modal
          isOpen={showScreenLockModal}
          onClose={handleCancelScreenLock}
          eyebrow="Screen Lock"
          title="Locking Screen"
          description={screenLockModalDescription}
          confirmLabel="Cancel"
          cancelLabel="Dismiss"
          onConfirm={handleCancelScreenLock}
          showActions
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
