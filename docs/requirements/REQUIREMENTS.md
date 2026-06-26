# Automation Control Application — Product Requirements Document

**Version:** 1.0  
**Status:** Draft  
**Audience:** Internal Development Team  
**Last Updated:** June 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Features](#4-features)
   - [F1 — Start & Stop Automation](#f1--start--stop-automation)
   - [F2 — Automation Mode Selection](#f2--automation-mode-selection)
   - [F3 — Set Timer](#f3--stop-timer)
   - [F4 — Close Upwork Tracker on Stop](#f4--close-upwork-tracker-on-stop)
   - [F5 — Optional System Shutdown](#f5--optional-system-shutdown)
   - [F6 — Activity Logging](#f6--activity-logging)
   - [F7 — Voice Announcements](#f7--voice-announcements)
   - [F8 — System Tray Integration](#f8--system-tray-integration)
   - [F9 — Auto-Launch on System Startup](#f9--auto-launch-on-system-startup)
5. [UI & Layout Specification](#5-ui--layout-specification)
6. [Python Automation Scripts](#6-python-automation-scripts)
7. [Electron ↔ Python Communication](#7-electron--python-communication)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Out of Scope](#9-out-of-scope)
10. [Open Questions / Decisions Needed](#10-open-questions--decisions-needed)

---

## 1. Project Overview

An internal-use cross-platform desktop application (Windows-first) that allows team members to start, stop, and manage automation scripts without manually running Python from the terminal.

The application wraps existing and new Python automation scripts behind a clean single-screen UI, exposes controls via a system tray icon, and handles all lifecycle events (countdown, timer, voice feedback, shutdown, logging) automatically.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Desktop Shell | Electron (latest stable) |
| Frontend Framework | React + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Automation Scripts | Python 3.x (user-installed, not bundled) |
| IPC (App ↔ Script) | Electron `child_process` spawning Python |
| Voice Announcements | Web Speech API (`SpeechSynthesisUtterance`) via Electron renderer |
| Activity Log Storage | Append-only `.log` file on disk (global, persists across sessions) |

> **Design System:** All UI must follow the guidelines defined in `docs/design-system/`. There are two `.md` files there. Both must be read and followed before writing any component or styling code.

---

## 3. Project Structure

```
/
├── electron/
│   ├── main.ts              # Electron main process
│   ├── tray.ts              # System tray setup and menu
│   ├── ipc.ts               # IPC handlers (start, stop, config)
│   └── startup.ts           # Auto-launch on system startup logic
├── src/
│   ├── App.tsx              # Single-page UI root
│   ├── components/          # UI components (follow design system docs)
│   └── hooks/               # Custom React hooks (timer, status, logs)
├── scripts/
│   ├── basic_mode.py        # Basic automation script
│   └── advanced_mode.py     # Advanced automation script (new)
├── logs/
│   └── activity.log         # Global persistent activity log
├── docs/
│   └── design-system/       # ← Follow both .md files here for all UI
└── package.json
```

---

## 4. Features

---

### F1 — Start & Stop Automation

#### Description
The user can start and stop automation at any time using clearly labeled controls.

#### Behavior

**Starting:**
1. User clicks **Start Automation**.
2. A **10-second countdown** begins immediately.
   - Countdown is displayed on screen in a very small, unobtrusive element (bottom-right corner, small font, low opacity) so it does not appear prominently in tracker screenshots.
3. After the countdown ends:
   - Python automation script is spawned as a child process with the selected configuration.
   - An **elapsed timer** begins and is displayed in the UI (e.g. `Running: 00:14:32`).
   - A **voice announcement** plays: *"Automation started."*
4. Status indicator changes to **Running** (with appropriate visual treatment per design system).

**Stopping:**
1. User clicks **Stop Automation** (or stop is triggered automatically by timer or tray).
2. The Python child process is terminated (`SIGTERM` / `taskkill` on Windows).
3. A **voice announcement** plays: *"Automation stopped."*
4. Status indicator changes to **Stopped**.
5. Any configured post-stop actions run in order (see F4, F5).
6. An entry is written to the activity log (see F6).

#### Edge Cases
- If Start is clicked while automation is already running, the button is disabled — no action.
- If Stop is clicked when nothing is running, the button is disabled — no action.
- If the Python binary is not found, show a clear error in the UI and log it: *"Python not found. Please ensure Python 3 is installed and available in PATH."*

---

### F2 — Automation Mode Selection

#### Description
Two automation modes are available. Advanced Mode is always selected by default on app launch. The mode selector resets to Advanced Mode every time the app starts (not persisted).

#### Mode A — Basic Mode

**Purpose:** Simulates activity using browser tab and editor file switching only.

**Behavior:**
- Randomly performs a mix of the following actions:
  - `Ctrl + Tab` — switch browser tab or editor file
  - Scroll up / scroll down (random amount)
  - Arrow key presses (`Up`, `Down`, `Page Up`, `Page Down`)
- Uses the existing `new.py` logic as a base, modified as needed to fit this mode's scope.
- No `Alt + Tab` (no application switching).

#### Mode B — Advanced Mode *(Default)*

**Purpose:** Simulates fuller activity across both browser and desktop applications (e.g. browser and Cursor editor).

**Behavior:**
- All actions from Basic Mode, plus:
  - `Alt + Tab` — randomly switches between open applications/windows (e.g. browser ↔ Cursor)
- All actions are chosen randomly with no fixed pattern or repeatable sequence — the order, timing, and selection must be highly unpredictable and non-detectable as scripted.
- Timing between actions uses randomized intervals (no fixed cadence).
- Occasionally enters an "idle" phase where very little happens for a random period before resuming.

**Implementation Note:**
- A new Python script (`advanced_mode.py`) must be created for this mode.
- The `new.py` script can be used as a reference and modified as needed — it does not need to remain untouched.

---

### F3 — Set Timer

#### Description
The user can configure the automation to stop automatically after a set duration.

#### UI Controls
- Two numeric inputs: **Hours** and **Minutes** (e.g. `4` hours `30` minutes).
- Timer configuration is reset every time the app starts (not persisted).
- If both fields are left at `0` (or empty), automation runs indefinitely.

#### Behavior — Indefinite Mode
- If no timer is set, automation runs until the user manually stops it.
- A **warning is shown** in the UI before starting: *"No stop timer set. Automation will run indefinitely until manually stopped."*
- User must acknowledge this warning to proceed (a simple dismiss/confirm is sufficient).

#### Behavior — Timed Mode
- Timer begins counting after the 10-second countdown finishes (i.e. when the script actually starts).
- When the timer reaches 0:
  1. Automation is stopped automatically (same flow as manual stop).
  2. Post-stop actions run (F4, F5).
  3. Log entry is written (F6).

#### Display
- The remaining time is shown in the UI while automation is running (e.g. `Time Remaining: 03:47:12`).
- If no timer is set, show `Time Remaining: ∞` or `No limit set`.

---

### F4 — Close Upwork Tracker on Stop

#### Description
When automation stops (manually or via timer), the application can optionally close the Upwork Desktop App.

#### UI Control
- A checkbox in the configuration area: **"Close Upwork Tracker when automation stops"** (unchecked by default).

#### Behavior
- If the checkbox is **enabled** when automation stops:
  1. Find the Upwork Desktop App process by name (e.g. `Upwork.exe` on Windows).
  2. Terminate the process using OS-level process kill (`taskkill /IM Upwork.exe /F` on Windows).
- If the checkbox is **disabled**, no action is taken.
- If the process is not found (e.g. Upwork was already closed), log this as an informational entry and continue without error.

#### Notes
- This action runs **after** the automation script has been stopped.
- This action runs **before** any system shutdown (F5).

---

### F5 — Optional System Shutdown

#### Description
After automation ends and post-stop actions complete, the system can optionally shut down automatically.

#### UI Control
- A checkbox: **"Shut down system after automation ends"** (unchecked by default).

#### Behavior
- If enabled, after all stop actions complete (F4 done or skipped):
  1. Show a **30-second countdown** in the UI before shutdown: *"System shutting down in 30 seconds..."*
  2. User can cancel the shutdown within this window.
  3. If not cancelled, issue the OS shutdown command (`shutdown /s /t 0` on Windows).
- If disabled, no shutdown occurs.

#### Safety
- Shutdown is the **last** action in the stop sequence.
- Shutdown only triggers if automation was actually running when the stop event occurred (not on app exit if automation was already stopped).

---

### F6 — Activity Logging

#### Description
All key events are written to a persistent log file that survives app restarts.

#### Log File Location
- `logs/activity.log` inside the app's user data directory.
- The file is appended to — never overwritten or cleared by the app itself.
- The file persists indefinitely across sessions and restarts.

#### Events Logged

| Event | Log Entry Format |
|---|---|
| Automation started | `[YYYY-MM-DD HH:MM:SS] STARTED — Mode: Advanced, Timer: 4h 30m, Close Tracker: Yes, Shutdown: No` |
| Automation stopped (manual) | `[YYYY-MM-DD HH:MM:SS] STOPPED (manual) — Ran for: 01:12:43` |
| Automation stopped (timer) | `[YYYY-MM-DD HH:MM:SS] STOPPED (timer elapsed) — Ran for: 04:30:00` |
| Upwork tracker closed | `[YYYY-MM-DD HH:MM:SS] Upwork tracker closed successfully` |
| Upwork tracker not found | `[YYYY-MM-DD HH:MM:SS] Upwork tracker not found (already closed or not running)` |
| System shutdown triggered | `[YYYY-MM-DD HH:MM:SS] System shutdown initiated` |
| Python not found | `[YYYY-MM-DD HH:MM:SS] ERROR — Python binary not found in PATH` |
| Script crash / unexpected exit | `[YYYY-MM-DD HH:MM:SS] ERROR — Script exited unexpectedly (code: X)` |

#### In-App Log View
- The activity log tab/section in the UI shows log entries from the current file.
- Entries are displayed newest-first.
- UI shows entries from all sessions (not just the current one).

#### Export
- A button: **"Export Log"** — opens a save dialog and writes the current `activity.log` file to the user's chosen location as a `.txt` or `.log` file.
- No filtering or transformation is applied on export — the raw log content is saved as-is.

---

### F7 — Voice Announcements

#### Description
The application plays short voice announcements at automation start and stop events. These are played through the system's default audio output.

#### Implementation
- Use the Web Speech API (`window.speechSynthesis`) in the Electron renderer process.
- No external TTS library or API is required.
- Use default system voice. No voice configuration is exposed to the user.

#### Trigger Points & Messages

| Event | Voice Message |
|---|---|
| 10-second countdown begins | *"Automation starting in 10 seconds."* |
| Automation starts (after countdown) | *"Automation started."* |
| Automation stops (any reason) | *"Automation stopped."* |
| System shutdown countdown begins | *"System will shut down in 30 seconds."* |

#### Behavior
- Voice plays once per event. No repeat.
- If the system has no audio output or speech synthesis is unavailable, the feature is silently skipped — no error is shown to the user.

---

### F8 — System Tray Integration

#### Description
The application runs in the background and is accessible from the Windows System Tray at all times.

#### Tray Icon
- Icon changes to reflect current status:
  - **Stopped / Idle** — default icon state
  - **Running** — alternate icon (e.g. green indicator or pulsing variant)
- Tooltip on hover: `Automation Control — Running` or `Automation Control — Stopped`

#### Tray Right-Click Menu

```
Start Automation
Stop Automation
──────────────
Mode: [Basic / Advanced]      ← shows currently selected mode
──────────────
Open Application
──────────────
Exit
```

- **Start Automation** — triggers the same start flow as the UI button (10s countdown, voice, etc.)
- **Stop Automation** — triggers same stop flow
- **Mode indicator** — read-only label showing current mode. Clicking it does nothing (mode is set from main window only)
- **Open Application** — shows/restores the main window
- **Exit** — fully quits the application (script is stopped first if running)

#### Minimize to Tray
- Clicking the window's **X (close) button** hides the window — it does **not** quit the app.
- The app continues running and the tray icon remains visible.
- To fully exit, the user must use **Exit** from the tray menu.
- This is the default and only window-close behavior — it cannot be changed by the user.

---

### F9 — Auto-Launch on System Startup

#### Description
The application registers itself to launch automatically when Windows starts.

#### Behavior
- On first launch, the app registers itself in the Windows startup registry (or equivalent mechanism in Electron, e.g. `app.setLoginItemSettings`).
- The app launches minimized to tray on startup — the main window is not shown automatically.
- No user-configurable toggle for this in v1. It is always enabled.

---

## 5. UI & Layout Specification

### General

- **Single-page layout** — no navigation, no routing, no multi-page design.
- Everything is visible and accessible from one screen.
- Follow all rules in `docs/design-system/*.md` for colors, typography, spacing, and component style.

### Sections on Main Screen (top to bottom / left to right)

1. **Header** — App name and current status indicator (Running / Stopped)
2. **Mode Selector** — Toggle or radio between Basic and Advanced (Advanced pre-selected)
3. **Timer Configuration** — Hours + Minutes inputs with clear labels. Warning text if both are 0.
4. **Options** — Two checkboxes: Close Tracker | Shutdown after stop
5. **Controls** — Start and Stop buttons (Start disabled if already running, Stop disabled if not running)
6. **Countdown / Running Timer** — Small, low-opacity display (bottom-right or below controls) showing the 10s countdown before start, then the elapsed/remaining time while running
7. **Activity Log** — Scrollable log view (newest first), with Export button

### Countdown Display (During 10-second startup)
- Rendered as very small text (e.g. `12px` or `10px`, low opacity `0.4–0.6`).
- Positioned in the bottom-right corner of the app window.
- Must not be prominently visible in screenshots.
- Disappears once automation starts and is replaced by the running timer.

---

## 6. Python Automation Scripts

### Shared Behavior (Both Modes)
- The script runs in an infinite loop until terminated externally by Electron.
- The script must respond to `SIGTERM` (or `taskkill` on Windows) and exit cleanly.
- No hardcoded stop logic inside the script (duration/timer is managed by the Electron side).
- `pyautogui.FAILSAFE = False` must be set.
- Required packages: `pyautogui`, `keyboard`

### Basic Mode — `scripts/basic_mode.py`

Actions pool (randomly selected each iteration):
- `Ctrl + Tab`
- Scroll up (random amount 1–10 units)
- Scroll down (random amount 1–10 units)
- `Arrow Up`, `Arrow Down`, `Page Up`, `Page Down`
- Random number of up/down key presses in sequence

Timing: Random interval between `0.2s – 0.5s` per action.  
Idle phases: Occasionally (random chance) pause for `15–25s` before resuming.

### Advanced Mode — `scripts/advanced_mode.py`

Actions pool: Everything in Basic Mode, plus:
- `Alt + Tab`

Timing: Random interval between `0.2s – 5s` per action (wider variance than Basic).  
Idle phases: More frequent and longer than Basic (`20–60s` idle windows).  
Pattern: Must be genuinely unpredictable — no fixed cycles or rotation patterns.

### Script Communication

Scripts receive configuration via command-line arguments:

```bash
python scripts/advanced_mode.py --mode advanced --duration 16200 --shutdown false
```

| Argument | Type | Description |
|---|---|---|
| `--mode` | `basic` / `advanced` | Selected automation mode |
| `--duration` | `int` (seconds) | Total run duration (0 = indefinite) |
| `--shutdown` | `bool` | Whether system shutdown is enabled after stop |

> The scripts themselves do **not** enforce the duration. Duration countdown is managed by Electron, which sends the stop signal at the right time.

---

## 7. Electron ↔ Python Communication

### Architecture

```
[React UI] ──IPC──► [Electron Main] ──child_process.spawn──► [Python Script]
                          │
                          └──► Reads stdout/stderr for logging
```

### IPC Channels (Renderer → Main)

| Channel | Payload | Description |
|---|---|---|
| `automation:start` | `{ mode, durationSeconds, closeTracker, shutdown }` | Start the selected script |
| `automation:stop` | `{}` | Terminate the running script |
| `log:export` | `{ path }` | Copy log file to user-chosen path |

### IPC Channels (Main → Renderer)

| Channel | Payload | Description |
|---|---|---|
| `automation:status` | `{ status: 'running' \| 'stopped' \| 'error' }` | Status update |
| `automation:error` | `{ message: string }` | Error from Python (stderr or exit code) |
| `log:new-entry` | `{ entry: string }` | New log line written (for live UI update) |

### Process Lifecycle

- Script is spawned with `child_process.spawn('python', ['scripts/...', '--mode', ...])`.
- Electron listens to `stdout` and `stderr` and appends to the log file.
- On stop, Electron calls `process.kill(pid)` on Windows.
- If the script exits unexpectedly (non-zero exit code), Electron logs the error and updates the UI status to error state.

---

## 8. Non-Functional Requirements

| Requirement | Detail |
|---|---|
| **Platform** | Windows 10/11 (primary). macOS not required in v1. |
| **Python Dependency** | Python 3.x must be installed by the user and available in system `PATH`. The app does not bundle Python. |
| **Startup Time** | App should be ready (tray icon visible) within 5 seconds of system login. |
| **Memory** | App should not exceed 300MB RAM at idle. |
| **Log File Growth** | No automatic log rotation in v1. Manual deletion by user if needed. |
| **Error Visibility** | All errors must appear in both the UI and the log file. Silent failures are not acceptable. |
| **Fail Safe** | `pyautogui.FAILSAFE = False` is set. ESC key handling is removed in the new scripts (Electron manages stop). |

---

## 9. Out of Scope (v1)

- macOS system tray / menu bar support
- Log rotation or archiving
- Multiple simultaneous automation sessions
- User authentication or access control
- Remote/network control of automation
- Any cloud sync or telemetry
- Python bundling (PyInstaller or similar)
- Custom voice selection for TTS
- Persisting user preferences between sessions (mode, timer, checkboxes all reset on launch)

---

## 10. Open Questions / Decisions Needed

| # | Question | Owner |
|---|---|---|
| 1 | What is the exact process name of the Upwork Desktop App on Windows (e.g. `Upwork.exe`)? Needed for F4. | Kunjan |
| 2 | Should the tray icon be a custom branded icon, or is a placeholder acceptable for v1? | Kunjan |
| 3 | Should the Export Log dialog default to saving in a specific folder (e.g. Desktop), or use the OS default? | Kunjan |
| 4 | Is there a preferred app name / window title (e.g. "AutoControl", "WorkBot", etc.)? | Kunjan |

---

*End of Document*
