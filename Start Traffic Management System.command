#!/bin/bash

# ==============================================================================
# 🚦 SMART TRAFFIC MANAGEMENT SYSTEM - ONE-CLICK MACOS LAUNCHER
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

# Ensure standard macOS and developer environment paths are loaded
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

# Load NVM or user shell environment if available
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$HOME/.nvm/nvm.sh" 2>/dev/null
fi
if [ -d "$HOME/.nvm/versions/node" ]; then
  LATEST_NVM_NODE="$(ls -d "$HOME/.nvm/versions/node"/* 2>/dev/null | tail -n 1)/bin"
  if [ -d "$LATEST_NVM_NODE" ]; then
    export PATH="$LATEST_NVM_NODE:$PATH"
  fi
fi
if [ -d "$HOME/.fnm/current/bin" ]; then
  export PATH="$HOME/.fnm/current/bin:$PATH"
fi
if [ -d "$HOME/.volta/bin" ]; then
  export PATH="$HOME/.volta/bin:$PATH"
fi

BACKEND_PORT=5001
FRONTEND_PORT=5173
FRONTEND_URL="http://localhost:${FRONTEND_PORT}"
BACKEND_HEALTH_URL="http://localhost:${BACKEND_PORT}/health"
RUNTIME_DIR="${SCRIPT_DIR}/.runtime"
BACKEND_PID_FILE="${RUNTIME_DIR}/backend.pid"
FRONTEND_PID_FILE="${RUNTIME_DIR}/frontend.pid"
BACKEND_LOG="${RUNTIME_DIR}/backend.log"
FRONTEND_LOG="${RUNTIME_DIR}/frontend.log"

mkdir -p "$RUNTIME_DIR"

[ -t 1 ] && clear 2>/dev/null || true
echo -e "${CYAN}${BOLD}===============================================================${RESET}"
echo -e "${GREEN}${BOLD}      🚦 SMART TRAFFIC MANAGEMENT SYSTEM - LAUNCHER 🚦          ${RESET}"
echo -e "${CYAN}${BOLD}===============================================================${RESET}"
echo -e "Project Directory: ${BLUE}${SCRIPT_DIR}${RESET}"
echo ""

# 1. Pre-flight Check: Node.js & npm
if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}[ERROR] Node.js was not found in your PATH!${RESET}"
  echo -e "Please install Node.js (v18+) from https://nodejs.org or run 'brew install node'."
  echo ""
  echo "Press any key to close..."
  read -n 1 -s
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo -e "${RED}[ERROR] npm was not found in your PATH!${RESET}"
  echo "Press any key to close..."
  read -n 1 -s
  exit 1
fi

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo -e "✓ Node.js Runtime:  ${GREEN}${NODE_VERSION}${RESET}"
echo -e "✓ npm Package Mgr:  ${GREEN}v${NPM_VERSION}${RESET}"

# 2. Pre-flight Check: Dependencies
if [ ! -d "backend/node_modules" ]; then
  echo -e "${YELLOW}[!] Missing backend/node_modules. Installing dependencies...${RESET}"
  (cd backend && npm install) || {
    echo -e "${RED}[ERROR] Failed to install backend dependencies.${RESET}"
    read -n 1 -s
    exit 1
  }
fi

if [ ! -d "frontend/node_modules" ]; then
  echo -e "${YELLOW}[!] Missing frontend/node_modules. Installing dependencies...${RESET}"
  (cd frontend && npm install) || {
    echo -e "${RED}[ERROR] Failed to install frontend dependencies.${RESET}"
    read -n 1 -s
    exit 1
  }
fi

