# Samsung Frame TV Setup Guide

Automated launch of the Morning Routine Timer on a Samsung Frame TV using **SmartThings Rules API** — runs entirely in the cloud, no Mac or scripts needed.

Real device IDs, IP address and rule IDs are kept in the local-only, gitignored `SAMSUNG_TV_REFERENCE.md` (not in this public repo). Before running the commands below, set:

```bash
export TV_DEVICE_ID='<SmartThings device ID>'
export ST_LOCATION_ID='<SmartThings location ID>'
export TV_IP='<TV LAN IP>'
```

## Hardware

| Component | Details |
|-----------|---------|
| TV | Samsung The Frame 55" |
| Resolution | 3840×2160 (4K) |
| OS | Tizen |
| IP / Device ID / Location ID | See local `SAMSUNG_TV_REFERENCE.md` |

## How It Works

```
┌──────────────────┐   SmartThings    ┌──────────────────┐
│ SmartThings Cloud │   Rules API     │ Samsung Frame TV  │
│  (scheduled rules │───────────────▶│ (Samsung Internet │
│   6:30am         │  switch on +    │  → routine timer) │
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

The TV schedule is morning-only. The previously configured 5:00 PM evening
launch rule has been removed from SmartThings; the morning rule remains enabled.
The evening routine remains available on the website.

## SmartThings API Commands

All commands require a Personal Access Token from https://account.smartthings.com/tokens.

### Token permissions and macOS Keychain

On the token creation page, select **Rules > See all rules** and
**Rules > Manage all rules** to inspect and remove scheduled rules. Select
**Locations > See all locations** if you need to discover the location ID.
Device inspection and control commands also need their corresponding
**Devices** permissions; device permissions alone do not grant rule access.

Store or replace the token in macOS Keychain, not in this repo or a `.env` file:

```bash
security add-generic-password -U -s smartthings-st-token -a "$USER" -w
```

Paste the token at the password prompt, not into the command itself. Load it
for API commands without printing it:

```bash
ST_TOKEN="$(security find-generic-password -s smartthings-st-token -a "$USER" -w)"
export ST_TOKEN
```

Stop if the Keychain lookup fails. Never enable shell tracing (`set -x`), print
the token, or paste it into chat or documentation. Replace expired tokens using
the same procedure, and revoke old tokens on the SmartThings token page.
Run `unset ST_TOKEN` when finished.

### Turn TV on
```bash
curl -s -X POST -H "Authorization: Bearer $ST_TOKEN" -H "Content-Type: application/json" \
  "https://api.smartthings.com/v1/devices/$TV_DEVICE_ID/commands" \
  -d '{"commands": [{"component": "main", "capability": "switch", "command": "on"}]}'
```

### Turn TV off
```bash
curl -s -X POST -H "Authorization: Bearer $ST_TOKEN" -H "Content-Type: application/json" \
  "https://api.smartthings.com/v1/devices/$TV_DEVICE_ID/commands" \
  -d '{"commands": [{"component": "main", "capability": "switch", "command": "off"}]}'
```

### Launch browser (opens to routine timer homepage)
```bash
curl -s -X POST -H "Authorization: Bearer $ST_TOKEN" -H "Content-Type: application/json" \
  "https://api.smartthings.com/v1/devices/$TV_DEVICE_ID/commands" \
  -d '{"commands": [{"component": "main", "capability": "custom.launchapp", "command": "launchApp", "arguments": ["org.tizen.browser"]}]}'
```

### Check TV status
```bash
curl -s -H "Authorization: Bearer $ST_TOKEN" \
  "https://api.smartthings.com/v1/devices/$TV_DEVICE_ID/status" \
  | python3 -c "import json,sys; d=json.load(sys.stdin)['components']['main']; print(f\"Power: {d['switch']['switch']['value']}\")"
```

### Check device health
```bash
curl -s -H "Authorization: Bearer $ST_TOKEN" \
  "https://api.smartthings.com/v1/devices/$TV_DEVICE_ID/health"
```

### List rules
```bash
curl -s -H "Authorization: Bearer $ST_TOKEN" \
  "https://api.smartthings.com/v1/rules?locationId=$ST_LOCATION_ID" \
  | python3 -c "import json,sys; [print(f\"  {r['name']}: {r['status']} (ID: {r['id']})\") for r in json.load(sys.stdin).get('items',[])]"
```

### Remove an unwanted scheduled launch

List rules first and inspect the intended rule before deleting it. Set
`RULE_ID_TO_REMOVE` to that rule's ID from the local private reference or API
response; never use the morning rule ID when removing the evening launch.

```bash
curl --fail-with-body --silent --show-error \
  -H "Authorization: Bearer $ST_TOKEN" \
  "https://api.smartthings.com/v1/rules/$RULE_ID_TO_REMOVE?locationId=$ST_LOCATION_ID"

# Only after confirming the rule name, scheduled time, and target device:
curl --fail-with-body --silent --show-error -X DELETE \
  -H "Authorization: Bearer $ST_TOKEN" \
  "https://api.smartthings.com/v1/rules/$RULE_ID_TO_REMOVE?locationId=$ST_LOCATION_ID"
```

List rules again to confirm the unwanted rule is absent and the morning rule
remains enabled with the same schedule and actions. Deleting a cloud launch
rule does not remove the evening routine from the website.

## Fallback: Direct REST API (no SmartThings)

If SmartThings cloud is down, the TV's local REST API still works on your LAN:

```bash
# Launch browser (no auth needed)
curl -k -X POST https://$TV_IP:8002/api/v2/applications/3202010022079

# Close browser
curl -k -X DELETE https://$TV_IP:8002/api/v2/applications/3202010022079

# Check TV info
curl -k https://$TV_IP:8002/api/v2/

# Check browser status
curl -k https://$TV_IP:8002/api/v2/applications/3202010022079
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
  "https://api.smartthings.com/v1/rules?locationId=$ST_LOCATION_ID"
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
     "https://api.smartthings.com/v1/rules?locationId=$ST_LOCATION_ID" \
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
             {"command": {"devices": ["'"$TV_DEVICE_ID"'"], "commands": [{"component":"main","capability":"switch","command":"on"}]}},
             {"sleep": {"duration": {"value": {"integer": 15}, "unit": "Second"}}},
             {"command": {"devices": ["'"$TV_DEVICE_ID"'"], "commands": [{"component":"main","capability":"custom.launchapp","command":"launchApp","arguments":[{"string":"org.tizen.browser"}]}]}}
           ]
         }
       }],
       "timeZoneId": "America/Denver"
     }'
   ```

7. **Do not create an evening rule** for the morning-only TV setup.

## Rule IDs

Current rule IDs are recorded in the local `SAMSUNG_TV_REFERENCE.md`. Use **List rules** above to look them up.
