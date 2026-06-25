"""
Shared action library for InternalX automation scripts.

All pyautogui calls are wrapped in safe_action() so a single failing
call never crashes the main loop.  sleep_interruptible() checks the
is_running flag every POLL_INTERVAL so the process exits promptly on
SIGTERM (or Windows taskkill).

Platform notes
--------------
- Windows : Alt+Tab switches applications; Ctrl+Tab switches tabs/files.
- macOS   : Cmd+Tab switches applications; Ctrl+Tab switches tabs/files
            (Ctrl+Tab is natively supported in Chrome, Firefox, Cursor,
            VSCode, and most Electron apps on macOS).
"""

import random
import sys
import time
from typing import Callable, List

import pyautogui

# Disable the corner-of-screen failsafe — Electron owns the stop signal
pyautogui.FAILSAFE = False

# Polling granularity while sleeping (seconds).
# Keeps SIGTERM response latency under ~50 ms.
POLL_INTERVAL: float = 0.05

# Platform flag — resolved once at import time.
_IS_MACOS: bool = sys.platform == 'darwin'
_IS_WINDOWS: bool = sys.platform == 'win32'


# ── Individual actions ────────────────────────────────────────────────────────

def action_ctrl_tab() -> None:
    """Switch browser tab or editor file.

    Ctrl+Tab works on both Windows and macOS inside Chrome, Firefox,
    Cursor, VSCode, and most Electron apps.
    """
    pyautogui.hotkey('ctrl', 'tab')


def action_scroll_up() -> None:
    """Scroll up by a random number of clicks (1–10)."""
    pyautogui.scroll(random.randint(1, 10))


def action_scroll_down() -> None:
    """Scroll down by a random number of clicks (1–10)."""
    pyautogui.scroll(-random.randint(1, 10))


def action_arrow_up() -> None:
    pyautogui.press('up')


def action_arrow_down() -> None:
    pyautogui.press('down')


def action_page_up() -> None:
    pyautogui.press('pageup')


def action_page_down() -> None:
    pyautogui.press('pagedown')


def action_arrow_sequence() -> None:
    """Press up or down arrow 1–5 times in a row."""
    count = random.randint(1, 5)
    key = random.choice(['up', 'down'])
    for _ in range(count):
        pyautogui.press(key)


def action_app_switch() -> None:
    """Switch the active application window.  Advanced mode only.

    - Windows / Linux : Alt+Tab
    - macOS           : Cmd+Tab  (pyautogui key name: 'command')
    """
    if _IS_MACOS:
        pyautogui.hotkey('command', 'tab')
    else:
        pyautogui.hotkey('alt', 'tab')


# ── Action pools ──────────────────────────────────────────────────────────────

#: Actions available in Basic mode — no application switching
BASIC_POOL: List[Callable[[], None]] = [
    action_ctrl_tab,
    action_scroll_up,
    action_scroll_up,       # weighted: scrolling is common
    action_scroll_down,
    action_scroll_down,
    action_arrow_up,
    action_arrow_down,
    action_page_up,
    action_page_down,
    action_arrow_sequence,
    action_arrow_sequence,  # weighted: sequences look natural
]

#: Actions available in Advanced mode — everything + application switching
#: Uses Alt+Tab on Windows/Linux, Cmd+Tab on macOS.
ADVANCED_POOL: List[Callable[[], None]] = BASIC_POOL + [
    action_app_switch,
    action_app_switch,      # weighted: app switching is prominent
]


# ── Utilities ─────────────────────────────────────────────────────────────────

def safe_action(fn: Callable[[], None]) -> None:
    """
    Execute an action, swallowing any exception so the main loop never
    crashes from a single bad pyautogui call.
    """
    try:
        fn()
    except Exception as exc:
        print(f'[WARN] Action {fn.__name__} failed: {exc}', file=sys.stderr, flush=True)


def sleep_interruptible(
    min_s: float,
    max_s: float,
    is_running_fn: Callable[[], bool],
) -> None:
    """
    Sleep for a random duration in [min_s, max_s].

    Wakes up every POLL_INTERVAL to check is_running_fn so the process
    responds quickly to an external stop signal.
    """
    duration = random.uniform(min_s, max_s)
    deadline = time.monotonic() + duration
    while time.monotonic() < deadline and is_running_fn():
        time.sleep(POLL_INTERVAL)


def run_burst(
    action_pool: List[Callable[[], None]],
    interval_min: float,
    interval_max: float,
    duration_s: float,
    is_running_fn: Callable[[], bool],
) -> None:
    """
    Run randomly chosen actions from action_pool for approximately
    duration_s seconds, sleeping interval_min–interval_max between each.

    Exits early if is_running_fn() returns False.
    """
    deadline = time.monotonic() + duration_s
    while time.monotonic() < deadline and is_running_fn():
        safe_action(random.choice(action_pool))
        sleep_interruptible(interval_min, interval_max, is_running_fn)