# 3. Clean up any previous lingering instances on required ports
cleanup_port() {
  local port=$1
  local pids
  pids=$(lsof -ti:"$port" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo -e "${YELLOW}[!] Cleaning up previous process listening on port ${port}...${RESET}"
    # shellcheck disable=SC2086
    kill -TERM $pids 2>/dev/null
    sleep 1
    pids_remaining=$(lsof -ti:"$port" 2>/dev/null)
    if [ -n "$pids_remaining" ]; then
      # shellcheck disable=SC2086
      kill -9 $pids_remaining 2>/dev/null
    fi
  fi
}

cleanup_port "$BACKEND_PORT"
cleanup_port "$FRONTEND_PORT"

# Function to cleanly stop everything on exit / Ctrl+C
stop_all_servers() {
  echo ""
  echo -e "${YELLOW}Shutting down Traffic Management servers...${RESET}"
  
  if [ -f "$BACKEND_PID_FILE" ]; then
    BACKEND_PID=$(cat "$BACKEND_PID_FILE" 2>/dev/null)
    if [ -n "$BACKEND_PID" ]; then
      # Kill child process tree
      pkill -P "$BACKEND_PID" 2>/dev/null
      kill -TERM "$BACKEND_PID" 2>/dev/null
    fi
    rm -f "$BACKEND_PID_FILE"
  fi

  if [ -f "$FRONTEND_PID_FILE" ]; then
    FRONTEND_PID=$(cat "$FRONTEND_PID_FILE" 2>/dev/null)
    if [ -n "$FRONTEND_PID" ]; then
      # Kill child process tree
      pkill -P "$FRONTEND_PID" 2>/dev/null
      kill -TERM "$FRONTEND_PID" 2>/dev/null
    fi
    rm -f "$FRONTEND_PID_FILE"
  fi

  # Secondary failsafe
  cleanup_port "$BACKEND_PORT"
  cleanup_port "$FRONTEND_PORT"

  echo -e "${GREEN}✓ All servers stopped cleanly.${RESET}"
  exit 0
}

# Trap signals for graceful exit
trap stop_all_servers SIGINT SIGTERM SIGHUP

# 4. Start Backend Server
echo ""
echo -e "${CYAN}▶ Starting Backend (Node.js/Express + Neo4j Engine)...${RESET}"
(cd backend && npm run dev > "$BACKEND_LOG" 2>&1) &
BACKEND_PID=$!
echo "$BACKEND_PID" > "$BACKEND_PID_FILE"

echo -n "  Waiting for backend health status..."
BACKEND_READY=0
for i in {1..30}; do
  if curl -s -f "$BACKEND_HEALTH_URL" >/dev/null 2>&1; then
    BACKEND_READY=1
    break
  fi
  # Check if backend process crashed
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    break
  fi
  echo -n "."
  sleep 1
done
echo ""

if [ "$BACKEND_READY" -ne 1 ]; then
  echo -e "${RED}[ERROR] Backend failed to start within 30 seconds!${RESET}"
  echo -e "${YELLOW}--- Backend Log Output (Last 20 lines) ---${RESET}"
  tail -n 20 "$BACKEND_LOG"
  echo -e "${YELLOW}------------------------------------------${RESET}"
  stop_all_servers
  echo "Press any key to close..."
  read -n 1 -s
  exit 1
fi
echo -e "  ${GREEN}✓ Backend is live and healthy at http://localhost:${BACKEND_PORT}${RESET}"

# 5. Start Frontend Server
echo ""
echo -e "${CYAN}▶ Starting Frontend (React + Vite)...${RESET}"
(cd frontend && npm run dev > "$FRONTEND_LOG" 2>&1) &
FRONTEND_PID=$!
echo "$FRONTEND_PID" > "$FRONTEND_PID_FILE"

echo -n "  Waiting for frontend dev server..."
FRONTEND_READY=0
for i in {1..25}; do
  if curl -s -f "$FRONTEND_URL" >/dev/null 2>&1; then
    FRONTEND_READY=1
    break
  fi
  # Check if frontend process died
  if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    break
  fi
  echo -n "."
  sleep 1
done
echo ""

if [ "$FRONTEND_READY" -ne 1 ]; then
  echo -e "${RED}[ERROR] Frontend failed to start within 25 seconds!${RESET}"
  echo -e "${YELLOW}--- Frontend Log Output (Last 20 lines) ---${RESET}"
  tail -n 20 "$FRONTEND_LOG"
  echo -e "${YELLOW}-------------------------------------------${RESET}"
  stop_all_servers
  echo "Press any key to close..."
  read -n 1 -s
  exit 1
fi
echo -e "  ${GREEN}✓ Frontend is live at ${FRONTEND_URL}${RESET}"

# 6. Open Browser
echo ""
echo -e "${GREEN}🚀 Opening default browser to ${FRONTEND_URL}...${RESET}"
open "$FRONTEND_URL"

# 7. Live Status & Interactive Control Loop
echo ""
echo -e "${CYAN}${BOLD}===============================================================${RESET}"
echo -e "${GREEN}${BOLD}  ✅ SYSTEM RUNNING AND READY FOR USE                         ${RESET}"
echo -e "${CYAN}${BOLD}===============================================================${RESET}"
echo -e "  🌐 Dashboard URL:    ${BLUE}${FRONTEND_URL}${RESET}"
echo -e "  ⚡ Backend API:      ${BLUE}http://localhost:${BACKEND_PORT}/api${RESET}"
echo -e "  🩺 Healthcheck:      ${BLUE}${BACKEND_HEALTH_URL}${RESET}"
echo -e "  📋 Logs Directory:   ${BLUE}${RUNTIME_DIR}${RESET}"
echo -e "${CYAN}---------------------------------------------------------------${RESET}"
echo -e "  ${BOLD}Commands:${RESET}"
echo -e "    [ ${YELLOW}q${RESET} or ${YELLOW}Ctrl+C${RESET} ]  Stop all servers and exit"
echo -e "    [ ${CYAN}o${RESET} ]             Re-open website in browser"
echo -e "    [ ${CYAN}b${RESET} ]             View recent backend logs"
echo -e "    [ ${CYAN}f${RESET} ]             View recent frontend logs"
echo -e "${CYAN}===============================================================${RESET}"
echo ""

# Loop to accept user inputs or wait
while true; do
  # Check if child processes are still alive
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo -e "${RED}[ALERT] Backend process stopped unexpectedly!${RESET}"
    tail -n 15 "$BACKEND_LOG"
    stop_all_servers
    break
  fi
  if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo -e "${RED}[ALERT] Frontend process stopped unexpectedly!${RESET}"
    tail -n 15 "$FRONTEND_LOG"
    stop_all_servers
    break
  fi

  # Read single character with 2-second timeout to keep watching process health
  if read -t 2 -n 1 user_choice; then
    case "$user_choice" in
      q|Q)
        stop_all_servers
        ;;
      o|O)
        echo -e "\n${CYAN}Re-opening ${FRONTEND_URL}...${RESET}"
        open "$FRONTEND_URL"
        ;;
      b|B)
        echo -e "\n${YELLOW}--- Recent Backend Logs ---${RESET}"
        tail -n 25 "$BACKEND_LOG"
        echo -e "${YELLOW}---------------------------${RESET}\n"
        ;;
      f|F)
        echo -e "\n${YELLOW}--- Recent Frontend Logs ---${RESET}"
        tail -n 25 "$FRONTEND_LOG"
        echo -e "${YELLOW}----------------------------${RESET}\n"
        ;;
    esac
  fi
done
