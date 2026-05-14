@echo off
setlocal

set MODE=%1
if "%MODE%"=="" set MODE=reset

:parse
if /i "%MODE%"=="-f" (
  set COMPOSE_FILE=-f %2
  shift
  shift
  set MODE=%1
  if "%MODE%"=="" set MODE=reset
  goto :parse
)

echo === Docker Cleanup ===
echo Mode: %MODE%

if /i "%MODE%"=="start" (
  echo Starting containers...
  if defined COMPOSE_FILE (docker compose %COMPOSE_FILE% up -d) else (docker compose up -d)
  echo Containers started.
  goto :end
)

if /i "%MODE%"=="stop" (
  echo Stopping containers...
  if defined COMPOSE_FILE (docker compose %COMPOSE_FILE% down) else (docker compose down)
  echo Containers stopped. Volumes and images preserved.
  goto :end
)

if /i "%MODE%"=="reset" (
  echo Stopping containers and removing volumes...
  if defined COMPOSE_FILE (docker compose %COMPOSE_FILE% down -v) else (docker compose down -v)
  docker rmi my-nest-api:latest 2>nul
  docker rmi my-nest-api-db:latest 2>nul
  echo Reset complete. Run 'docker compose up -d' to rebuild.
  goto :end
)

if /i "%MODE%"=="nuke" (
  echo Stopping containers and removing volumes...
  if defined COMPOSE_FILE (docker compose %COMPOSE_FILE% down -v) else (docker compose down -v)
  docker rmi my-nest-api:latest 2>nul
  docker rmi my-nest-api-db:latest 2>nul
  docker volume prune -f
  docker builder prune -f
  echo Nuke complete. Run 'docker compose up -d' to rebuild from scratch.
  goto :end
)

echo Unknown mode: %MODE%
echo Usage: %0 [start^|stop^|reset^|nuke] [-f ^<compose-file^>]
exit /b 1

:end
