"""Measure the soundtrack: loudness per bar/beat, bass gaps, first/last sound.

Needs only Python 3 and ffmpeg on PATH (no numpy). Run from the repo root:
    python docs/launch-film/tools/measure_audio.py audio/testing.mp3
"""
import array, math, subprocess, sys

SR, HOP = 12000, 120                      # 100 analysis frames per second
path = sys.argv[1]


def decode(af=None):
    cmd = ["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR)]
    cmd += (["-af", af] if af else []) + ["-f", "s16le", "-"]
    a = array.array("h")
    a.frombytes(subprocess.run(cmd, capture_output=True, check=True).stdout)
    return a


def db_env(x):                            # RMS level of each 10 ms frame, in dB
    out = []
    for i in range(len(x) // HOP):
        s = sum(v * v for v in x[i * HOP:(i + 1) * HOP])
        out.append(20 * math.log10(math.sqrt(s / HOP) / 32768 + 1e-6))
    return out


bands = {"full": None, "low": "lowpass=f=150,lowpass=f=150",
         "mid": "highpass=f=300,lowpass=f=3000", "high": "highpass=f=6000,highpass=f=6000"}
B = {k: db_env(decode(af)) for k, af in bands.items()}
N = min(len(v) for v in B.values())


def mean(k, a, b):
    s = B[k][int(a * 100):int(b * 100)]
    return sum(s) / len(s)


full = B["full"]
print("first sound above -45 dB:", next(i for i, v in enumerate(full) if v > -45) / 100)
print("last  sound above -45 dB:", max(i for i, v in enumerate(full) if v > -45) / 100)
print("last  sound above -60 dB:", max(i for i, v in enumerate(full) if v > -60) / 100)

# bass gaps: low band under -50 dB for >= 0.12 s (the 'breath' before each downbeat)
run = None
for i, v in enumerate(B["low"] + [0]):
    if v < -50 and i > 70:
        run = i if run is None else run
    else:
        if run is not None and i - run >= 12:
            print(f"bass gap {run / 100:.2f}-{i / 100:.2f} s -> bass back at {i / 100:.2f}")
        run = None

# bar table on the measured grid (first downbeat 2.510, final downbeat 72.041, 21 bars between)
BAR = (72.041 - 2.510) / 21
print(f"bar {BAR:.4f} s, beat {BAR / 4:.4f} s, tempo {240 / BAR:.2f} BPM (half-time feel; 2x = {480 / BAR:.1f})")
t = 2.510
while t < N / 100 - 0.5:
    e = min(t + BAR, N / 100)
    print(f"{t:6.3f}  full {mean('full', t, e):6.1f}  low {mean('low', t, e):6.1f}  "
          f"mid {mean('mid', t, e):6.1f}  high {mean('high', t, e):6.1f} dB")
    t += BAR
