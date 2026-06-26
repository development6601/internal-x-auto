# Changelog

All notable changes to **InternalX** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.14] — 2026-06-26

**Author:** Manav Sonani

### Added

- **Screen Lock post-stop action**
  - Replaced **Close Upwork** with **Screen Lock** in the UI and tray.
  - Windows: `LockWorkStation` (same as Win+L). macOS: `CGSession -suspend`.
  - Standalone screen lock shows a **10-second countdown modal** before locking;
    user can cancel anytime.
  - — `src/App.tsx`, `electron/core/post-stop.ts`, `electron/core/ipc.ts`,
    `electron/preload.ts`, `src/types/electron-api.d.ts`

- **Shutdown + Screen Lock combined flow**
  - Selecting **Shutdown** auto-enables **Screen Lock**; shutdown cannot run
    without lock first.
  - After the 30-second shutdown countdown: lock screen, then shut down after
    1 second.
  - Windows shutdown uses detached `spawn` with `/f` so the command completes
    reliably (fixes `shutdown /s /t 0` failing under `execSync`).
  - — `src/App.tsx`, `electron/core/post-stop.ts`

- **Single-instance app lock**
  - Only one app instance can run; a second launch focuses the existing window
    instead of opening another.
  - — `electron/main.ts`

- **Tray menu enhancements**
  - **Quick Start** submenu: Start for 1 / 2 / 3 / 4 hours.
  - **After Timer Ends** checkboxes (Screen Lock, Shutdown) synced with the
    main UI.
  - Tray icon uses the real app icon shape, tinted green (running) or red
    (stopped) — icon colour only, not background.
  - — `electron/core/tray.ts`, `electron/core/types.ts`, `electron/core/ipc.ts`,
    `electron/preload.ts`, `src/App.tsx`

- **Accordion sections with header switches**
  - **Stop Timer** and **After Timer Ends** collapse/expand via a switch in the
    section header.
  - After Timer Ends switch is disabled until a stop timer is set; removed
    “Set a timer first” label in favour of the disabled switch.
  - — `src/App.tsx`, `src/components/ui/Switch.tsx`

### Changed

- Post-stop section heading renamed from **Post-Stop Options** to
  **After Timer Ends**.
  - — `src/App.tsx`

### Build

- Version bumped to `1.0.14` in `package.json` and `src/constants/app.constants.ts`.

---

## [1.0.13] — 2026-06-26

**Author:** Bhargav Tibadiya

### Changed

- **Application menu bar removed**
  - Removed the default File / Edit / View / Window menu on all platforms.
  - `Menu.setApplicationMenu(null)` clears the macOS menu bar; the window menu is
    hidden on Windows and Linux via `autoHideMenuBar` and `setMenu(null)`.
  - — `electron/main.ts`

- **Background-running notification on macOS**
  - Closing the window to tray now shows the same style of notification on
    **macOS** as on Windows, with platform-appropriate tray exit instructions.
  - — `electron/main.ts`

### Build

- Version bumped to `1.0.13` in `package.json` and `src/constants/app.constants.ts`.

---

## [1.0.12] — 2026-06-26

**Author:** Bhargav Tibadiya

### Changed

- **Window maximize disabled**
  - The maximize button is hidden and the window cannot be maximized, keeping the
    compact automation UI at its intended size.
  - — `electron/main.ts`

- **Close button hides to tray; Windows background notification**
  - Clicking the window **X** continues to hide the app to the system tray instead
    of quitting — automation and timers keep running in the background.
  - On **Windows only**, a notification is shown:
    *"Application is running in the background. To exit completely, right-click
    the tray icon and select Exit."*
  - The app no longer auto-quits on `window-all-closed` on Windows/Linux; full
    exit is only via the tray **Exit** menu item.
  - — `electron/main.ts`

### Build

- Version bumped to `1.0.12` in `package.json` and `src/constants/app.constants.ts`.

---

## [1.0.11] — 2026-06-26

**Author:** Bhargav Tibadiya

### Fixed

