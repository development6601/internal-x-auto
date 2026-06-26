# InternalX — Test Cases

> Mark each case `[x]` when verified. Leave `[ ]` until tested.

---

## 1. App Launch & Window

- [ ] App opens at max-width 650 px and is centred on screen
- [ ] Window title shows "InternalX"
- [ ] App cannot be resized wider than 650 px
- [ ] App starts with status badge showing **Stopped**
- [ ] Activity Log panel is hidden by default
- [ ] Developer Log panel is hidden by default
- [ ] App starts hidden in system tray when launched with `--hidden` flag

---

## 2. Automation Mode Selection

- [ ] Selecting **Basic** mode highlights the Basic card
- [ ] Selecting **Advanced** mode highlights the Advanced card
- [ ] Mode selector is disabled while automation is running
- [ ] Mode selector is disabled during the 10-second countdown
- [ ] Info tooltip appears on hover of each mode radio button

---

## 3. Set Timer

- [ ] Hours and minutes inputs accept numeric values only
- [ ] Hours field accepts 0–99; minutes field accepts 0–59
- [ ] Both inputs are disabled while automation is active
- [ ] Setting both to 0 shows the **warning icon** next to "Set Timer"
- [ ] Warning tooltip text clearly explains "no timer set" behaviour
- [ ] Setting a valid duration hides the warning icon
- [ ] Timer inputs are cleared/disabled during countdown

---

## 4. Post-Stop Options

- [ ] **Close Upwork** checkbox is unchecked by default
- [ ] **Shutdown** checkbox is unchecked by default
- [ ] Both checkboxes are disabled while automation is running
- [ ] Tooltip appears on hover of each checkbox info icon
- [ ] Selecting Close Upwork and stopping automation closes `Upwork.exe` (requires Upwork installed)
- [ ] If Upwork is not running, a "not found" message appears in the Activity Log (no crash)
- [ ] Selecting Shutdown shows the 30-second modal countdown after stop
- [ ] Shutdown modal cancels cleanly without shutting down the PC

---

## 5. Start Flow — With Timer

- [ ] Clicking **Start** with a valid timer begins the 10-second countdown
- [ ] Countdown displays large numbers counting down on screen
- [ ] Controls (Start/Stop buttons) are disabled during countdown
- [ ] After countdown reaches 0, status badge changes to **Running**
- [ ] Python script spawns (visible in Developer Log as "Python process spawned")
- [ ] Elapsed time counter starts from 00:00:00
- [ ] Remaining time shows correct value and counts down
- [ ] When remaining time reaches 0, automation stops automatically
- [ ] Status badge returns to **Stopped** after timer elapses
- [ ] Stop reason "timer elapsed" appears in Activity Log

---

## 6. Start Flow — Without Timer (Indefinite)

- [ ] Clicking **Start** with timer set to 0 shows the "Run Without Timer?" modal
- [ ] Modal describes indefinite run behaviour
- [ ] Clicking **Go Back** dismisses the modal without starting
- [ ] Clicking **Start Anyway** begins the 10-second countdown
- [ ] No remaining time is shown ("No limit set") once running
- [ ] Automation continues until manually stopped

---

## 7. Stop Flow

- [ ] Clicking **Stop** while running stops automation immediately
- [ ] Status badge changes to **Stopped**
- [ ] Elapsed time freezes at the final value
- [ ] Remaining time clears from the display
- [ ] Stop reason "manual" appears in Activity Log with elapsed duration
- [ ] Clicking **Stop** during the countdown cancels start (no Python spawned)

---

## 8. Activity Log

- [ ] Clicking the **scroll-text icon** in the header opens the Activity Log
- [ ] Clicking again closes it
- [ ] Log panel is scrollable when entries exceed the visible area
- [ ] Start event appears in the log (mode, timer, options)
- [ ] Stop event appears in the log (reason, elapsed)
- [ ] Upwork close result appears in log when enabled
- [ ] Python stderr lines appear prefixed with "SCRIPT STDERR"
- [ ] Log persists across app restarts (entries from previous sessions shown)
- [ ] **Export** icon opens a save dialog
- [ ] Exported file contains the correct log content

---

## 9. Developer Log

