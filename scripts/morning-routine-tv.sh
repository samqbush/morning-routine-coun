#!/bin/bash
# Morning Routine TV Launcher - Shell wrapper
# Activates the Python venv and runs the launch script

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
VENV="$PROJECT_DIR/.venv"

# Activate virtual environment
source "$VENV/bin/activate"

# Run the launcher
python3 "$SCRIPT_DIR/launch_routine.py" "$@"
