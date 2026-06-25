"""
InternalX — Basic Automation Mode

Simulates browser/editor activity using keyboard shortcuts and scroll.
No Alt+Tab — only in-app navigation.

Actions  : Ctrl+Tab, Scroll up/down, Arrow keys, Page Up/Down (no app switching)
Interval : 0.2 s – 0.5 s per action
Idle     : 15 s – 25 s  (≈ 8 % of outer loop iterations)

Lifecycle is fully owned by Electron.  This script runs forever until
Electron kills it via taskkill (Windows) or SIGTERM.  --duration is
accepted as a CLI arg but intentionally ignored inside the script.
"""

import argparse
import random
import sys

from lib import actions, signals

# ── CLI args ──────────────────────────────────────────────────────────────────

parser = argparse.ArgumentParser(description='InternalX — basic automation script')
parser.add_argument('--mode', default='basic', choices=['basic', 'advanced'])
parser.add_argument('--duration', type=int, default=0,
                    help='Total duration in seconds (0 = indefinite). Informational only.')
parser.add_argument('--shutdown', default='false',
                    help='Whether shutdown is enabled post-stop. Informational only.')
args = parser.parse_args()

# ── Constants ─────────────────────────────────────────────────────────────────

# On each outer iteration, probability of entering each phase:
IDLE_PROBABILITY  = 0.08   #  8 % — short pause, no keyboard/mouse
SLOW_PROBABILITY  = 0.05   #  5 % — slow-paced action burst
# Remaining 87 % → fast-paced action burst

FAST_INTERVAL_MIN = 0.20   # seconds between actions (fast phase)
FAST_INTERVAL_MAX = 0.50
SLOW_INTERVAL_MIN = 4.0    # seconds between actions (slow phase)
SLOW_INTERVAL_MAX = 5.0
IDLE_MIN          = 15.0   # idle duration range (seconds)
IDLE_MAX          = 25.0

# Each burst runs for this long before the outer loop re-rolls (seconds)
BURST_DURATION_S  = 60.0

# ── Setup ─────────────────────────────────────────────────────────────────────

signals.setup()
print(
    f'[basic] started  mode={args.mode}  duration={args.duration}  shutdown={args.shutdown}',
    flush=True,
)

# ── Main loop ─────────────────────────────────────────────────────────────────

while signals.is_running():
    roll = random.random()

    if roll < IDLE_PROBABILITY:
        # ── Idle phase: pause activity entirely ───────────────────────────────
        idle_s = random.uniform(IDLE_MIN, IDLE_MAX)
        print(f'[basic] idle for {idle_s:.1f} s', flush=True)
        actions.sleep_interruptible(IDLE_MIN, IDLE_MAX, signals.is_running)

    elif roll < IDLE_PROBABILITY + SLOW_PROBABILITY:
        # ── Slow burst: same actions at a much slower cadence ─────────────────
        print('[basic] slow burst', flush=True)
        actions.run_burst(
            actions.BASIC_POOL,
            SLOW_INTERVAL_MIN,
            SLOW_INTERVAL_MAX,
            BURST_DURATION_S,
            signals.is_running,
        )

    else:
        # ── Fast burst: normal pace ───────────────────────────────────────────
        actions.run_burst(
            actions.BASIC_POOL,
            FAST_INTERVAL_MIN,
            FAST_INTERVAL_MAX,
            BURST_DURATION_S,
            signals.is_running,
        )

print('[basic] exiting cleanly', flush=True)
sys.exit(0)
