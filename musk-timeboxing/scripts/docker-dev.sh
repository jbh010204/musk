#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ACTION="${1:-up}"

case "$ACTION" in
  up)
    docker compose up -d --build
    echo "Running: http://localhost:5173"
    ;;
  down)
    docker compose down
    ;;
  restart)
    docker compose down
    docker compose up -d --build
    echo "Running: http://localhost:5173"
    ;;
  logs)
    docker compose logs -f
    ;;
  ps)
    docker compose ps
    ;;
  *)
    echo "Usage: ./scripts/docker-dev.sh {up|down|restart|logs|ps}"
    exit 1
    ;;
esac
