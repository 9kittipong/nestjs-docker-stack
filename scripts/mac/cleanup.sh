#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-reset}"
COMPOSE_FILE=""

while getopts "f:" opt; do
  case $opt in
    f) COMPOSE_FILE="-f $OPTARG" ;;
    *) echo "Usage: $0 [start|stop|reset|nuke] [-f <compose-file>]"; exit 1 ;;
  esac
done

shift $((OPTIND-1))
MODE="${1:-reset}"

compose_cmd() {
  if [ -n "$COMPOSE_FILE" ]; then
    docker compose $COMPOSE_FILE "$@"
  else
    docker compose "$@"
  fi
}

echo "=== Docker Cleanup ==="
echo "Mode: $MODE"
[ -n "$COMPOSE_FILE" ] && echo "Compose file: $COMPOSE_FILE"

case "$MODE" in
  start)
    echo "Starting containers..."
    compose_cmd up -d
    echo "Containers started."
    ;;
  stop)
    echo "Stopping containers..."
    compose_cmd down
    echo "Containers stopped. Volumes and images preserved."
    ;;
  reset)
    echo "Stopping containers and removing volumes..."
    compose_cmd down -v
    echo "Removing API image..."
    docker rmi my-nest-api:latest 2>/dev/null || true
    echo "Removing DB image..."
    docker rmi my-nest-api-db:latest 2>/dev/null || true
    echo "Reset complete. Run 'docker compose up -d' to rebuild."
    ;;
  nuke)
    echo "Stopping containers and removing volumes..."
    compose_cmd down -v
    echo "Removing API image..."
    docker rmi my-nest-api:latest 2>/dev/null || true
    echo "Removing DB image..."
    docker rmi my-nest-api-db:latest 2>/dev/null || true
    echo "Pruning unused volumes and build cache..."
    docker volume prune -f
    docker builder prune -f
    echo "Nuke complete. Run 'docker compose up -d' to rebuild from scratch."
    ;;
  *)
    echo "Unknown mode: $MODE"
    echo "Usage: $0 [start|stop|reset|nuke] [-f <compose-file>]"
    exit 1
    ;;
esac
