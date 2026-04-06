# Samsung Frame TV Setup Guide

Automated launch of the Morning Routine Timer on a Samsung Frame TV using **SmartThings Rules API** — runs entirely in the cloud, no Mac or scripts needed.

## Hardware

| Component | Details |
|-----------|---------|
| TV | Samsung The Frame 55" (QN55LS03AAFXZA) |
| Resolution | 3840×2160 (4K) |
| OS | Tizen |
| IP | `192.168.1.49` (static) |
| SmartThings Device ID | `96d1604f-a1d4-8ce5-1497-6cdd9858b499` |
| SmartThings Location ID | `3174a5f1-dafc-4278-b270-65f17ef2bc4c` |

## How It Works

```
┌──────────────────┐   SmartThings    ┌──────────────────┐
│ SmartThings Cloud │   Rules API     │ Samsung Frame TV  │
│  (scheduled rules │───────────────▶│ (Samsung Internet │
│   6:30am & 5pm   │  switch on +    │  → routine timer) │
│   Mon-Fri)       │  launchApp      │                   │
└──────────────────┘                  └──────────────────┘
```

- SmartThings Rules trigger at scheduled times (cloud-based, no local device needed)
- Rule turns on the TV via `switch.on`, waits 15 seconds, then launches the browser via `custom.launchapp`
- Browser homepage is pre-set to the routine timer URL
- No Mac dependency — works even if your computer is off

## Schedule

| Rule | Time | Days | Purpose |
|------|------|------|---------|
| Morning Routine Timer | 6:30 AM | Monday–Friday | Morning routine |
| Evening Routine Timer | 5:00 PM | Monday–Friday | Evening routine |

## SmartThings API Commands

All commands require a Personal Access Token from https://account.smartthings.com/tokens

### Turn TV on
```bash
curl -s -X POST -H "Authorization: Bearer $ST_TOKEN" -H "Content-Type: application/json" \
  "https://api.smartthings.com/v1/devices/96d1604f-a1d4-8ce5-1497-6cdd9858b499/commands" \
  -d '{"commands": [{"component": "main", "capability": "switch", "command": "on"}]}'
```

### Turn TV off
```bash
curl -s -X POST -H "Authorization: Bearer $ST_TOKEN" -H "Content-Type: application/json" \
  "https://api.smartthings.com/v1/devices/96d1604f-a1d4-8ce5-1497-6cdd9858b499/commands" \
  -d '{"commands": [{"component": "main", "capability": "switch", "command": "off"}]}'
```

### Launch browser (opens to routine timer homepage)
```bash
curl -s -X POST -H "Authorization: Bearer $ST_TOKEN" -H "Content-Type: application/json" \
  "https://api.smartthings.com/v1/devices/96d1604f-a1d4-8ce5-1497-6cdd9858b499/commands" \
  -d '{"commands": [{"component": "main", "capability": "custom.launchapp", "command": "launchApp", "arguments": ["org.tizen.browser"]}]}'
```

### Check TV status
```bash
curl -s -H "Authorization: Bearer $ST_TOKEN" \
  "https://api.smartthings.com/v1/devices/96d1604f-a1d4-8ce5-1497-6cdd9858b499/status" \
  | python3 -c "import json,sys; d=json.load(sys.stdin)['components']['main']; print(f\"Power: {d['switch']['switch']['value']}\")"
```

### Check device health
```bash
curl -s -H "Authorization: Bearer $ST_TOKEN" \
  "https://api.smartthings.com/v1/devices/96d1604f-a1d4-8ce5-1497-6cdd9858b499/health"
```

### List rules
```bash
curl -s -H "Authorization: Bearer $ST_TOKEN" \
  "https://api.smartthings.com/v1/rules?locationId=3174a5f1-dafc-4278-b270-65f17ef2bc4c" \
  | python3 -c "import json,sys; [print(f\"  {r['name']}: {r['status']} (ID: {r['id']})\") for r in json.load(sys.stdin).get('items',[])]"
```

## Fallback: Direct REST API (no SmartThings)

If SmartThings cloud is down, the TV's local REST API still works on your LAN:

```bash
# Launch browser (no auth needed)
curl -k -X POST https://192.168.1.49:8002/api/v2/applications/3202010022079

# Close browser
curl -k -X DELETE https://192.168.1.49:8002/api/v2/applications/3202010022079

# Check TV info
curl -k https://192.168.1.49:8002/api/v2/

# Check browser status
curl -k https://192.168.1.49:8002/api/v2/applications/3202010022079
```

Note: The local REST API cannot turn the TV on from standby — only SmartThings or Wake-on-LAN can do that.

