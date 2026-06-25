# Python Script Execution — Implementation Plan

**Project:** InternalX (Automation Control Application)  
**Version:** 1.0  
**Status:** Planning  
**Audience:** Internal Development Team  
**Last Updated:** June 2026  
**Source of truth:** [REQUIREMENTS.md](../requirements/REQUIREMENTS.md)

---

## Table of Contents

1. [Goals](#1-goals)
2. [Where to Put the Scripts](#2-where-to-put-the-scripts)
3. [Architecture Overview](#3-architecture-overview)
4. [Responsibility Split](#4-responsibility-split)
5. [Implementation Phases](#5-implementation-phases)
6. [Task Breakdown](#6-task-breakdown)
7. [Python Script Requirements](#7-python-script-requirements)
8. [Electron Process Management](#8-electron-process-management)
9. [IPC Contract](#9-ipc-contract)
10. [Error Handling & Edge Cases](#10-error-handling--edge-cases)
11. [Logging Strategy](#11-logging-strategy)
12. [Local Development & Testing](#12-local-development--testing)
13. [Acceptance Criteria](#13-acceptance-criteria)
14. [Out of Scope (v1)](#14-out-of-scope-v1)
15. [Open Decisions](#15-open-decisions)

---

## 1. Goals

| # | Goal |
|---|---|
| G1 | Team members start/stop automation from the InternalX UI — no manual terminal commands. |
| G2 | Electron owns the full lifecycle: countdown, timer, stop, post-stop actions, logging, and voice feedback. |
| G3 | Python scripts only simulate keyboard/mouse activity in a loop until Electron terminates them. |
| G4 | Two modes (Basic / Advanced) map to separate, maintainable scripts with shared utilities. |
| G5 | All failures (Python missing, crash, unexpected exit) are visible in the UI and `activity.log`. |
| G6 | Windows-first: clean termination via `taskkill` / process kill when the user or timer stops automation. |

---

## 2. Where to Put the Scripts

### Recommended directory (project root)

Place all automation Python files in the **`scripts/`** folder at the **repository root**:

```
auto-evetns/
├── electron/
├── src/
├── scripts/                    ← PUT AUTOMATION SCRIPTS HERE
│   ├── basic_mode.py           # Basic mode entry point
│   ├── advanced_mode.py        # Advanced mode entry point
│   ├── requirements.txt        # pyautogui, keyboard (for user install)
│   └── lib/                    # Optional shared Python utilities
│       ├── __init__.py
│       ├── actions.py          # Shared action pool helpers
│       └── signals.py          # SIGTERM / clean exit handling
├── logs/                       # Runtime log output (see F6 in requirements)
└── docs/
```

### Why `scripts/` at project root?

- Matches the structure defined in [REQUIREMENTS.md §3](../requirements/REQUIREMENTS.md#3-project-structure).
- Keeps automation logic separate from Electron (`electron/`) and React (`src/`).
- Electron can resolve paths relative to the app root in dev and packaged builds.
- Easy for developers to run manually during testing:

```bash
python scripts/basic_mode.py --mode basic --duration 0 --shutdown false
python scripts/advanced_mode.py --mode advanced --duration 16200 --shutdown false
```

### What NOT to do

| Avoid | Reason |
|---|---|
| Put scripts inside `src/` | `src/` is for React/TypeScript UI only. |
| Put scripts inside `electron/` | Main process spawns Python; scripts are not Electron code. |
| Bundle Python with the app (v1) | Explicitly out of scope — user installs Python 3.x and deps. |
| Hardcode stop/duration logic in Python | Timer and stop are managed entirely by Electron. |

### Reference script

If an existing `new.py` exists elsewhere in the team’s workflow, use it **only as a reference** when implementing `basic_mode.py` / `advanced_mode.py`. Do not require users to keep `new.py` in the repo unless the team decides to commit it under `scripts/legacy/new.py` for history.

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        React UI (src/)                          │
│  Start / Stop · Mode · Timer · Options · Log view · Voice (TTS) │
└────────────────────────────┬────────────────────────────────────┘
                             │ IPC (preload bridge)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Electron Main (electron/)                      │
│  ipc.ts        → start / stop / export handlers                 │
│  automation.ts → spawn, kill, stdout/stderr, status               │
│  logger.ts     → append activity.log, emit log:new-entry          │
│  tray.ts       → tray start/stop (same flow as UI)              │
└────────────────────────────┬────────────────────────────────────┘
                             │ child_process.spawn('python', [...])
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Python (scripts/)                              │
│  basic_mode.py  |  advanced_mode.py                             │
│  Infinite loop · random actions · SIGTERM-aware exit            │
└─────────────────────────────────────────────────────────────────┘
```

**Data flow on Start:**

1. User confirms start (10s countdown + optional indefinite-timer modal).
2. Renderer sends `automation:start` with `{ mode, durationSeconds, closeTracker, shutdown }`.
3. Main process validates Python is on `PATH`, resolves script path, spawns child.
4. Main sets status `running`, starts UI timer (elapsed / remaining).
5. Renderer plays voice: *"Automation started."*

**Data flow on Stop:**

1. Trigger: manual stop, timer elapsed, tray stop, or app exit.
2. Main kills Python child (`taskkill` on Windows).
3. Post-stop sequence (Electron only): close Upwork tracker (optional) → shutdown countdown (optional).
4. Log entry written; status `stopped`; voice: *"Automation stopped."*

---

## 4. Responsibility Split

| Concern | Owner | Notes |
|---|---|---|
| 10s pre-start countdown | React UI | Already in UI state; no Python yet. |
| Stop timer (hours/minutes) | React UI + Main | UI counts down; Main sends stop when elapsed. |
| Spawn / kill Python | Electron Main | `child_process.spawn` / `process.kill`. |
| Mode selection | React UI | Passes `basic` or `advanced` to IPC. |
| Activity simulation | Python | Random actions until killed. |
| Close Upwork on stop | Electron Main | `taskkill /IM Upwork.exe /F` (name TBD). |
| System shutdown | Electron Main | `shutdown /s /t 0` after 30s cancel window. |
| Persistent activity log | Electron Main | `logs/activity.log` in user data dir (per F6). |
| Voice announcements | React renderer | Web Speech API. |
| Python package install | End user | `pip install -r scripts/requirements.txt` |

---

## 5. Implementation Phases

### Phase 1 — Foundation (Electron ↔ Python shell)

**Objective:** Prove spawn, kill, and status updates work with a minimal script.

| Step | Action |
|---|---|
| 1.1 | Create `scripts/` folder and `scripts/ping.py` (prints line, sleeps in loop). |
| 1.2 | Add `electron/automation.ts` — resolve Python binary, spawn, track `ChildProcess` ref. |
| 1.3 | Add `electron/ipc.ts` — register `automation:start` / `automation:stop`. |
| 1.4 | Extend `electron/preload.ts` — expose typed `electronAPI.automation.*`. |
| 1.5 | Wire React Start/Stop to IPC (replace local-only mock state). |
| 1.6 | On missing Python: UI error + log `ERROR — Python binary not found in PATH`. |

**Exit criteria:** Start launches Python; Stop kills it; status badge reflects running/stopped.

---

### Phase 2 — Python automation scripts

**Objective:** Implement real Basic and Advanced behavior per requirements.

| Step | Action |
|---|---|
| 2.1 | Add `scripts/requirements.txt` (`pyautogui`, `keyboard`). |
| 2.2 | Add `scripts/lib/` shared helpers (action pool, idle phases, signal handler). |
| 2.3 | Implement `scripts/basic_mode.py` (no Alt+Tab; 0.2–0.5s intervals; 15–25s idle). |
| 2.4 | Implement `scripts/advanced_mode.py` (+ Alt+Tab; 0.2–5s; 20–60s idle; unpredictable). |
| 2.5 | CLI args: `--mode`, `--duration`, `--shutdown` (parsed but duration not enforced in script). |
| 2.6 | Set `pyautogui.FAILSAFE = False`; handle SIGTERM for clean exit. |
| 2.7 | Remove any ESC-key stop logic from scripts (Electron owns stop). |

**Exit criteria:** Both scripts run until Electron stops them; actions match mode spec.

---

### Phase 3 — Lifecycle integration

**Objective:** Full start/stop flow aligned with F1–F3.

| Step | Action |
|---|---|
| 3.1 | Start only after 10s countdown completes (UI gates IPC call). |
| 3.2 | Main rejects second start if process already running. |
| 3.3 | Timer stop: UI or Main timer calls same stop pipeline as manual stop. |
| 3.4 | Tray start/stop uses identical IPC handlers as UI buttons. |
| 3.5 | On app exit: stop child process if running before quit. |

**Exit criteria:** Countdown → spawn → timer → auto-stop matches PRD F1 and F3.

---

### Phase 4 — Post-stop actions & logging

**Objective:** F4, F5, F6 fully implemented in Main process.

| Step | Action |
|---|---|
| 4.1 | After Python exit: optional Upwork tracker kill (F4). |
| 4.2 | After post-stop actions: optional 30s shutdown countdown (F5). |
| 4.3 | Logger writes formatted lines to user-data `activity.log`. |
| 4.4 | IPC `log:new-entry` updates Activity Log panel live. |
| 4.5 | IPC `log:export` opens save dialog and copies log file. |
| 4.6 | Pipe Python stdout/stderr to log file (informational / errors). |

**Exit criteria:** Log persists across sessions; export works; post-stop order is correct.

---

### Phase 5 — Hardening & QA

**Objective:** Production-ready behavior on Windows 10/11.

| Step | Action |
|---|---|
| 5.1 | Test Python not in PATH, script missing, non-zero exit code. |
| 5.2 | Test kill during idle phase and mid-action. |
| 5.3 | Test packaged app path resolution (`scripts/` relative to app root). |
| 5.4 | Verify memory idle &lt; 300MB; no zombie Python processes. |
| 5.5 | Document user setup: Python 3.x + `pip install -r scripts/requirements.txt`. |

---

## 6. Task Breakdown

### Electron (TypeScript)

| ID | Task | File(s) | Depends on |
|---|---|---|---|
| E1 | Python binary detection (`python` / `py -3` on Windows) | `electron/automation.ts` | — |
| E2 | Script path resolver (dev vs production) | `electron/automation.ts` | E1 |
| E3 | Spawn with CLI args from UI config | `electron/automation.ts`, `electron/ipc.ts` | E2 |
| E4 | Graceful kill + force kill fallback (Windows) | `electron/automation.ts` | E3 |
| E5 | Process event handlers (`exit`, `error`, `close`) | `electron/automation.ts` | E3 |
| E6 | IPC handlers: start, stop, export | `electron/ipc.ts` | E3 |
| E7 | Preload API surface | `electron/preload.ts` | E6 |
| E8 | Activity logger service | `electron/logger.ts` | — |
| E9 | Upwork process kill (F4) | `electron/post-stop.ts` | E4 |
| E10 | System shutdown (F5) | `electron/post-stop.ts` | E4 |

### React (TypeScript)

| ID | Task | File(s) | Depends on |
|---|---|---|---|
| R1 | Replace mock start/stop with IPC calls | `src/App.tsx`, hooks | E7 |
| R2 | Subscribe to `automation:status` / `automation:error` | `src/hooks/useAutomation.ts` | E7 |
| R3 | Subscribe to `log:new-entry` for live log | `src/hooks/useActivityLog.ts` | E8 |
| R4 | Export log button → `log:export` | `src/App.tsx` | E6 |
| R5 | Voice hooks at countdown / start / stop / shutdown | `src/hooks/useVoice.ts` | — |

### Python

| ID | Task | File(s) | Depends on |
|---|---|---|---|
| P1 | `requirements.txt` | `scripts/requirements.txt` | — |
| P2 | Shared action pool + idle logic | `scripts/lib/actions.py` | P1 |
| P3 | Signal / clean exit handler | `scripts/lib/signals.py` | — |
| P4 | `basic_mode.py` | `scripts/basic_mode.py` | P2, P3 |
| P5 | `advanced_mode.py` | `scripts/advanced_mode.py` | P2, P3 |
| P6 | Argparse CLI (`--mode`, `--duration`, `--shutdown`) | Both entry scripts | P4, P5 |

---

## 7. Python Script Requirements

### Shared rules (both modes)

- Run in an **infinite loop** until terminated externally.
- Respond to **SIGTERM** (and Windows console break where applicable) and exit cleanly.
- **No** internal duration/timer stop logic.
- `pyautogui.FAILSAFE = False`.
- Dependencies: `pyautogui`, `keyboard`.
- No ESC-based self-stop (Electron manages stop).

### Basic mode (`scripts/basic_mode.py`)

| Item | Spec |
|---|---|
| Actions | Ctrl+Tab, scroll up/down (1–10), arrow keys, Page Up/Down |
| Excluded | Alt+Tab |
| Action interval | Random 0.2s – 0.5s |
| Idle phases | Random 15s – 25s occasionally |

### Advanced mode (`scripts/advanced_mode.py`)

| Item | Spec |
|---|---|
| Actions | Everything in Basic + Alt+Tab |
| Action interval | Random 0.2s – 5s |
| Idle phases | Random 20s – 60s, more frequent than Basic |
| Pattern | Genuinely random — no fixed cycles |

### CLI arguments (informational; duration enforced by Electron)

```bash
python scripts/<mode>_mode.py --mode <basic|advanced> --duration <seconds> --shutdown <true|false>
```

| Argument | Type | Script behavior |
|---|---|---|
| `--mode` | `basic` \| `advanced` | Validate; may select behavior if one file used later |
| `--duration` | int | Log or ignore — **do not** enforce stop |
| `--shutdown` | bool | Log or ignore — shutdown is Electron post-stop |

---

## 8. Electron Process Management

### Spawn

```typescript
// Pseudocode — electron/automation.ts
const scriptPath = resolveScriptPath(mode) // scripts/basic_mode.py | advanced_mode.py
const child = spawn(pythonBin, [
  scriptPath,
  '--mode', mode,
  '--duration', String(durationSeconds),
  '--shutdown', String(shutdown),
], {
  cwd: appRoot,
  windowsHide: true,
})
```

### Stop (Windows)

1. Attempt graceful termination (`child.kill('SIGTERM')` or `taskkill /PID <pid>`).
2. If not exited within ~3s, force kill (`taskkill /PID <pid> /F`).
3. Clear child reference; emit `automation:status: stopped`.

### Single-instance guard

- Only **one** Python child at a time.
- If `automation:start` received while running → reject (UI already disables Start).

### Path resolution

| Environment | Script root |
|---|---|
| Development | `<repo-root>/scripts/` |
| Packaged app | `<app-resources>/scripts/` (copy `scripts/` in build step) |

> **Build note:** When packaging with Electron Builder / similar, include `scripts/**` in `extraResources` so paths work outside `asar`.

---

## 9. IPC Contract

### Renderer → Main

| Channel | Payload | When |
|---|---|---|
| `automation:start` | `{ mode, durationSeconds, closeTracker, shutdown }` | After 10s countdown |
| `automation:stop` | `{}` | Manual, timer, tray, or shutdown cancel flow |
| `log:export` | `{ path }` | User clicks Export |

### Main → Renderer

| Channel | Payload | When |
|---|---|---|
| `automation:status` | `{ status: 'running' \| 'stopped' \| 'error' }` | Spawn, stop, crash |
| `automation:error` | `{ message: string }` | Python missing, spawn error, stderr |
| `log:new-entry` | `{ entry: string }` | Each log line appended |

---

## 10. Error Handling & Edge Cases

| Scenario | Expected behavior |
|---|---|
| Python not in PATH | Block start; UI error; log `ERROR — Python binary not found in PATH` |
| Script file missing | Block start; UI error; log path resolution failure |
| Start while already running | Ignored (UI disables button; Main double-checks) |
| Stop while not running | Ignored (UI disables button) |
| Script exits code ≠ 0 | Status `error`; log `ERROR — Script exited unexpectedly (code: X)` |
| Upwork not running on stop | Log informational; continue (F4) |
| User cancels shutdown | Abort `shutdown /s`; log cancel if needed |
| App closed (X → tray) | Python keeps running; tray still controls stop |
| App Exit from tray | Stop Python first, then quit |

---

## 11. Logging Strategy

### Log file location

Per requirements (F6): **`logs/activity.log`** under the app **user data directory** (not necessarily repo `logs/` in production).

- Repo `logs/` folder: placeholder / dev convenience only.
- Runtime path: `app.getPath('userData') + '/logs/activity.log'`.

### Events to log

| Event | Format |
|---|---|
| Started | `[timestamp] STARTED — Mode: Advanced, Timer: 4h 30m, Close Tracker: Yes, Shutdown: No` |
| Stopped (manual) | `[timestamp] STOPPED (manual) — Ran for: HH:MM:SS` |
| Stopped (timer) | `[timestamp] STOPPED (timer elapsed) — Ran for: HH:MM:SS` |
| Upwork closed | `[timestamp] Upwork tracker closed successfully` |
| Upwork not found | `[timestamp] Upwork tracker not found (already closed or not running)` |
| Shutdown initiated | `[timestamp] System shutdown initiated` |
| Python missing | `[timestamp] ERROR — Python binary not found in PATH` |
| Script crash | `[timestamp] ERROR — Script exited unexpectedly (code: X)` |

---

## 12. Local Development & Testing

### One-time setup

```bash
# From repo root
python --version          # Must be 3.x
pip install -r scripts/requirements.txt
```

### Manual script test (without Electron)

```bash
python scripts/basic_mode.py --mode basic --duration 0 --shutdown false
# Stop with Ctrl+C in terminal (simulates external kill)
```

### Electron integration test

```bash
npm run dev
# Use UI Start → verify Python process in Task Manager → Stop → verify process gone
```

### Checklist

- [ ] Basic mode: no Alt+Tab observed
- [ ] Advanced mode: Alt+Tab occurs
- [ ] Stop from UI, tray, and timer all kill Python
- [ ] Log file appends across app restarts
- [ ] Error shown in UI and log when Python missing

---

## 13. Acceptance Criteria

| # | Criterion |
|---|---|
| AC1 | Scripts live in `scripts/` at project root with `basic_mode.py` and `advanced_mode.py`. |
| AC2 | User can start/stop automation from UI and tray without using a terminal. |
| AC3 | Python runs only after 10s countdown; stops on manual action or timer. |
| AC4 | Electron kills Python on stop; no orphan processes after stop/exit. |
| AC5 | Mode selection spawns the correct script with correct CLI args. |
| AC6 | All PRD log events appear in `activity.log` and UI log panel. |
| AC7 | Python missing and script crash surface in UI and log. |
| AC8 | Post-stop actions (Upwork close, shutdown) run in order after Python exits. |

---

## 14. Out of Scope (v1)

- Bundling Python (PyInstaller, embedded runtime)
- macOS tray / process management parity
- Multiple concurrent automation sessions
- Log rotation / archival
- Remote control or cloud sync
- Persisting UI preferences between sessions

---

## 15. Open Decisions

| # | Question | Impact | Owner |
|---|---|---|---|
| 1 | Exact Upwork process name on Windows (`Upwork.exe`?) | F4 `taskkill` target | Kunjan |
| 2 | Windows Python command: `python` vs `py -3` fallback order | Spawn reliability | Dev |
| 3 | Include `scripts/` in packaged `extraResources` — which build tool? | Production paths | Dev |
| 4 | Should `new.py` be committed under `scripts/legacy/` as reference? | Basic mode implementation | Dev |
| 5 | Pipe Python stdout to UI log or only structured Main events? | Log verbosity | Dev |

---

## Quick Reference — Directory Answer

**Put your automation scripts here:**

```
d:\Projects\auto-evetns\scripts\
├── basic_mode.py
├── advanced_mode.py
├── requirements.txt
└── lib/          (optional shared code)
```

This is the canonical location for InternalX automation scripts in development and should be copied/bundled into the Electron app at build time for production.

---

*End of Plan — Python Script Execution v1.0*
