# my-nest-api

NestJS API + PostgreSQL 16 + Drizzle ORM, containerized with Docker.

## Quick Start (Recommended)

**Windows 11:**
```bash
docker compose up -d --build       # dev — hot-reload on src/ changes
docker compose up -d               # prod — baked-in build

npm run db:push                    # push schema to DB
npm run db:seed                    # seed sample users (skips if data exists)

curl http://localhost:3000/users
```

**macOS:**
```bash
docker compose -f docker-compose.mac.yml up -d --build # dev — hot-reload on src/ changes
docker compose -f docker-compose.mac.yml up -d         # prod — baked-in build

npm run db:push
npm run db:seed

curl http://localhost:3000/users
```

## Alternative: Build & Run Individually

**Windows 11:**
```bash
scripts\win\build-db.bat
scripts\win\build-api.bat

docker compose -f docker/db/docker-compose.yml up -d
docker compose -f docker/api/docker-compose.yml up -d

npm run db:push
npm run db:seed
curl http://localhost:3000/users
```

**macOS:**
```bash
bash scripts/mac/build-db.sh
bash scripts/mac/build-api.sh

docker compose -f docker/db/docker-compose.mac.yml up -d
docker compose -f docker/api/docker-compose.mac.yml up -d

npm run db:push
npm run db:seed
curl http://localhost:3000/users
```

## Development Commands

```bash
npm run start:dev            # local dev (needs a running PostgreSQL)
npm run test                 # unit tests
npm run lint                 # lint + format
npm run db:generate          # generate SQL from schema changes
npm run db:push              # push schema to DB
npm run db:seed              # seed users table with sample data
```

## Cleanup

**Windows 11:**
```bash
scripts\win\cleanup.bat stop    # stop containers only
scripts\win\cleanup.bat reset   # stop + remove volumes + remove images
scripts\win\cleanup.bat nuke    # reset + prune dangling volumes and build cache
```

**macOS:**
```bash
bash scripts/mac/cleanup.sh stop    # stop containers only
bash scripts/mac/cleanup.sh reset   # stop + remove volumes + remove images
bash scripts/mac/cleanup.sh nuke    # reset + prune dangling volumes and build cache
```
