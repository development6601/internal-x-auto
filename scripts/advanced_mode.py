"""
InternalX — Advanced Automation Mode

Simulates full desktop activity including application switching (Alt+Tab).
Wider timing variance and more frequent/longer idle windows make the
pattern genuinely unpredictable.

Actions  : All Basic actions + Alt+Tab
Interval : 0.2 s – 5.0 s per action  (wider than Basic)
Idle     : 20 s – 60 s  (≈ 20 % of outer loop iterations, longer than Basic)

Lifecycle is fully owned by Electron.  This script runs forever until
Electron kills it via taskkill (Windows) or SIGTERM.
"""

import argparse
import random
import sys

from lib import actions, signals

# ── CLI args ──────────────────────────────────────────────────────────────────

parser = argparse.ArgumentParser(description='InternalX — advanced automation script')
parser.add_argument('--mode', default='advanced', choices=['basic', 'advanced'])
parser.add_argument('--duration', type=int, default=0,
                    help='Total duration in seconds (0 = indefinite). Informational only.')
parser.add_argument('--shutdown', default='false',
                    help='Whether shutdown is enabled post-stop. Informational only.')
args = parser.parse_args()

# ── Constants ─────────────────────────────────────────────────────────────────

# Advanced has more frequent idle phases than Basic
IDLE_PROBABILITY  = 0.20   # 20 % — idle (vs 8 % in Basic)
SLOW_PROBABILITY  = 0.05   #  5 % — slow burst
# Remaining 75 % → fast burst

FAST_INTERVAL_MIN = 0.20   # seconds (same floor as Basic)
FAST_INTERVAL_MAX = 5.00   # much wider ceiling than Basic (0.5)
SLOW_INTERVAL_MIN = 4.0
SLOW_INTERVAL_MAX = 5.0
IDLE_MIN          = 20.0   # longer idle windows than Basic (15)
IDLE_MAX          = 60.0

BURST_DURATION_S  = 60.0

# ── Setup ─────────────────────────────────────────────────────────────────────

signals.setup()
print(
    f'[advanced] started  mode={args.mode}  duration={args.duration}  shutdown={args.shutdown}',
    flush=True,
)

# ── Main loop ─────────────────────────────────────────────────────────────────

while signals.is_running():
    roll = random.random()

    if roll < IDLE_PROBABILITY:
        # ── Idle phase: longer and more frequent than Basic ───────────────────
        idle_s = random.uniform(IDLE_MIN, IDLE_MAX)
        print(f'[advanced] idle for {idle_s:.1f} s', flush=True)
        actions.sleep_interruptible(IDLE_MIN, IDLE_MAX, signals.is_running)

    elif roll < IDLE_PROBABILITY + SLOW_PROBABILITY:
        # ── Slow burst ────────────────────────────────────────────────────────
        print('[advanced] slow burst', flush=True)
        actions.run_burst(
            actions.ADVANCED_POOL,
            SLOW_INTERVAL_MIN,
            SLOW_INTERVAL_MAX,
            BURST_DURATION_S,
            signals.is_running,
        )

    else:
        # ── Fast burst: wider interval variance makes timing unpredictable ────
        actions.run_burst(
            actions.ADVANCED_POOL,
            FAST_INTERVAL_MIN,
            FAST_INTERVAL_MAX,
            BURST_DURATION_S,
            signals.is_running,
        )

print('[advanced] exiting cleanly', flush=True)
sys.exit(0)
