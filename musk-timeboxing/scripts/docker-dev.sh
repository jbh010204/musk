#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ACTION="${1:-up}"
APP_PORT="${APP_PORT:-5173}"
LEGACY_PORT="${LEGACY_PORT:-4173}"
API_PORT="${API_PORT:-8787}"

wait_for_url() {
  local url="$1"
  local label="$2"
  local attempts=30

  until curl -fsS "$url" >/dev/null 2>&1; do
    attempts=$((attempts - 1))
    if [[ "$attempts" -le 0 ]]; then
      echo "Timed out waiting for ${label}: ${url}"
      return 1
    fi
    sleep 1
  done
}

compose_up() {
  local force_build="${1:-false}"

  if [[ "$force_build" == "true" ]]; then
    docker compose up -d --build
  elif docker image inspect musk-timeboxing-app >/dev/null 2>&1; then
    docker compose up -d --no-build
  else
    docker compose up -d --build
  fi
}

case "$ACTION" in
  up)
    compose_up
    wait_for_url "http://localhost:${API_PORT}/health" "planner api"
    wait_for_url "http://localhost:${APP_PORT}" "planner app"
    echo "App: http://localhost:${APP_PORT}"
    echo "Legacy bridge: http://localhost:${LEGACY_PORT}"
    echo "API: http://localhost:${API_PORT}/health"
    echo "If you have old browser data on port ${LEGACY_PORT}, open that URL once to migrate it into the Docker volume."
    ;;
  down)
    docker compose down
    ;;
  restart)
    docker compose down
    compose_up
    wait_for_url "http://localhost:${API_PORT}/health" "planner api"
    wait_for_url "http://localhost:${APP_PORT}" "planner app"
    echo "App: http://localhost:${APP_PORT}"
    echo "Legacy bridge: http://localhost:${LEGACY_PORT}"
    echo "API: http://localhost:${API_PORT}/health"
    ;;
  rebuild)
    docker compose down
    compose_up true
    wait_for_url "http://localhost:${API_PORT}/health" "planner api"
    wait_for_url "http://localhost:${APP_PORT}" "planner app"
    echo "App: http://localhost:${APP_PORT}"
    echo "Legacy bridge: http://localhost:${LEGACY_PORT}"
    echo "API: http://localhost:${API_PORT}/health"
    ;;
  logs)
    docker compose logs -f
    ;;
  ps)
    docker compose ps
    ;;
  *)
    echo "Usage: APP_PORT=5173 LEGACY_PORT=4173 API_PORT=8787 ./scripts/docker-dev.sh {up|down|restart|rebuild|logs|ps}"
    exit 1
    ;;
esac