- **Screen lock skipped when both Screen Lock and Shutdown were enabled**
  - Combined post-stop flow now runs the **10-second screen lock countdown first**,
    locks the screen, and only then starts the **30-second shutdown countdown**.
    Previously shutdown ran both actions at the end of the shutdown timer with only
    a 1-second gap — on macOS the machine could power off before the lock screen
    appeared.
  - Shutdown countdown now triggers shutdown only; lock is never deferred to the
    final second.
  - Post-stop handlers use the **locked run snapshot** so the correct options apply
    even if UI state changes after stop.
  - macOS and Windows lock commands wait briefly after triggering so the lock UI
    can present before the next step.
  - — `src/App.tsx`, `electron/core/post-stop.ts`

### Build

- Version bumped to `1.0.11` in `package.json` and `src/constants/app.constants.ts`.

---

## [1.0.10] — 2026-06-26

**Author:** Bhargav Tibadiya

### Fixed

- **Sound effects silent in packaged EXE / DMG builds**
  - Absolute `/sound/...` paths resolve to the filesystem root under Electron's
    `file://` page load, so `HTMLAudioElement` could not find the MP3 files in
    production even though they were bundled via `extraResources`.
  - Preload now resolves absolute `file://` URLs from `resources/sound/`
    (packaged) or `public/sound/` (dev) and exposes them on `electronAPI.sound.urls`.
  - Vite `base` set to `./` so relative fallbacks work with `loadFile`, and a
    root-level build plugin copies sounds into `public/` before the renderer
    bundle is emitted.
  - — `electron/core/sound-paths.ts`, `electron/preload.ts`, `src/hooks/useSound.ts`,
    `vite.config.ts`, `electron/vite-copy-resources.ts`

### Build

- Version bumped to `1.0.10` in `package.json` and `src/constants/app.constants.ts`.

---

## [1.0.9] — 2026-06-26

**Author:** Bhargav Tibadiya

### Changed

- **Tray icon hover label shows pending time while running**
  - Replaced `InternalX — Running` / `InternalX — Stopped` with a status-first
    label: `Running - 2h 15m Pending` when a timer is set,
    `Running - No limit` when no timer is configured, and `Stopped` when idle.
  - The renderer syncs `remainingSeconds` to the main process over IPC so the
    tooltip updates every second while automation is active.
  - — `electron/core/tray.ts`, `electron/core/ipc.ts`, `electron/preload.ts`,
    `src/App.tsx`

### Build

- Version bumped to `1.0.9` in `package.json` and `src/constants/app.constants.ts`.

---

## [1.0.8] — 2026-06-26

**Author:** Bhargav Tibadiya

### Added

- **Sound effects for automation start, stop, and countdown**
  - `start-end.mp3` plays when the 10-second countdown finishes and automation
    actually starts, and again when automation stops (manual stop or timer expiry).
  - `second-beep.mp3` plays once per second during the 10-second pre-start
    countdown (not on button click).
  - New `useSound` hook (`src/hooks/useSound.ts`) handles playback via the
    Web Audio API (`HTMLAudioElement`).
  - Sound assets in `resources/sound/` are copied to `public/sound/` for the
    renderer and bundled via `extraResources` for packaged builds.
  - — `src/hooks/useSound.ts`, `src/App.tsx`, `electron/vite-copy-resources.ts`

### Changed

- **Removed Web Speech voice narration**
  - Dropped spoken announcements ("Automation starting in 10 seconds",
    "Automation started", "Automation stopped", shutdown warning) via the
    Web Speech API. Audio feedback is now **sound effects only**
    (`start-end.mp3` and `second-beep.mp3`).
  - Removed `src/hooks/useVoice.ts` and all `announce*` calls from `src/App.tsx`.

- **Theme mode simplified to light and dark only**
  - Removed the `system` option — the app no longer follows OS
    `prefers-color-scheme`.
  - Default theme is now **light** (was `system`).
  - The header toggle switches directly between light ↔ dark.
  - Legacy `system` values in `localStorage` migrate to light on next load.
  - — `src/hooks/useTheme.ts`, `src/App.tsx`, `tailwind.config.js`

### Build

- Version bumped to `1.0.8` in `package.json` and `src/constants/app.constants.ts`.

---

## [1.0.7] — 2026-06-26

**Author:** Bhargav Tibadiya

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

**Author:** Bhargav Tibadiya

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

**Author:** Bhargav Tibadiya

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

**Author:** Bhargav Tibadiya

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

**Author:** Bhargav Tibadiya

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

**Author:** Bhargav Tibadiya

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

**Author:** Bhargav Tibadiya

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

**Author:** Bhargav Tibadiya

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
