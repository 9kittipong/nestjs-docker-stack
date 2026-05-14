# PRD: Split NestJS API & PostgreSQL into Two Independently Deployable Docker Images

## Problem Statement

The NestJS API currently runs via a single `docker-compose.yml` that couples the API (NestJS + Drizzle) and the database (PostgreSQL) into one config. This makes it impossible to build, version, and distribute each component separately. Other teams cannot consume just the API image or just the DB image — they must run the entire compose stack. The only thing the API needs from the outside is a database URL, but today that's hardcoded into the compose file alongside the DB service.

## Solution

Create two independent Docker images — one for the NestJS API and one for PostgreSQL — each with its own `Dockerfile`. The `docker-compose.yml` is updated to build both from local Dockerfiles but remains optional for development. In production, each image can be built, tagged, pushed, and deployed independently.

The **API image** ships the compiled NestJS application and accepts `DATABASE_URL` as its only required runtime environment variable. The **DB image** wraps `postgres:16-alpine` with pre-configured credentials, exposes port 5432 to the host network, and can optionally pre-load initialisation scripts.

## User Stories

1. As a developer, I want to build the API Docker image independently, so that I can distribute it to other teams without bundling the database.
2. As a developer, I want to build the DB Docker image independently, so that I can distribute a pre-configured PostgreSQL to other teams without the API.
3. As a developer, I want to start the DB container first, so that the API container can connect to it on startup.
4. As a developer, I want to pass a custom `DATABASE_URL` to the API container via environment variable, so that it can connect to any PostgreSQL instance (local, remote, or cloud).
5. As an operator, I want the DB container to accept connections from the local network, so that multiple services (API, admin tools, migration runners) can connect to the same database.
6. As a developer, I want the API Dockerfile to use a multi-stage build, so that the production image is as small as possible (node:20-alpine runtime only, no build toolchain).
7. As an operator, I want a Docker healthcheck on both containers, so that orchestration tools know when each service is ready.
8. As a developer, I want to see a clear startup order documented, so that I always start the DB before the API.
9. As a developer, I want separate docker-compose files (or scripts) for building/running each image independently, so that I can test each component in isolation.

## Implementation Decisions

### API Dockerfile (multi-stage)

Two-stage build:
- **Build stage** (`node:20-alpine`): installs all dependencies, runs `npm run build`.
- **Production stage** (`node:20-alpine`): copies only `dist/`, `node_modules/` (production only), and `package.json`. Starts with `node dist/main`.
- Accepts `DATABASE_URL` (or `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) at runtime via environment variable (existing `database.provider.ts` already reads these).
- Exposes port 3000.

### DB Dockerfile

Thin wrapper around `postgres:16-alpine`:
- Sets `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` via `ENV` (overridable at runtime).
- Exposes port 5432.
- Optionally includes SQL init scripts in `docker-entrypoint-initdb.d/` for schema pre-seeding (Drizzle migrations can also be run from the API).
- Adds a `HEALTHCHECK` using `pg_isready`.

### docker-compose.yml (updated)

- Each service has `build: ./docker/api` and `build: ./docker/db` respectively.
- `db` service uses the local DB Dockerfile instead of pulling `postgres:16-alpine` directly.
- `api` service depends on `db` with `condition: service_healthy`.
- Volume mount for persistent DB data.

### Separate deployment files

- `docker/api/docker-compose.yml` — runs only the API container (user must supply `DATABASE_URL`).
- `docker/db/docker-compose.yml` — runs only the DB container.
- Build/helper scripts (`scripts/build-api.sh`, `scripts/build-db.sh`) for CI or local use.

### File structure

```
my-nest-api/
├── docker/
│   ├── api/
│   │   ├── Dockerfile
│   │   └── docker-compose.yml
│   └── db/
│       ├── Dockerfile
│       ├── docker-compose.yml
│       └── init/
│           └── (optional SQL init scripts)
├── docker-compose.yml          # updated — references ./docker/api and ./docker/db
├── scripts/
│   ├── build-api.sh
│   └── build-db.sh
└── src/                        # unchanged
```

### Schema management

Drizzle migrations are generated via `npm run db:generate` and pushed via `npm run db:push` (or at application startup). The API can run migrations on startup, or they can be run separately against the DB. This decision can be revisited in implementation.

## Testing Decisions

- **API Dockerfile**: test by building the image and running the container against a known PostgreSQL instance (could be a temporary Docker container). Verify that `curl localhost:3000/...` returns expected responses.
- **DB Dockerfile**: test by building the image, running it, connecting with `psql`, and verifying the database is accessible from the host network.
- **Integration**: start both containers independently, verify the API can connect and serve requests.
- Tests will use a temporary test database (not the dev/prod database).

Existing unit/e2e tests for NestJS (via `@nestjs/testing` + `supertest`) remain unchanged — they compile their own NestApplication and do not require Docker.

## Out of Scope

- Kubernetes manifests or container orchestration beyond Docker Compose.
- CI/CD pipeline configuration (GitHub Actions, GitLab CI, etc.).
- Authentication/authorisation for the DB container (follows PostgreSQL's built-in password auth).
- TLS/SSL for the DB connection (can be added separately).
- Monitoring, logging infrastructure, or observability tooling.
- Database migration strategy beyond what Drizzle already provides.
- Windows container support (Linux containers only).

## Further Notes

- The `.env` file remains gitignored. A `.env.example` can document required vars.
- The DB image intentionally avoids bundling application-specific data — it's a generic PostgreSQL 16 image with pre-configured credentials. Schema is managed by Drizzle migrations from the API.
- Port `3000` for API and `5432` for DB are the defaults, both overridable via environment variables.
- The startup order is documented in `AGENTS.md`: `docker compose up -d db` → wait for healthy → `docker compose up -d api`.
