# Docker Cleanup/Reset Script Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a single `scripts/cleanup.sh` that tears down Docker containers, volumes, and optionally images — a safety net when containers are broken or stuck.

**Architecture:** A bash script with three modes: `stop` (docker compose down only), `reset` (down + remove volumes + remove images), `nuke` (reset + docker system prune --volumes -a). Accepts an optional compose file path via `-f` flag so it works with root compose or standalone compose files.

**Tech Stack:** Bash, Docker CLI, docker compose

---

### Task 1: Write `scripts/cleanup.sh`

**Files:**
- Create: `scripts/cleanup.sh`

- [ ] **Step 1: Write the script**

Write `scripts/cleanup.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-reset}"
COMPOSE_FILE=""

# Parse -f flag for custom compose file
while getopts "f:" opt; do
  case $opt in
    f) COMPOSE_FILE="-f $OPTARG" ;;
    *) echo "Usage: $0 [stop|reset|nuke] [-f <compose-file>]"; exit 1 ;;
  esac
done

# Shift past parsed flags so MODE is positional arg 1 (after getopt consumed -f)
# Reset OPTIND and re-get MODE from remaining args
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
    echo "Running docker system prune --volumes -a..."
    docker system prune --volumes -a -f
    echo "Nuke complete. Run 'docker compose up -d' to rebuild from scratch."
    ;;

  *)
    echo "Unknown mode: $MODE"
    echo "Usage: $0 [stop|reset|nuke] [-f <compose-file>]"
    exit 1
    ;;
esac
```

- [ ] **Step 2: Make it executable**

```bash
git update-index --chmod=+x scripts/cleanup.sh
```

- [ ] **Step 3: Test each mode against root compose file**

```bash
# First start the stack
docker compose up -d

# Test stop mode
bash scripts/cleanup.sh stop
```
Expected: containers stop, volumes persist. Verify: `docker compose ps` shows no running containers.

```bash
# Restart stack
docker compose up -d
docker compose ps

# Test reset mode
bash scripts/cleanup.sh reset
```
Expected: containers stop, volumes removed, images removed. Verify: `docker compose ps` shows nothing, `docker images` shows no `my-nest-api` images.

```bash
# Restart and rebuild
docker compose up -d --build
docker compose ps

# Test with standalone DB compose
bash scripts/cleanup.sh reset -f docker/db/docker-compose.yml
```
Expected: standalone DB containers stopped and cleaned up.

- [ ] **Step 4: Commit**

```bash
git add scripts/cleanup.sh
git commit -m "feat: add Docker cleanup/reset script with stop/reset/nuke modes"
```

---

## Self-Review

**1. Spec coverage:**
- Single cleanup script ✅
- Clear/reset logic ✅
- Handles broken Docker state ✅
- Similar style to existing build scripts ✅
- Supports custom compose files ✅

**2. Placeholder scan:** No TBD, TODOs, or incomplete patterns.

**3. Type consistency:** Single file, no cross-references to worry about. Mode names (`stop`, `reset`, `nuke`) are consistent throughout.