## Samsung TV API Notes

### What works via SmartThings
| Action | Capability | Command | Notes |
|--------|-----------|---------|-------|
| Turn on | `switch` | `on` | Works from standby (supportsPowerOnByOcf: true) |
| Turn off | `switch` | `off` | |
| Launch browser | `custom.launchapp` | `launchApp` with `"org.tizen.browser"` | Opens to pre-set homepage |
| Switch input | `samsungvd.mediaInputSource` | `setInputSource` with `"dtv"` or `"HDMI4"` | |

### What works via local REST API (no auth)
| Action | Method | Endpoint |
|--------|--------|----------|
| Launch/close browser | POST/DELETE | `/api/v2/applications/3202010022079` |
| Check TV info | GET | `/api/v2/` |
| Check browser status | GET | `/api/v2/applications/3202010022079` |

### What doesn't work
- **Passing a URL to the browser** — neither SmartThings nor REST API support deep-linking. Set the homepage manually instead.
- **`open_browser()` via WebSocket** — silently fails on this Frame TV model

## Troubleshooting

### TV shows as OFFLINE in SmartThings
1. Open the SmartThings phone app and check the TV's connection
2. On the TV: Settings → General → External Device Manager → SmartThings
3. Ensure the TV is connected to WiFi

### Browser launches but doesn't show routine timer
The browser homepage may have been reset. On the TV browser, navigate to `https://samqbush.github.io/morning-routine-coun/` and set it as the homepage.

### TV turns on but browser doesn't launch
The 15-second delay in the Rule may not be enough. Check SmartThings rule execution logs. As a workaround, manually run the launch browser command.

### Rule not firing at scheduled time
```bash
# Verify rules are enabled
curl -s -H "Authorization: Bearer $ST_TOKEN" \
  "https://api.smartthings.com/v1/rules?locationId=3174a5f1-dafc-4278-b270-65f17ef2bc4c"
```

Check that rules show `"status": "Enabled"`. If rules were deleted, recreate them (see Initial Setup below).

## Initial Setup (Reproduce From Scratch)

1. **Get a SmartThings Personal Access Token** from https://account.smartthings.com/tokens (needs device access scopes)

2. **Ensure TV is connected** to SmartThings (check SmartThings phone app → TV → online)

3. **Set browser homepage** on the TV to `https://samqbush.github.io/morning-routine-coun/`

4. **Find your TV device ID:**
   ```bash
   curl -s -H "Authorization: Bearer $ST_TOKEN" \
     "https://api.smartthings.com/v1/devices" | python3 -c "
   import json, sys
   for d in json.load(sys.stdin)['items']:
       if 'Frame' in d.get('label',''):
           print(d['deviceId'])"
   ```

5. **Find your location ID:**
   ```bash
   curl -s -H "Authorization: Bearer $ST_TOKEN" \
     "https://api.smartthings.com/v1/locations" | python3 -m json.tool
   ```

6. **Create the morning rule** (6:30 AM Mon-Fri, 390 min from midnight):
   ```bash
   curl -s -X POST -H "Authorization: Bearer $ST_TOKEN" -H "Content-Type: application/json" \
     "https://api.smartthings.com/v1/rules?locationId=LOCATION_ID" \
     -d '{
       "name": "Morning Routine Timer",
       "actions": [{
         "every": {
           "specific": {
             "reference": "Midnight",
             "offset": { "value": { "integer": 390 }, "unit": "Minute" },
             "daysOfWeek": ["Mon","Tue","Wed","Thu","Fri"],
             "timeZoneId": "America/Denver"
           },
           "actions": [
             {"command": {"devices": ["TV_DEVICE_ID"], "commands": [{"component":"main","capability":"switch","command":"on"}]}},
             {"sleep": {"duration": {"value": {"integer": 15}, "unit": "Second"}}},
             {"command": {"devices": ["TV_DEVICE_ID"], "commands": [{"component":"main","capability":"custom.launchapp","command":"launchApp","arguments":[{"string":"org.tizen.browser"}]}]}}
           ]
         }
       }],
       "timeZoneId": "America/Denver"
     }'
   ```

7. **Create the evening rule** (5:00 PM Mon-Fri, 1020 min from midnight):
   Same as above but with `"integer": 1020` for the offset and name "Evening Routine Timer".

## Rule IDs (Current)

| Rule | ID |
|------|----|
| Morning Routine Timer | `67fb3301-e40d-464b-88ea-ed6617b14e4f` |
| Evening Routine Timer | `e953117c-8057-4ef8-b4c0-b6679eb2775b` |
