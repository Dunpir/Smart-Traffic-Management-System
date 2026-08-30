#!/bin/bash

# ==============================================================================
# 🛑 SMART TRAFFIC MANAGEMENT SYSTEM - STOP SCRIPT
# ==============================================================================

# Ensure execution from the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# Color definitions for terminal output
BOLD="\033[1m"
GREEN="\033[1;32m"
BLUE="\033[1;34m"
CYAN="\033[1;36m"
YELLOW="\033[1;33m"
RED="\033[1;31m"
RESET="\033[0m"

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

BACKEND_PORT=5001
FRONTEND_PORT=5173
RUNTIME_DIR="${SCRIPT_DIR}/.runtime"
BACKEND_PID_FILE="${RUNTIME_DIR}/backend.pid"
FRONTEND_PID_FILE="${RUNTIME_DIR}/frontend.pid"

[ -t 1 ] && clear 2>/dev/null || true
echo -e "${CYAN}${BOLD}===============================================================${RESET}"
echo -e "${RED}${BOLD}       🛑 STOPPING TRAFFIC MANAGEMENT SYSTEM SERVERS 🛑        ${RESET}"
echo -e "${CYAN}${BOLD}===============================================================${RESET}"
echo ""

stopped_any=0

# 1. Stop Frontend using PID file
if [ -f "$FRONTEND_PID_FILE" ]; then
  FRONTEND_PID=$(cat "$FRONTEND_PID_FILE" 2>/dev/null)
  if [ -n "$FRONTEND_PID" ]; then
    echo -e "Stopping Frontend process (PID: ${FRONTEND_PID})..."
    pkill -P "$FRONTEND_PID" 2>/dev/null
    kill -TERM "$FRONTEND_PID" 2>/dev/null
    sleep 0.5
    kill -9 "$FRONTEND_PID" 2>/dev/null
    stopped_any=1
  fi
  rm -f "$FRONTEND_PID_FILE"
fi

# 2. Stop Backend using PID file
if [ -f "$BACKEND_PID_FILE" ]; then
  BACKEND_PID=$(cat "$BACKEND_PID_FILE" 2>/dev/null)
  if [ -n "$BACKEND_PID" ]; then
    echo -e "Stopping Backend process (PID: ${BACKEND_PID})..."
    pkill -P "$BACKEND_PID" 2>/dev/null
    kill -TERM "$BACKEND_PID" 2>/dev/null
    sleep 0.5
    kill -9 "$BACKEND_PID" 2>/dev/null
    stopped_any=1
  fi
  rm -f "$BACKEND_PID_FILE"
fi

# 3. Failsafe Port Cleanup
cleanup_port() {
  local port=$1
  local name=$2
  local pids
  pids=$(lsof -ti:"$port" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo -e "${YELLOW}Freeing port ${port} (${name})...${RESET}"
    # shellcheck disable=SC2086
    kill -TERM $pids 2>/dev/null
    sleep 1
    pids_remaining=$(lsof -ti:"$port" 2>/dev/null)
    if [ -n "$pids_remaining" ]; then
      # shellcheck disable=SC2086
      kill -9 $pids_remaining 2>/dev/null
    fi
    stopped_any=1
  fi
}

cleanup_port "$FRONTEND_PORT" "Frontend"
cleanup_port "$BACKEND_PORT" "Backend"

echo ""
if [ "$stopped_any" -eq 1 ]; then
  echo -e "${GREEN}${BOLD}✓ All Traffic Management System servers stopped successfully!${RESET}"
else
  echo -e "${CYAN}No running Traffic Management System servers were found.${RESET}"
fi

echo -e "Ports ${BACKEND_PORT} and ${FRONTEND_PORT} are completely free."
echo ""
echo -e "${CYAN}Closing in 3 seconds (or press any key to close immediately)...${RESET}"
read -t 3 -n 1 -s
exit 0
