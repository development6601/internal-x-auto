# Changelog

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
