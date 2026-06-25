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

# ── macOS: suppress Dock icon BEFORE pyautogui import ────────────────────────
# pyautogui on macOS triggers creation of an NSApplication instance via
# the Quartz/pyobjc bridge.  Once NSApplication is live it shows the Python
# rocket icon in the Dock by default.  Setting the activation policy to
# NSApplicationActivationPolicyProhibited (2) before the import hides it.

if sys.platform == 'darwin':
    try:
        import ctypes
        import ctypes.util

        _libobjc = ctypes.cdll.LoadLibrary('/usr/lib/libobjc.dylib')
        _libobjc.objc_getClass.restype       = ctypes.c_void_p
        _libobjc.sel_registerName.restype    = ctypes.c_void_p
        _libobjc.objc_msgSend.restype        = ctypes.c_void_p
        _libobjc.objc_msgSend.argtypes       = [ctypes.c_void_p, ctypes.c_void_p]

        # Build a variant of objc_msgSend that accepts a long (NSInteger) arg
        _msgSend_long = ctypes.CFUNCTYPE(
            ctypes.c_void_p,    # return
            ctypes.c_void_p,    # self
            ctypes.c_void_p,    # SEL
            ctypes.c_long,      # NSApplicationActivationPolicy
        )(_libobjc.objc_msgSend)

        _NSApp_class       = _libobjc.objc_getClass(b'NSApplication')
        _sharedApplication = _libobjc.sel_registerName(b'sharedApplication')
        _setPolicy         = _libobjc.sel_registerName(b'setActivationPolicy:')

        _nsapp = _libobjc.objc_msgSend(_NSApp_class, _sharedApplication)
        _msgSend_long(_nsapp, _setPolicy, 2)   # 2 = NSApplicationActivationPolicyProhibited
    except Exception:
        pass   # Non-fatal — Dock icon may appear but automation still works

import pyautogui

# Disable the corner-of-screen failsafe — Electron owns the stop signal
pyautogui.FAILSAFE = False

# Polling granularity while sleeping (seconds).
# Keeps SIGTERM response latency under ~50 ms.
POLL_INTERVAL: float = 0.05

# Platform flags — resolved once at import time.
_IS_MACOS:   bool = sys.platform == 'darwin'
_IS_WINDOWS: bool = sys.platform == 'win32'


# ── Individual actions ────────────────────────────────────────────────────────

def action_ctrl_tab_multi() -> None:
    """Hold Ctrl and press Tab 1–5 times to cycle through multiple tabs/files.

    Pressing Tab multiple times with Ctrl held advances through several
    open tabs or editor files in one action — avoiding the back-and-forth
    between only two files that a single Ctrl+Tab produces.

    Works on both Windows and macOS (Chrome, Firefox, Cursor, VS Code).
    """
    count = random.randint(1, 5)
    try:
        pyautogui.keyDown('ctrl')
        for i in range(count):
            pyautogui.press('tab')
            if i < count - 1:
                time.sleep(random.uniform(0.05, 0.18))
    finally:
        pyautogui.keyUp('ctrl')


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
    """Switch to the most-recently-used (MRU) previous application.

    Presses the modifier (Alt/Cmd) down, taps Tab once, then immediately
    releases the modifier.  Releasing before the OS timeout means the
    app-switcher overlay is never shown — the focus jumps straight to the
    LAST used app, not an arbitrary position in the switcher list.

    Effect in practice
    ------------------
    Because each call flips to the single previous app and nothing else,
    repeated calls produce an exact back-and-forth between exactly two
    apps (e.g. VS Code ↔ Chrome).  Any other open app (e.g. Spotify)
    stays in the background as long as the user ensures VS Code and
    Chrome are the two most-recently-focused apps before starting.

    Platform
    --------
    - Windows / Linux : Alt   + Tab (one tap)
    - macOS           : Cmd   + Tab (one tap)
    """
    try:
        if _IS_MACOS:
            pyautogui.keyDown('command')
            pyautogui.press('tab')
            pyautogui.keyUp('command')
        else:
            pyautogui.keyDown('alt')
            pyautogui.press('tab')
            pyautogui.keyUp('alt')
    finally:
        # Give the OS window manager time to complete the focus transfer
        # before the next action fires.  Without this, a fast-following
        # Ctrl+Tab could land in the wrong window.
        time.sleep(0.35)


# ── Action pools ──────────────────────────────────────────────────────────────

#: Actions available in Basic mode — tab/file cycling only, no app switching.
#: action_ctrl_tab_multi appears 4× to make tab cycling the dominant action.
BASIC_POOL: List[Callable[[], None]] = [
    action_ctrl_tab_multi,
    action_ctrl_tab_multi,  # weighted: tab cycling is the primary activity
    action_ctrl_tab_multi,
    action_ctrl_tab_multi,
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

#: Advanced pool = everything in Basic + app switching.
#: action_app_switch appears once so it is roughly 1-in-15 (~7 %) of actions,
#: keeping tab/file cycling dominant and app switching occasional.
#: Uses Alt+Tab on Windows/Linux, Cmd+Tab on macOS.
ADVANCED_POOL: List[Callable[[], None]] = BASIC_POOL + [
    action_app_switch,
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
