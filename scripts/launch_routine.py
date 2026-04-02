#!/usr/bin/env python3
"""
Launch the Morning Routine Timer on Samsung Frame TV.

Handles:
  1. Waking TV from Art Mode (if active)
  2. Launching the Samsung Internet browser via REST API
     (homepage is pre-set to the routine timer URL)

Usage:
  python launch_routine.py              # launch with defaults
  python launch_routine.py --close      # close the browser
  python launch_routine.py --status     # check TV/browser status
"""

import argparse
import json
import logging
import sys
import time
from pathlib import Path

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

TV_IP = "192.168.1.49"
TV_PORT = 8002
BROWSER_APP_ID = "3202010022079"
TOKEN_FILE = Path(__file__).parent / ".tv_token"
BASE_URL = f"https://{TV_IP}:{TV_PORT}"
LOG_FILE = Path(__file__).parent / "morning-routine.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)


def load_token() -> str | None:
    if TOKEN_FILE.exists():
        return TOKEN_FILE.read_text().strip()
    return None


def save_token(token: str) -> None:
    TOKEN_FILE.write_text(token)
    log.info("Token saved to %s", TOKEN_FILE)


def tv_rest_get(path: str) -> dict | None:
    try:
        r = requests.get(f"{BASE_URL}{path}", verify=False, timeout=10)
        if r.status_code == 200:
            return r.json()
    except Exception as e:
        log.warning("REST GET %s failed: %s", path, e)
    return None


def get_tv_status() -> dict | None:
    return tv_rest_get("/api/v2/")


def get_browser_status() -> dict | None:
    return tv_rest_get(f"/api/v2/applications/{BROWSER_APP_ID}")


def launch_browser() -> bool:
    try:
        r = requests.post(
            f"{BASE_URL}/api/v2/applications/{BROWSER_APP_ID}",
            verify=False,
            timeout=10,
        )
        if r.status_code == 200:
            log.info("Browser launched successfully")
            return True
        log.error("Browser launch failed: %s %s", r.status_code, r.text)
    except Exception as e:
        log.error("Browser launch error: %s", e)
    return False


def close_browser() -> bool:
    try:
        r = requests.delete(
            f"{BASE_URL}/api/v2/applications/{BROWSER_APP_ID}",
            verify=False,
            timeout=10,
        )
        if r.status_code == 200:
            log.info("Browser closed")
            return True
        log.error("Browser close failed: %s", r.status_code)
    except Exception as e:
        log.error("Browser close error: %s", e)
    return False


def turn_off_art_mode() -> bool:
    """Turn off Art Mode using WebSocket API (needed for Frame TV)."""
    try:
        from samsungtvws import SamsungTVWS

        token = load_token()
        tv = SamsungTVWS(
            host=TV_IP,
            port=TV_PORT,
            token=token,
            timeout=15,
            name="MorningRoutine",
        )
        tv.art().set_artmode("off")
        if tv.token and tv.token != token:
            save_token(tv.token)
        tv.close()
        log.info("Art Mode turned off")
        return True
    except Exception as e:
        log.warning("Art Mode off failed (may not be in Art Mode): %s", e)
        return False


def switch_to_smart_hub() -> bool:
    """Send KEY_SOURCE to switch away from HDMI input if needed."""
    try:
        from samsungtvws import SamsungTVWS

        token = load_token()
        tv = SamsungTVWS(
            host=TV_IP,
            port=TV_PORT,
            token=token,
            timeout=15,
            name="MorningRoutine",
        )
        tv.send_key("KEY_SOURCE")
        time.sleep(1)
        tv.send_key("KEY_RETURN")
        if tv.token and tv.token != token:
            save_token(tv.token)
        tv.close()
        log.info("Switched to Smart Hub")
        return True
    except Exception as e:
        log.warning("Smart Hub switch failed: %s", e)
        return False


def wake_tv_wol() -> None:
    """Send Wake-on-LAN magic packet to wake the TV from standby."""
    try:
        from wakeonlan import send_magic_packet

        TV_MAC = "10:2b:41:bf:61:29"
        send_magic_packet(TV_MAC)
        log.info("Wake-on-LAN packet sent to %s", TV_MAC)
    except Exception as e:
        log.warning("Wake-on-LAN failed: %s", e)


def run_launch():
    log.info("=== Starting Morning Routine TV Launch ===")

    # Check if TV is reachable
    status = get_tv_status()
    if not status:
        # TV may be in deep sleep — send WOL and wait
        log.info("TV not reachable, sending Wake-on-LAN...")
        wake_tv_wol()
        for attempt in range(6):
            time.sleep(5)
            status = get_tv_status()
            if status:
                log.info("TV responded after WOL (attempt %d)", attempt + 1)
                break
        if not status:
            log.error("TV not reachable at %s after WOL", TV_IP)
            sys.exit(1)

    power = status.get("device", {}).get("PowerState", "unknown")
    log.info("TV power state: %s", power)

    # If TV is in standby/art mode, send WOL and wait for it to come up
    if power != "on":
        log.info("TV not fully on (state: %s), sending Wake-on-LAN...", power)
        wake_tv_wol()
        time.sleep(10)

    # Launch the browser via REST API (no WebSocket, no trust prompt)
    for attempt in range(3):
        if launch_browser():
            log.info("=== Routine timer should now be on screen ===")
            return
        if attempt < 2:
            log.info("Browser launch failed, retrying in 5s (attempt %d/3)...", attempt + 1)
            time.sleep(5)

    log.error("Browser launch failed after 3 attempts")


def run_status():
    tv = get_tv_status()
    if tv:
        device = tv.get("device", {})
        print(f"TV: {device.get('name')} ({device.get('modelName')})")
        print(f"Power: {device.get('PowerState')}")
        print(f"IP: {device.get('ip')}")
    else:
        print(f"TV not reachable at {TV_IP}")

    browser = get_browser_status()
    if browser:
        print(f"Browser: running={browser.get('running')}, visible={browser.get('visible')}")
    else:
        print("Browser: not available")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Morning Routine TV Launcher")
    parser.add_argument("--close", action="store_true", help="Close the browser")
    parser.add_argument("--status", action="store_true", help="Check TV status")
    parser.add_argument("--save-token", help="Save a WebSocket auth token")
    args = parser.parse_args()

    if args.save_token:
        save_token(args.save_token)
    elif args.close:
        close_browser()
    elif args.status:
        run_status()
    else:
        run_launch()