- [ ] Clicking the **terminal icon** in the header opens the Developer Log panel
- [ ] Panel overlays the main content area with a dark terminal aesthetic
- [ ] Clicking the icon again closes the panel
- [ ] "Detecting Python binary" line appears when automation starts
- [ ] "Python detected: python" (or equivalent) appears
- [ ] "Script path resolved" line appears with correct path
- [ ] "Python process spawned (PID: …)" line appears
- [ ] Python stdout lines appear coloured as **SCRIPT** (cyan)
- [ ] Python stderr lines appear coloured as **STDERR** (orange)
- [ ] **ERROR** entries appear in red
- [ ] **WARN** entries appear in yellow/amber
- [ ] **INFO** entries appear in grey
- [ ] "Process exited" line appears with exit code on stop
- [ ] **Clear** button empties the panel (Main buffer still holds entries)
- [ ] Entry count shown in panel header is accurate
- [ ] Panel is scrollable when entries overflow

---

## 10. System Tray

- [ ] Tray icon shows **red Power-off** icon when stopped
- [ ] Tray icon updates to **green Power** icon immediately when automation starts
- [ ] Tray icon updates back to **red** immediately when automation stops
- [ ] Tooltip shows "InternalX — Running" / "InternalX — Stopped"
- [ ] Context menu shows correct status label (● Running / ○ Stopped)
- [ ] **Start Automation** is greyed out when running
- [ ] **Stop Automation** is greyed out when stopped
- [ ] Mode label in context menu matches the mode selected in the UI
- [ ] Double-clicking the tray icon shows and focuses the app window
- [ ] **Open Application** menu item shows and focuses the window
- [ ] **Exit** menu item fully quits the app
- [ ] Closing the window minimises to tray (does not quit)

---

## 11. Post-Stop Shutdown Flow

- [ ] After stop with Shutdown enabled, a modal appears with 30-second countdown
- [ ] Countdown counts down 30 → 0 in real time
- [ ] Clicking **Cancel Shutdown** stops the countdown and dismisses the modal
- [ ] When countdown reaches 0, the PC begins to shut down (requires admin rights)
- [ ] Voice announcement plays before shutdown if enabled

---

## 12. Voice Announcements

- [ ] Voice says "Automation countdown starting" when countdown begins
- [ ] Voice says "Automation started" when Python script spawns
- [ ] Voice says "Automation stopped" when stop is triggered
- [ ] Voice says "System shutting down" when shutdown is confirmed
- [ ] No errors thrown in environments where Speech API is unavailable

---

## 13. Python Script Execution

- [ ] **Basic mode** script runs without error for at least 60 seconds
- [ ] **Advanced mode** script runs without error for at least 60 seconds
- [ ] Script responds to SIGTERM (graceful stop on Unix)
- [ ] Script responds to taskkill (force stop on Windows)
- [ ] No orphan Python processes remain after the app is closed
- [ ] Error "Python not found" shown correctly when Python is not installed
- [ ] Wrong script path error is logged in Developer Log

---

## 14. Error States

- [ ] Status badge shows **Error** if Python crashes unexpectedly
- [ ] Error message appears in the Controls section
- [ ] After an error, Start button re-enables so the user can retry
- [ ] Tray icon reverts to red/stopped on error
- [ ] Error entries appear in both Activity Log and Developer Log

---

## 15. Auto-launch (Production only)

- [ ] App registers itself for auto-launch at login (production build only)
- [ ] App starts minimised to tray when launched at startup (via `--hidden`)
- [ ] Disabling auto-launch in OS settings removes the startup entry

---

## 16. Responsiveness

- [ ] UI layout holds at minimum window width of 360 px (no horizontal scroll)
- [ ] All buttons remain readable and tappable at 360 px
- [ ] Timer inputs sit side-by-side at all supported widths
- [ ] Countdown overlay does not overlap or obscure controls
- [ ] Activity Log and Developer Log panels scroll independently

---

## 17. Build & Packaging

- [ ] `npm run build` completes with zero TypeScript errors
- [ ] `npm run dev` launches Electron with hot reload
- [ ] `npm test` runs Vitest test suite with zero failures
- [ ] Production build includes `scripts/` folder in resources
- [ ] Python scripts run correctly from packaged app (not just dev mode)
