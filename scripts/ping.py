"""
Phase 1 validation script — ping.py

A minimal loop that proves Electron can spawn, read stdout, and kill this
process cleanly.  It does NOT touch keyboard or mouse input.

Usage (manual test):
    python scripts/ping.py --mode basic --duration 0 --shutdown false

Stop with Ctrl+C or let Electron send SIGTERM / taskkill.
"""

import argparse
import signal
import sys
import time

# ── Argument parsing ──────────────────────────────────────────────────────────

parser = argparse.ArgumentParser(description="InternalX Phase-1 ping script")
parser.add_argument("--mode", default="basic", choices=["basic", "advanced"])
parser.add_argument("--duration", type=int, default=0)
parser.add_argument("--shutdown", default="false")
args = parser.parse_args()

# ── Signal handling ───────────────────────────────────────────────────────────

_running = True


def _handle_signal(signum, frame):  # noqa: ARG001
    global _running
    _running = False


signal.signal(signal.SIGTERM, _handle_signal)
signal.signal(signal.SIGINT, _handle_signal)

# ── Main loop ─────────────────────────────────────────────────────────────────

print(
    f"[ping] started — mode={args.mode} duration={args.duration} shutdown={args.shutdown}",
    flush=True,
)

tick = 0
while _running:
    tick += 1
    print(f"[ping] alive #{tick}", flush=True)
    time.sleep(2)

print("[ping] exiting cleanly", flush=True)
sys.exit(0)
