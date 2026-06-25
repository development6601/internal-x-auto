# Changelog

All notable changes to **InternalX** are documented here.

---

## [1.0.3] — 2026-06-25

### Fixed

- **App switching now goes strictly to the last used app (2-app back-and-forth)**
  `action_app_switch()` previously used `pyautogui.hotkey(...)` which chains
  keyDown+keyUp in a single call and may leave the modifier held a fraction too
  long on some systems, risking the OS showing the persistent app-switcher overlay
  and landing on a third app. It now uses an explicit `keyDown` → `press('tab')` →
  `keyUp` sequence so the modifier is always released immediately after the single
  Tab tap. This guarantees the OS switches directly to the **most-recently-used
  previous app** without opening the switcher list — creating a clean VS Code ↔
  Chrome back-and-forth. A 350 ms settle pause is inserted after each switch so
  the window manager fully transfers focus before the next action fires.
  — `scripts/lib/actions.py`: `action_app_switch()`.

---

## [1.0.2] — 2026-06-25

### Fixed

- **Windows taskbar icon showing Electron** — `signAndEditExecutable: false` was
  preventing electron-builder's rcedit step from embedding the InternalX icon into
  the EXE. A new `electron/afterpack.cjs` hook now runs `rcedit` directly after
  packaging to set the icon, product name, and version metadata on the EXE.
  Additionally, `resources/icon.ico` and `icon.png` are now copied outside the
  asar archive via `extraResources` so `mainWindow.setIcon()` loads from the real
  filesystem (more reliable on Windows than loading from inside the asar).
  — `electron/afterpack.cjs` (new); `electron/core/app-icon.ts` checks
  `process.resourcesPath` first; `package.json` build config updated.

- **Timer far behind real time when window is hidden to tray** — Chromium
  aggressively throttles `setInterval` in hidden windows, causing the displayed
  elapsed/remaining time to fall ~3× behind wall-clock time. Two complementary
  fixes: (1) `backgroundThrottling: false` in `BrowserWindow` webPreferences
  disables Chromium's background timer throttling entirely; (2) the running-timer
  effect in the renderer now anchors elapsed/remaining to `Date.now()` instead of
  counting ticks, so the displayed time is always accurate even if an interval
  fires late.
  — `electron/main.ts`; `src/App.tsx` (running timer effect + new refs
  `runStartTimeRef`, `runTotalSecondsRef`).

- **Ctrl+Tab spinning between only two files** — The tab-cycling action previously
  sent a single `Ctrl+Tab` press, causing VS Code / Chrome to flip between exactly
  two files/tabs. It now holds Ctrl and presses Tab **1–5 times** (random), so
  each action cycles through a variable number of open files or browser tabs before
  releasing Ctrl. The `BASIC_POOL` weights also increase tab-cycling frequency
  (4× weight vs. 1× before).
  — `scripts/lib/actions.py`: `action_ctrl_tab()` → `action_ctrl_tab_multi()`.

- **Advanced mode app switching too frequent** — `action_app_switch` appeared
  twice in `ADVANCED_POOL` (≈17% of actions). It now appears once (≈7%), making
  tab/file cycling the dominant activity and application switching occasional.
  — `scripts/lib/actions.py`.

- **macOS: Python rocket icon appearing in Dock** — `pyautogui` imports
  Quartz/pyobjc, which creates an `NSApplication` instance and shows the Python
  icon in the Dock. The fix calls `[NSApp setActivationPolicy: NSApplicationActivationPolicyProhibited]`
  via `ctypes` **before** `import pyautogui`, suppressing the Dock entry.
  — `scripts/lib/actions.py`.

---

All notable changes to **InternalX** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] — 2026-06-25

### Fixed

- **Platform: keyboard shortcuts** — Advanced mode application switching now uses
  `Cmd+Tab` on macOS instead of `Alt+Tab` (which is `Option+Tab` on macOS and
  does not switch applications). Windows continues to use `Alt+Tab`.
  — `scripts/lib/actions.py`: renamed `action_alt_tab()` → `action_app_switch()`
  with `sys.platform` branching; updated `ADVANCED_POOL` reference.

- **Platform: macOS Accessibility warning** — Before spawning the Python automation
  process on macOS, InternalX now checks `systemPreferences.isTrustedAccessibilityClient()`
  and writes a clear `WARN` entry to the Activity Log if the permission is missing,
  explaining exactly where to grant it.
  — `electron/core/automation.ts`: added `warnIfAccessibilityNotGranted()`.

- **UI tooltips** — Mode selector tooltips no longer mention Windows-only shortcuts.
  Basic mode: "No application switching (Alt+Tab)" → "No application switching."
  Advanced mode now reads: "Includes application switching (Alt+Tab on Windows,
  Cmd+Tab on macOS)."
  — `src/App.tsx`: updated `MODE_OPTIONS` constants.

- **Docs: stale `keyboard` package references** — `docs/development/python-prerequisites.md`
  incorrectly listed `keyboard` as a required package. Only `pyautogui` is required.
  Removed stale references from verify-imports examples and the related-files footer.
  Added a new macOS Accessibility permission setup section.

### Changed

- `scripts/advanced_mode.py` — updated docstring to describe "application switching"
  generically rather than naming `Alt+Tab` specifically.
- `scripts/basic_mode.py` — minor docstring clarification.

---

## [1.0.0] — 2026-06-25

### Added

- Initial release of **InternalX** desktop automation app.
- Electron 33 shell with React + Tailwind UI.
- Basic mode: `Ctrl+Tab`, scroll, arrow keys, page up/down.
- Advanced mode: all Basic actions + application switching.
- System tray with start/stop/exit context menu.
- Auto-launch at OS login (production builds).
- Python prerequisites check and one-click install via pip.
- Close Upwork Desktop App on stop (Windows: `taskkill`; macOS: `osascript`).
- OS shutdown after automation ends with 30-second cancellable countdown.
- Persistent activity log with export to file.
- Voice announcements via Web Speech API.
- Windows installer: `InternalX-Setup-1.0.0.exe` (NSIS, x64).
- macOS disk image: `InternalX-1.0.0.dmg` (must be built on macOS).
