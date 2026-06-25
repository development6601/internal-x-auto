# Changelog

All notable changes to **InternalX** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.4] — 2026-06-25

### Fixed

- **Windows taskbar still showing Electron icon**
  - `electron/afterpack.cjs` now uses the correct **rcedit v5 API** (`version-string`
    nested object + dynamic ESM import). The previous flat keys (`product-name`,
    `file-description`, etc.) were silently ignored by rcedit v5, so the EXE icon
    and metadata were never applied correctly.
  - `electron/core/app-icon.ts` resolves icon paths at call-time (not module init),
    checks `process.cwd()/resources/icon.ico` for dev mode, and exposes
    `getWindowsWindowIcon()` for an absolute `.ico` path on Windows.
  - `electron/main.ts` passes an absolute **`.ico` path string** to `BrowserWindow`
    on Windows (Electron-recommended for taskbar icons), re-applies the icon on
    `ready-to-show`, and calls `app.setAppUserModelId()` before `app.whenReady()`.
  - `electron/vite-copy-resources.ts` copies icons on `buildStart` so dev mode has
    `dist-electron/resources/icon.ico` before Electron launches.
  - `scripts/generate-app-icon.mjs` — ICO now includes Windows 11 taskbar sizes
    (20, 24, 40 px) in addition to 16, 32, 48, 64, 128, 256.
  - `package.json` — added `directories.buildResources: resources` for
    electron-builder.

### Build

- Windows installer: `release/InternalX-Setup-1.0.4.exe`

---

## [1.0.3] — 2026-06-25

### Fixed

- **App switching limited to 2-app back-and-forth (VS Code ↔ Chrome)**
  - `action_app_switch()` now uses explicit `keyDown` → `press('tab')` → `keyUp`
    instead of `pyautogui.hotkey(...)`, so the modifier is released immediately
    after a single Tab tap. The OS switches to the **most-recently-used previous
    app** only — no app-switcher overlay, no landing on a third app (e.g. Spotify).
  - A 350 ms settle pause runs after each switch so focus fully transfers before
    the next action.
  - — `scripts/lib/actions.py`

### Build

- Windows installer: `release/InternalX-Setup-1.0.3.exe`

---

## [1.0.2] — 2026-06-25

### Fixed

- **Windows taskbar icon showing Electron (initial fix)**
  - Added `electron/afterpack.cjs` hook to embed icon via rcedit after packaging
    (`signAndEditExecutable: false` skips electron-builder's step to avoid
    winCodeSign symlink errors on Windows without Developer Mode).
  - `resources/icon.ico` and `icon.png` copied outside asar via `extraResources`.
  - `electron/core/app-icon.ts` checks `process.resourcesPath` first for packaged builds.
  - — `electron/afterpack.cjs`, `electron/core/app-icon.ts`, `package.json`

- **Timer far behind real time when window hidden to tray**
  - `backgroundThrottling: false` in `BrowserWindow` webPreferences.
  - Running timer in renderer anchors elapsed/remaining to `Date.now()` instead of
    counting `setInterval` ticks.
  - — `electron/main.ts`, `src/App.tsx`

- **Ctrl+Tab spinning between only two files/tabs**
  - Tab action holds Ctrl and presses Tab **1–5 times** (random) per action.
  - `action_ctrl_tab()` renamed to `action_ctrl_tab_multi()`.
  - Tab cycling weighted 4× in `BASIC_POOL`.
  - — `scripts/lib/actions.py`

- **Advanced mode app switching too frequent**
  - `action_app_switch` reduced from 2× to 1× in `ADVANCED_POOL` (~7% of actions).
  - — `scripts/lib/actions.py`

- **macOS: Python rocket icon in Dock**
  - `NSApplicationActivationPolicyProhibited` set via ctypes before `import pyautogui`.
  - — `scripts/lib/actions.py`

### Build

- Windows installer: `release/InternalX-Setup-1.0.2.exe`

---

## [1.0.1] — 2026-06-25

### Fixed

- **Platform: keyboard shortcuts**
  - Advanced mode uses `Cmd+Tab` on macOS and `Alt+Tab` on Windows/Linux.
  - `action_alt_tab()` renamed to `action_app_switch()` with `sys.platform` branching.
  - — `scripts/lib/actions.py`

- **Platform: macOS Accessibility warning**
  - Checks `systemPreferences.isTrustedAccessibilityClient()` before spawning Python;
    logs a clear `WARN` with setup instructions if permission is missing.
  - — `electron/core/automation.ts`

- **UI tooltips**
  - Mode tooltips no longer use Windows-only shortcut wording.
  - Advanced mode: "Alt+Tab on Windows, Cmd+Tab on macOS".
  - — `src/App.tsx`

- **Docs: stale `keyboard` package references**
  - `docs/development/python-prerequisites.md` updated — only `pyautogui` is required.
  - Added macOS Accessibility permission setup section.

### Changed

- `scripts/advanced_mode.py` — docstring updated for platform-neutral app switching.
- `scripts/basic_mode.py` — minor docstring clarification.

### Added

- Windows/macOS packaging via **electron-builder** (`dist:win`, `dist:mac` scripts).

### Build

- Windows installer: `release/InternalX-Setup-1.0.1.exe`

---

## [1.0.0] — 2026-06-25

### Added

- Initial release of **InternalX** desktop automation app.
- Electron 33 shell with React + Tailwind UI.
- **Basic mode** — `Ctrl+Tab`, scroll, arrow keys, page up/down (no app switching).
- **Advanced mode** — all Basic actions + application switching.
- System tray with start/stop/exit context menu.
- Auto-launch at OS login (production builds).
- Python prerequisites check and one-click install via pip.
- Close Upwork Desktop App on stop (Windows: `taskkill`; macOS: `osascript`).
- OS shutdown after automation ends with 30-second cancellable countdown.
- Persistent activity log with export to file.
- Voice announcements via Web Speech API.

### Build

- Windows installer: `InternalX-Setup-1.0.0.exe` (NSIS, x64).
- macOS disk image: `InternalX-1.0.0.dmg` (must be built on macOS).
