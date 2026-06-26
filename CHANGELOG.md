# Changelog

All notable changes to **InternalX** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.7] — 2026-06-26

### Added

- **Dark / Light mode with system preference support**
  - New `useTheme` hook (`src/hooks/useTheme.ts`) manages three modes:
    `system` (follows OS preference), `light`, and `dark`.
  - The chosen mode is persisted in `localStorage` under `internalx-theme`.
  - The hook applies the `dark` class to `<html>` — Tailwind's `class` dark
    strategy — so all `editorial-*` CSS-variable tokens automatically swap
    without per-element `dark:` prefixes.
  - Dark palette is **warm-dark editorial**: deep warm-brown bases
    (`#16130f`), cream-inverted text (`#f0ebe2`), brightened burgundy
    (`#c4677a`). Full token set documented in the design system docs.
  - Tailwind config updated to `darkMode: 'class'`.
  - — `tailwind.config.js`, `src/index.css`, `src/hooks/useTheme.ts`

- **Theme toggle button in header (replaces Developer Log)**
  - A **Sun / Moon toggle** in the top-right header row cycles through
    `system → light → dark → system` with a tooltip describing the current
    mode.
  - Removed the internal-only Developer Log panel and its Terminal button
    (`showDevLog`, `useDevLog`, associated state and JSX).
  - — `src/App.tsx`

- **Design system docs: Dark Mode section**
  - `theme-02-editorial-design-system.md` — Section 15: Dark Mode Token
    Overrides & Guidelines (CSS token sheet, contrast table, anti-patterns).
  - `theme-02-editorial-instructions.md` — Section 21: Dark Mode Construction
    Rules (background, typography, colour, toggle implementation, checklist).

### Changed

- **Start button follows design-system primary colour (burgundy)**
  - Removed the green override (`!bg-editorial-success`) from the Start
    button. The button now uses the `primary` variant's burgundy colour,
    consistent with the Editorial design system.
  - Stop button upgraded to the `danger` variant (red fill), providing
    clear visual distinction without hardcoded class overrides.
  - — `src/App.tsx`

- **Post-Stop Options: Shutdown now depends on Screen Lock**
  - Both **Screen Lock** and **Shutdown** start **unselected** by default.
  - **Shutdown is disabled** until **Screen Lock** is enabled. Only after
    Screen Lock is checked does Shutdown become selectable (a lock must
    always run before the machine powers off).
  - Disabling Screen Lock automatically clears Shutdown.
  - The same dependency is enforced in the **tray menu** — the Shutdown
    checkbox is greyed out until Screen Lock is checked.
  - Tooltips updated to describe the new dependency.
  - — `src/App.tsx`, `electron/core/tray.ts`

- **Tray icon: real app icon composited on status-coloured background**
  - The tray now uses **raw BGRA bitmap compositing** (not SVG-embedded PNG)
    to reliably show the InternalX app icon on a status-coloured rounded
    background: **green** (`#2d6a4f`) when running, **red** (`#9b2335`)
    when stopped.
  - Previous SVG + embedded base64-PNG approach failed silently in the
    Electron main process (which has no full SVG renderer for `<image>`
    elements), causing the tray to show only a small coloured dot.
    The new approach uses `nativeImage.toBitmap()` / `createFromBitmap()`
    directly — reliable on both Windows and macOS.
  - Falls back to pure SVG power-glyph icons only if bitmap pipeline fails.
  - — `electron/core/tray.ts`

- **Tab active pill respects dark mode**
  - Replaced hardcoded `bg-white` on active tab pills with
    `bg-editorial-surface`, which automatically uses the correct dark/light
    surface colour via CSS variable.
  - — `src/App.tsx`

### Fixed

- **Screen lock not working on Windows (only worked on macOS)**
  - The Windows lock used `execSync('rundll32.exe user32.dll,LockWorkStation')`,
    which routes through `cmd.exe` and can mis-parse the comma in the DLL
    entry point on some locales/configs, silently failing to lock.
  - Now uses `execFileSync('rundll32.exe', ['user32.dll,LockWorkStation'])` —
    the correct Win+L-equivalent API call launched directly without a shell.
  - macOS keeps `CGSession -suspend` as the primary lock and now falls back
    to the **Ctrl+Cmd+Q** keystroke if `CGSession` is unavailable.
  - Each lock attempt is logged so failures are visible in the activity log.
  - — `electron/core/post-stop.ts`

- **Multiple app instances could be launched**
  - The single-instance lock now reliably **reveals and focuses the existing
    window** when a second launch is attempted — restoring it from the tray
    or a minimized state, briefly forcing it to the foreground (Windows),
    and recreating the window if it had been fully closed to tray.
  - A second process never opens its own window; it exits immediately and
    hands focus to the already-running instance.
  - — `electron/main.ts`

- **Production build was broken (`tsc` failure)**
  - `automation.ts` referenced `payload.closeTracker`, which was missing
    from the `StartPayload` type, breaking `npm run build`. Added the
    optional `closeTracker?: boolean` field.
  - — `electron/core/types.ts`

- **App version was stale in the UI**
  - `APP_VERSION` was still `v1.0.0` in the footer. Bumped to `v1.0.7` and
    synced `package.json` to `1.0.7`.
  - — `src/constants/app.constants.ts`, `package.json`

---

## [1.0.6] — 2026-06-25

### Fixed

- **Post-Stop Options not visible during an active run**
  - Close Upwork and Shutdown checkboxes were `disabled` while automation was
    running, which faded them to 40% opacity and made checked choices hard to see.
  - Post-stop options are now **read-only** during countdown and running states:
    checked values stay fully visible, but cannot be changed mid-run.
  - Choices are **snapshotted when Start is pressed** (`lockedPostStopOptions`)
    so the UI always reflects what will run on stop, not stale toggle state.
  - A small **"Locked for this run"** label appears in the Post-Stop Options
    section while automation is active.
  - — `src/components/ui/Checkbox.tsx` (`readOnly` prop); `src/App.tsx`

---

## [1.0.5] — 2026-06-25

### Fixed

- **macOS crash: `Failed to load image from path '.../icon.ico'`**
  - `getWindowsWindowIcon()` was returning a `.ico` path on all platforms. On
    macOS, `BrowserWindow.setIcon()` cannot load `.ico` files and threw an uncaught
    exception in the `ready-to-show` handler.
  - `getWindowsWindowIcon()` now returns a path **only on Windows** (`win32`).
  - macOS/Linux use `icon.png` via `getAppIcon()` / `getAppIconPath()`.
  - Added `setWindowIconSafe()` in `electron/main.ts` — wraps `setIcon()` in
    try/catch and loads path strings via `nativeImage.createFromPath()` first.
  - Icon candidate order on macOS now prefers `.png` before `.ico` in all search
    paths (dev, packaged, and asar fallback).
  - — `electron/core/app-icon.ts`, `electron/main.ts`

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
