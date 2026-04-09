#!/usr/bin/env bash
# Stop dev servers: API (3001) and Vite (5173, or 5174/5175 if those were used).
set -euo pipefail
PORTS=(3001 5173 5174 5175)
for port in "${PORTS[@]}"; do
  pids=$(lsof -ti tcp:"$port" -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "${pids:-}" ]; then
    echo "Stopping PID(s) on port $port: $pids"
    kill -9 $pids 2>/dev/null || true
  fi
done
echo "Listeners on these ports (should be empty):"
for port in "${PORTS[@]}"; do
  out=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$out" ]; then
    echo "$out"
  else
    echo "  $port: (none)"
  fi
done
