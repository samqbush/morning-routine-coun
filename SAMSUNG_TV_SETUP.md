# Samsung Frame TV Setup Guide

Automated launch of the Morning Routine Timer on a Samsung Frame TV using the Samsung Smart TV WebSocket/REST API and macOS `launchd`.

## Hardware

| Component | Details |
|-----------|---------|
| TV | Samsung The Frame 55" (QN55LS03AAFXZA) |
| Resolution | 3840×2160 (4K) |
| OS | Tizen |
| IP | `192.168.1.49` (static) |
| WiFi MAC | `10:2b:41:bf:61:29` |
| Mac | macOS, same network |

## How It Works

```
┌──────────────┐   REST API (POST)   ┌──────────────────┐
│   Your Mac   │────────────────────▶│ Samsung Frame TV  │
│  (launchd    │   launch browser    │ (Samsung Internet │
│   6:30am &   │                     │  → routine timer) │
│   5:00pm)    │                     │                   │
└──────────────┘                     └──────────────────┘
```

- macOS `launchd` triggers a Python script at scheduled times
- Script calls Samsung TV REST API to launch the built-in browser
- Browser homepage is pre-set to the routine timer URL
- No token/auth needed for the REST API browser launch

## Prerequisites

- Python virtual environment at `.venv/` in the project root
- `samsungtvws[cli]` and `wakeonlan` installed in the venv
- Samsung Internet browser homepage set to `https://samqbush.github.io/morning-routine-coun/`
- TV setting: **Device Connection Manager → Access Notification → Allow**

## Files

| File | Purpose |
|------|---------|
| `scripts/launch_routine.py` | Python script — handles art mode, browser launch, status |
| `scripts/morning-routine-tv.sh` | Shell wrapper — activates venv and runs Python script |
| `scripts/.tv_token` | Stored WebSocket auth token (gitignored) |
| `scripts/morning-routine.log` | Script log file (gitignored) |
| `~/Library/LaunchAgents/com.samqbush.morning-routine.plist` | macOS launchd scheduler |

## Commands

### Manual launch
```bash
./scripts/morning-routine-tv.sh
```

### Close the browser
```bash
./scripts/morning-routine-tv.sh --close
```

### Check TV and browser status
```bash
./scripts/morning-routine-tv.sh --status
```

### Save a new auth token (if token expires)
```bash
./scripts/morning-routine-tv.sh --save-token <TOKEN>
```

To get a fresh token, delete all devices from the TV's Device Connection Manager, then:
```bash
source .venv/bin/activate
python3 -c "
from samsungtvws import SamsungTVWS
tv = SamsungTVWS(host='192.168.1.49', port=8002, timeout=30, name='MorningRoutine')
tv.open()
print('Token:', tv.token)
tv.close()
"
```
Approve the popup on the TV, then save the printed token.

## Schedule

The launchd job runs at:

| Time | Days | Purpose |
|------|------|---------|
| 6:30 AM | Monday–Friday | Morning routine |
| 5:00 PM | Monday–Friday | Evening routine |

### Managing the schedule

```bash
# View current schedule
cat ~/Library/LaunchAgents/com.samqbush.morning-routine.plist

# Unload (disable)
launchctl unload ~/Library/LaunchAgents/com.samqbush.morning-routine.plist

# Reload after editing
launchctl load ~/Library/LaunchAgents/com.samqbush.morning-routine.plist

# Verify it's loaded
launchctl list | grep morning-routine
```

### Ensure Mac is awake at scheduled time

```bash
sudo pmset repeat wakeorpoweron MTWRF 06:25:00
```

If your Mac is asleep at the scheduled time, `launchd` will run the job when it wakes up. If it's shut down, the job is skipped.

## Samsung TV API Notes

### What works

| Method | API | Token needed? |
|--------|-----|---------------|
| Launch/close browser | REST (`POST`/`DELETE` `/api/v2/applications/3202010022079`) | No |
| Check TV info | REST (`GET /api/v2/`) | No |
| Check browser status | REST (`GET /api/v2/applications/3202010022079`) | No |
| Send remote keys (mute, source, etc.) | WebSocket | Yes |
| Turn off Art Mode | WebSocket | Yes |

### What doesn't work

- **`open_browser()` with URL** — the WebSocket `open_browser` command exits cleanly but doesn't actually open the browser on this model
- **`run_app()` with URL parameter** — browser ignores the URL deep link
- **Passing URL via REST POST body** — accepted but ignored

### Workaround

Set the browser homepage manually on the TV to the routine timer URL. The REST POST launch then always opens to the correct page.

### Browser app ID

The Samsung Internet browser app ID on this TV is `3202010022079`. Found via:
```bash
curl -sk https://192.168.1.49:8002/api/v2/applications/3202010022079
```

## Troubleshooting

### Browser doesn't launch
1. TV might be on an HDMI input — use `--status` to check power state
2. Try closing first: `./scripts/morning-routine-tv.sh --close`, wait 3 seconds, then launch again
3. Check logs: `cat scripts/morning-routine.log`

### Token expired / unauthorized errors
WebSocket commands (art mode, remote keys) need a valid token. REST API commands (browser launch) do not. If you need WebSocket features, get a fresh token (see Commands section above).

### TV is in Art Mode
The script automatically attempts to turn off Art Mode before launching. If it fails, press the power button on the remote to switch to TV mode, then retry.

### launchd job not running
```bash
# Check if loaded
launchctl list | grep morning-routine

# Check logs
cat /tmp/morning-routine-launchd.log

# Reload
launchctl unload ~/Library/LaunchAgents/com.samqbush.morning-routine.plist
launchctl load ~/Library/LaunchAgents/com.samqbush.morning-routine.plist
```

## Initial Setup (Reproduce From Scratch)

1. **Create Python venv and install dependencies:**
   ```bash
   cd /Users/samquakenbush/Code/morning-routine-coun
   python3 -m venv .venv
   source .venv/bin/activate
   pip install "samsungtvws[cli]" wakeonlan
   ```

2. **Assign a static IP** to the TV in your router (currently `192.168.1.49`)

3. **Set browser homepage** on the TV to `https://samqbush.github.io/morning-routine-coun/`

4. **Configure TV permissions:** Settings → General → External Device Manager → Device Connection Manager → Access Notification → Allow

5. **Get initial auth token** (see Commands section), save with `--save-token`

6. **Load launchd scheduler:**
   ```bash
   launchctl load ~/Library/LaunchAgents/com.samqbush.morning-routine.plist
   ```

7. **Schedule Mac wake** (optional):
   ```bash
   sudo pmset repeat wakeorpoweron MTWRF 06:25:00
   ```
