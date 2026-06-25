# InternalX

**InternalX** is a cross-platform desktop app for starting, stopping, and managing keyboard/mouse automation scripts. It runs in the system tray, supports timed or indefinite sessions, and handles post-stop actions such as closing the Upwork desktop app or shutting down the system.

Built with **Electron**, **React**, **TypeScript**, and **Python** (`pyautogui`).

---

## Features

- **Basic mode** — tab/file cycling (`Ctrl+Tab`), scroll, and arrow keys (no app switching)
- **Advanced mode** — all Basic actions plus application switching (`Alt+Tab` on Windows, `Cmd+Tab` on macOS)
- **Stop timer** — run for a set duration or indefinitely until manually stopped
- **Post-stop options**
  - Close Upwork Desktop App (graceful close → force kill)
  - System shutdown with a 30-second cancellable countdown
- **System tray** — start, stop, and exit from the tray icon
- **Auto-launch** at OS login (production builds)
- **Python prerequisites** — in-app check and one-click pip install
- **Activity log** — persistent log with export to file
- **Voice announcements** — optional spoken status updates via Web Speech API

---

## Requirements

| Requirement | Version / notes |
|-------------|-----------------|
| Node.js | 18+ recommended |
| npm | Comes with Node.js |
| Python | 3.x on PATH (`python` or `python3`) |
| pip package | `pyautogui` (installed via the app or manually) |

**Windows:** Windows 10/11 (x64)  
**macOS:** macOS 10.15+ (DMG must be built on a Mac)

---

## Quick start (development)

```bash
# Clone the repository
git clone https://github.com/development6601/internal-x-auto.git
cd internal-x-auto

# Install dependencies
npm install

# Optional: enable the developer log panel
cp .env.example .env
# Set DEV_LOG=true in .env

# Run in development mode
npm run dev
```

On first run, use the **prerequisites** button in the app header to install `pyautogui` if it is missing.

> **Note:** In dev mode (`npm run dev`), the Windows taskbar may still show the Electron icon because the process is `electron.exe`. Use a packaged build to verify the final app icon.

---

## Build installers

```bash
# Windows installer (.exe)
npm run dist:win

# macOS disk image (.dmg) — run on a Mac only
npm run dist:mac

# Both platforms (macOS build host required for .dmg)
npm run dist
```

Output is written to `release/`:

| Platform | Artifact |
|----------|----------|
| Windows | `release/InternalX-Setup-<version>.exe` |
| macOS | `release/InternalX-<version>.dmg` |

### Releasing a new version

1. Update `"version"` in `package.json`
2. Add an entry to `CHANGELOG.md`
3. Run the build command for your target platform(s)

---

## npm scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Electron + Vite dev server with hot reload |
| `npm run build` | Type-check and build renderer + main process |
| `npm run dist:win` | Build Windows NSIS installer |
| `npm run dist:mac` | Build macOS DMG |
| `npm run dist` | Build for the current platform |
| `npm run pack` | Build unpacked app dir (no installer) |
| `npm run generate:icons` | Regenerate `resources/icon.ico` and `icon.png` from SVG |
| `npm run test` | Run Vitest in watch mode |
| `npm run test:run` | Run Vitest once |

---

## Project structure

```
InternalX-Auto/
├── electron/              # Electron main process
│   ├── main.ts            # App entry, window, lifecycle
│   ├── preload.ts         # IPC bridge (contextBridge)
│   ├── afterpack.cjs      # Windows EXE icon embedding (rcedit)
│   └── core/              # IPC, automation, tray, Python deps, post-stop
├── src/                   # React renderer (UI)
├── scripts/               # Python automation scripts
│   ├── basic_mode.py
│   ├── advanced_mode.py
│   └── lib/               # Shared actions and signal handling
├── resources/             # App icons (generated from public/app-icon.svg)
├── public/                # Static assets
├── docs/                  # Requirements, dev guides, test plans
├── CHANGELOG.md           # Version history
└── release/               # Build output (gitignored)
```

---

## Platform notes

### Windows

- Application switching uses `Alt+Tab` (switches to the last-used app only)
- Tab/file cycling holds `Ctrl` and presses `Tab` 1–5 times per action
- Upwork is closed via PowerShell / `taskkill`
- Shutdown uses `shutdown /s /t 0`

### macOS

- Application switching uses `Cmd+Tab`
- **Accessibility permission** is required for `pyautogui` — grant it in **System Settings → Privacy & Security → Accessibility**
- Upwork is closed via AppleScript / `killall`
- Shutdown uses AppleScript via System Events
- DMG builds must be run on macOS (`npm run dist:mac`)

---

## Python prerequisites

See [docs/development/python-prerequisites.md](docs/development/python-prerequisites.md) for manual install steps, path resolution, and troubleshooting.

Manual install fallback:

```bash
# Windows
python -m pip install -r scripts/requirements.txt --user

# macOS (Homebrew Python may need --break-system-packages)
python3 -m pip install -r scripts/requirements.txt --user --break-system-packages
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [CHANGELOG.md](CHANGELOG.md) | Release notes and version history |
| [docs/requirements/REQUIREMENTS.md](docs/requirements/REQUIREMENTS.md) | Product requirements |
| [docs/development/python-prerequisites.md](docs/development/python-prerequisites.md) | Python setup and verification |
| [docs/plans/test-cases.md](docs/plans/test-cases.md) | Manual test checklist |

---

## License

Private — internal use only.
