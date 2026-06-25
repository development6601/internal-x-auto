# Python Prerequisites — Setup & Verification

This guide explains how the app finds `scripts/requirements.txt`, installs Python packages, and how to verify everything works on **Windows** and **macOS**.

---

## Expected layout

```
auto-evetns/
├── scripts/
│   ├── requirements.txt    ← required
│   ├── basic_mode.py
│   ├── advanced_mode.py
│   └── lib/
└── electron/scripts/       ← platform helpers (.ps1 / .applescript)
```

The Electron main process resolves `scripts/` in this order until `requirements.txt` is found:

1. `<project-root>/scripts` (dev — `npm run dev`)
2. `<app-resources>/scripts` (packaged build)
3. `<project-root>/dist-electron/scripts` (local production build)
4. Paths relative to the bundled `main.js` location

---

## Quick verification (both OS)

### 1. Confirm `requirements.txt` exists

**Windows (PowerShell):**

```powershell
Test-Path .\scripts\requirements.txt
```

**macOS (Terminal):**

```bash
test -f scripts/requirements.txt && echo "OK"
```

Expected: file exists at `scripts/requirements.txt`.

### 2. Confirm Python is on PATH

**Windows:**

```powershell
python --version
```

**macOS:**

```bash
python3 --version
```

### 3. Start the app with dev logging

1. Copy `.env.example` → `.env`
2. Set `DEV_LOG=true`
3. Run `npm run dev`
4. Open the **Dev Log** panel in the app

Expected dev log lines:

```
[INFO] Scripts dir resolved: <path-to-project>/scripts
[INFO] Checking Python prerequisites...
[INFO] Prerequisites check: missing modules — pyautogui, keyboard
```

If packages are already installed:

```
[INFO] Prerequisites check: all requirements met
```

### 4. Install prerequisites from the UI

1. Click the prerequisites / requirements button when status shows missing packages
2. Watch Dev Log for live `pip:` output
3. On success:

```
[INFO] Python prerequisites installed successfully
```

---

## Manual install (fallback)

If in-app install fails, run from the **project root**:

**Windows:**

```powershell
python -m pip install -r scripts\requirements.txt --user
```

**macOS (Homebrew Python may need extra flag):**

```bash
python3 -m pip install -r scripts/requirements.txt --user --break-system-packages
```

### Verify imports

**Windows:**

```powershell
python -c "import pyautogui, keyboard; print('OK')"
```

**macOS:**

```bash
python3 -c "import pyautogui, keyboard; print('OK')"
```

---

## Production build check

After `npm run build`, confirm copied assets:

**Windows:**

```powershell
Test-Path .\dist-electron\scripts\requirements.txt
Test-Path .\dist-electron\scripts\basic_mode.py
```

**macOS:**

```bash
ls dist-electron/scripts/requirements.txt dist-electron/scripts/basic_mode.py
```

Both files must exist before running a packaged build.

---

## Common issues

| Symptom | Cause | Fix |
|--------|--------|-----|
| `requirements.txt not found at: D:\Projects\scripts\...` | Wrong path resolution (fixed — use latest code) | Pull latest, restart `npm run dev` |
| Install hangs with no output | pip stdout pipe deadlock (fixed) | Pull latest, retry install |
| `externally-managed-environment` (macOS) | Homebrew PEP 668 | App retries with `--break-system-packages`; or install manually |
| `Python not found in PATH` | Python not installed | Install Python 3.x and ensure it is on PATH |

---

## Related files

- `electron/core/python-deps.ts` — path resolution, check, pip install
- `electron/vite-copy-resources.ts` — copies scripts into `dist-electron/scripts` on build
- `scripts/requirements.txt` — `pyautogui`, `keyboard`
