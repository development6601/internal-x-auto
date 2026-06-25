"""
Signal handling for InternalX automation scripts.

Registers SIGTERM, SIGINT, and (on Windows) SIGBREAK handlers so the
process exits cleanly when Electron sends a kill signal.  On Windows
Electron uses `taskkill /F` which is an instant terminate, so this
module is mainly useful for cross-platform correctness and unit tests.
"""

import signal
import sys

_running: bool = True


def _stop_handler(signum: int, frame) -> None:  # noqa: ANN001, ARG001
    global _running
    _running = False
    sys.exit(0)


def setup() -> None:
    """Register OS signal handlers.  Call once at script startup."""
    signal.signal(signal.SIGTERM, _stop_handler)
    signal.signal(signal.SIGINT, _stop_handler)
    # SIGBREAK = Ctrl+Break on Windows console
    if hasattr(signal, 'SIGBREAK'):
        signal.signal(signal.SIGBREAK, _stop_handler)  # type: ignore[attr-defined]


def is_running() -> bool:
    """Return True while the script should keep its main loop running."""
    return _running
