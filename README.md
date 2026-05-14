# my-nest-api

NestJS API + PostgreSQL 16 + Drizzle ORM, containerized with Docker.

## Quick Start (Recommended)

```bash
# Development — hot-reload on src/ changes
docker compose up -d --build

# Production — baked-in build
docker compose up -d

npm run db:push   # push schema to DB
npm run db:seed   # seed sample users (skips if data exists)

# verify data
curl http://localhost:3000/users

# to stop docker container
docker compose down

# to start docker container again 
docker compose up -d # prod
docker compose up -d --build # dev
```

> After reboot: `docker compose up -d` — data is persisted in volumes.

## Alternative: Build & Run Individually

Build both images, then start DB → API in sequence.

```bash
# 1. Build the images
bash scripts/build-db.sh
bash scripts/build-api.sh

# 2. Start DB and wait for healthcheck
docker compose -f docker/db/docker-compose.yml up -d

# 3. Start API
docker compose -f docker/api/docker-compose.yml up -d

# 4. Push schema & seed data
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

```bash
bash scripts/cleanup.sh stop    # stop containers only
bash scripts/cleanup.sh reset   # stop + remove volumes + remove images
bash scripts/cleanup.sh nuke    # reset + prune dangling volumes and build cache
```
