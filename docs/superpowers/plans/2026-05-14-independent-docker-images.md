# Independent Docker Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the existing monolithic Docker setup into two independently buildable/deployable Docker images — one for the NestJS API and one for PostgreSQL — with separate `Dockerfile`s and optional standalone docker-compose files.

**Architecture:** The API Dockerfile moves to `docker/api/Dockerfile` with a multi-stage build (build stage compiles TS, production stage runs only `dist/` and production `node_modules/`). The DB Dockerfile at `docker/db/Dockerfile` wraps `postgres:16-alpine` with pre-configured credentials and a healthcheck. The root `docker-compose.yml` references the local Dockerfiles. The `database.provider.ts` is updated to support `DATABASE_URL` as a connection string (in addition to the existing individual `DB_*` vars).

**Tech Stack:** Docker multi-stage builds, PostgreSQL 16 Alpine, NestJS 11, Drizzle ORM, Node.js 20 Alpine

---

## File Structure Changes

```
my-nest-api/
├── docker/
│   ├── api/
│   │   ├── Dockerfile              # NEW — multi-stage API Dockerfile
│   │   └── docker-compose.yml      # NEW — standalone API compose
│   └── db/
│       ├── Dockerfile              # NEW — PostgreSQL wrapper Dockerfile
│       ├── docker-compose.yml      # NEW — standalone DB compose
│       └── init/
│           └── .gitkeep            # NEW — placeholder for optional init scripts
├── docker-compose.yml              # MODIFIED — references ./docker/api and ./docker/db
├── scripts/
│   ├── build-api.sh                # NEW — build script for API image
│   └── build-db.sh                 # NEW — build script for DB image
├── Dockerfile                      # DELETED — replaced by docker/api/Dockerfile
├── .dockerignore                   # MODIFIED — updated for multi-stage build
└── src/database/
    └── database.provider.ts        # MODIFIED — support DATABASE_URL
```

### Task 1: Create `docker/` directory structure

**Files:**
- Create: `docker/api/.gitkeep`
- Create: `docker/db/init/.gitkeep`

- [ ] **Step 1: Create directory structure**

Run:
```powershell
New-Item -ItemType Directory -Path "docker/api" -Force
New-Item -ItemType Directory -Path "docker/db/init" -Force
New-Item -ItemType Directory -Path "scripts" -Force
```

- [ ] **Step 2: Create `.gitkeep` placeholders**

Write empty files:
```powershell
"" | Set-Content -NoNewline -Path "docker/api/.gitkeep"
"" | Set-Content -NoNewline -Path "docker/db/init/.gitkeep"
```

- [ ] **Step 3: Commit**

```bash
git add docker/api/.gitkeep docker/db/init/.gitkeep scripts/
git commit -m "chore: create docker directory structure"
```

---

### Task 2: Update `.dockerignore` for multi-stage build

**Files:**
- Modify: `.dockerignore`
- Delete: `Dockerfile` (replaced by `docker/api/Dockerfile`)

- [ ] **Step 1: Update `.dockerignore`**

The existing `.dockerignore` covers dev patterns. Update it for the multi-stage context:

```powershell
# old content in .dockerignore:
node_modules
dist
npm-debug.log
```

No change needed — the current `.dockerignore` is already appropriate. The build stage copies everything and ignores `node_modules` and `dist` (it will install and build fresh inside the container). No modifications required.

- [ ] **Step 2: Delete the old root `Dockerfile`**

```powershell
Remove-Item -LiteralPath "Dockerfile"
```

- [ ] **Step 3: Commit**

```bash
git rm Dockerfile
git commit -m "chore: remove root Dockerfile (will be replaced by docker/api/Dockerfile)"
```

---

### Task 3: Create DB Dockerfile (`docker/db/Dockerfile`)

**Files:**
- Create: `docker/db/Dockerfile`

- [ ] **Step 1: Write the DB Dockerfile**

Write `docker/db/Dockerfile`:

```dockerfile
FROM postgres:16-alpine

ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_DB=my_nest_api

EXPOSE 5432

HEALTHCHECK --interval=5s --timeout=5s --retries=5 \
  CMD pg_isready -U $POSTGRES_USER -d $POSTGRES_DB
```

- [ ] **Step 2: Verify the Dockerfile builds**

Run:
```powershell
docker build -t my-nest-api-db-test -f docker/db/Dockerfile docker/db
```
Expected: build succeeds, image tagged `my-nest-api-db-test`.

- [ ] **Step 3: Clean up test image**

```powershell
docker rmi my-nest-api-db-test
```

- [ ] **Step 4: Commit**

```bash
git add docker/db/Dockerfile
git commit -m "feat: add DB Dockerfile wrapping postgres:16-alpine with healthcheck"
```

---

### Task 4: Create API Dockerfile (`docker/api/Dockerfile`) — multi-stage

**Files:**
- Create: `docker/api/Dockerfile`

- [ ] **Step 1: Write the multi-stage API Dockerfile**

Write `docker/api/Dockerfile`:

```dockerfile
# ---- Build Stage ----
FROM node:20-alpine AS build
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS production
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /usr/src/app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "dist/main"]
```

- [ ] **Step 2: Verify the Dockerfile builds**

Run:
```powershell
docker build -t my-nest-api-test -f docker/api/Dockerfile .
```
Expected: build succeeds (may take a minute for npm install + nest build).

- [ ] **Step 3: Clean up test image**

```powershell
docker rmi my-nest-api-test
```

- [ ] **Step 4: Commit**

```bash
git add docker/api/Dockerfile
git commit -m "feat: add multi-stage API Dockerfile with healthcheck"
```

---

### Task 5: Update `database.provider.ts` to support `DATABASE_URL`

**Files:**
- Modify: `src/database/database.provider.ts`

- [ ] **Step 1: Update the provider to parse `DATABASE_URL`**

Current code reads individual `DB_*` vars. Update to also accept `DATABASE_URL` (which takes precedence when set, otherwise fall back to individual vars):

Edit `src/database/database.provider.ts`:

```typescript
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export const DRIZZLE = Symbol('DRIZZLE');

export const databaseProvider = {
  provide: DRIZZLE,
  useFactory: () => {
    const connectionString = process.env.DATABASE_URL;

    const pool = connectionString
      ? new Pool({ connectionString })
      : new Pool({
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_NAME || 'my_nest_api',
        });

    return drizzle(pool, { schema }) as NodePgDatabase<typeof schema>;
  },
};
```

- [ ] **Step 2: Run existing unit tests to verify no regression**

Run:
```powershell
npm run test
```
Expected: all existing tests pass. (The database provider is used in tests via `DatabaseModule` — if tests construct a `NestApplication`, they should still work since they'd use the defaults or env vars set in test config.)

- [ ] **Step 3: Commit**

```bash
git add src/database/database.provider.ts
git commit -m "feat: support DATABASE_URL env var in database provider"
```

---

### Task 6: Update root `docker-compose.yml`

**Files:**
- Modify: `docker-compose.yml`

- [ ] **Step 1: Rewrite docker-compose.yml to reference local Dockerfiles**

Replace the root `docker-compose.yml`:

```yaml
services:
  db:
    build:
      context: ./docker/db
      dockerfile: Dockerfile
    container_name: my-nest-api-db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: my_nest_api
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: docker/api/Dockerfile
    container_name: my-nest-api
    restart: unless-stopped
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/my_nest_api

volumes:
  pgdata:
```

Key changes from old:
- `db` service now uses `build: ./docker/db` instead of `image: postgres:16-alpine`
- `api` service now uses `build: context: ., dockerfile: docker/api/Dockerfile`
- API env simplified to just `DATABASE_URL` (since the provider now supports it)
- Removed individual `DB_*` env vars (unnecessary now)

- [ ] **Step 2: Start the stack and verify**

Run:
```powershell
docker compose up -d
```
Wait a few seconds, then:
```powershell
docker compose ps
```
Expected: both services running, `api` depends on `db` healthy.

Then verify API responds:
```powershell
curl http://localhost:3000/
```
Expected: NestJS responds (404 on root is fine — it means the API is running).

- [ ] **Step 3: Tear down**

```powershell
docker compose down -v
```

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: update docker-compose to build from local Dockerfiles"
```

---

### Task 7: Create standalone DB docker-compose

**Files:**
- Create: `docker/db/docker-compose.yml`

- [ ] **Step 1: Write standalone DB compose file**

Write `docker/db/docker-compose.yml`:

```yaml
services:
  db:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: my-nest-api-db-standalone
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: my_nest_api
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

- [ ] **Step 2: Verify standalone DB starts**

Run from project root:
```powershell
docker compose -f docker/db/docker-compose.yml up -d
```
Expected: DB container starts, healthcheck passes.

```powershell
docker compose -f docker/db/docker-compose.yml ps
```
Expected: container running and healthy.

- [ ] **Step 3: Verify host connectivity**

```powershell
docker compose -f docker/db/docker-compose.yml exec db pg_isready -U postgres
```
Expected: `localhost:5432 - accepting connections`

- [ ] **Step 4: Tear down**

```powershell
docker compose -f docker/db/docker-compose.yml down -v
```

- [ ] **Step 5: Commit**

```bash
git add docker/db/docker-compose.yml
git commit -m "feat: add standalone DB docker-compose"
```

---

### Task 8: Create standalone API docker-compose

**Files:**
- Create: `docker/api/docker-compose.yml`

- [ ] **Step 1: Write standalone API compose file**

Write `docker/api/docker-compose.yml`:

```yaml
services:
  api:
    build:
      context: ..
      dockerfile: api/Dockerfile
    container_name: my-nest-api-standalone
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/my_nest_api
```

Note: `context: ..` (the project root) because Dockerfile references the root-level `package.json` and `src/`.

- [ ] **Step 2: Verify standalone API builds (no run test — needs a running DB)**

Run:
```powershell
docker compose -f docker/api/docker-compose.yml build
```
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add docker/api/docker-compose.yml
git commit -m "feat: add standalone API docker-compose"
```

---

### Task 9: Create build scripts

**Files:**
- Create: `scripts/build-api.sh`
- Create: `scripts/build-db.sh`

- [ ] **Step 1: Write API build script**

Write `scripts/build-api.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="${IMAGE_NAME:-my-nest-api}"
TAG="${TAG:-latest}"

docker build \
  -t "${IMAGE_NAME}:${TAG}" \
  -f docker/api/Dockerfile \
  .

echo "Built ${IMAGE_NAME}:${TAG}"
```

- [ ] **Step 2: Write DB build script**

Write `scripts/build-db.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="${IMAGE_NAME:-my-nest-api-db}"
TAG="${TAG:-latest}"

docker build \
  -t "${IMAGE_NAME}:${TAG}" \
  -f docker/db/Dockerfile \
  docker/db

echo "Built ${IMAGE_NAME}:${TAG}"
```

- [ ] **Step 3: Make scripts executable**

On Windows (or when using git bash), the scripts will work in bash environments. For CI portability, they're plain bash scripts.

```powershell
# Verify the scripts were written correctly
Get-Content scripts/build-api.sh
Get-Content scripts/build-db.sh
```

- [ ] **Step 4: Commit**

```bash
git add scripts/build-api.sh scripts/build-db.sh
git commit -m "feat: add Docker build helper scripts"
```

---

### Task 10: Update `AGENTS.md` with new Docker instructions

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Read current AGENTS.md**

```powershell
Get-Content AGENTS.md
```

- [ ] **Step 2: Append Docker section**

Add to `AGENTS.md` (after the Linting section):

```markdown
## Docker Images

### File Structure
```
docker/
├── api/
│   ├── Dockerfile              # Multi-stage: build → production
│   └── docker-compose.yml      # Standalone API (needs external DB)
├── db/
│   ├── Dockerfile              # Wraps postgres:16-alpine with credentials
│   ├── docker-compose.yml      # Standalone DB
│   └── init/                   # Optional SQL init scripts
```

### Building Individually
```bash
# API image
IMAGE_NAME=my-nest-api TAG=latest bash scripts/build-api.sh

# DB image
IMAGE_NAME=my-nest-api-db TAG=latest bash scripts/build-db.sh
```

### Running with docker-compose (dev)
```bash
# Full stack
docker compose up -d

# DB only (API connects to external DB)
docker compose -f docker/db/docker-compose.yml up -d

# API only (needs DATABASE_URL set or DB running)
docker compose -f docker/api/docker-compose.yml up -d
```

### Startup Order
1. Start DB first: `docker compose up -d db` or `docker compose -f docker/db/docker-compose.yml up -d`
2. Wait for healthcheck to pass
3. Start API: `docker compose up -d api` or `docker compose -f docker/api/docker-compose.yml up -d`

### Environment Variables
- **API**: `DATABASE_URL` (connection string, takes precedence) or individual `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- **DB**: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (all have defaults)
```

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add Docker image instructions to AGENTS.md"
```

---

## Self-Review

**1. Spec coverage:**
- User story 1 (build API independently): Task 4 + Task 9
- User story 2 (build DB independently): Task 3 + Task 9
- User story 3 (start DB first): Task 6 (depends_on with healthcheck) + Task 10
- User story 4 (custom DATABASE_URL): Task 5
- User story 5 (DB accepts LAN connections): Task 3 (expose 5432, default postgres behavior)
- User story 6 (multi-stage build): Task 4
- User story 7 (healthcheck): Task 3 (DB pg_isready) + Task 4 (API HTTP healthcheck)
- User story 8 (startup order documented): Task 10
- User story 9 (separate compose files): Task 7 + Task 8
- Implementation Decisions (docker-compose.yml updated): Task 6
- Implementation Decisions (build scripts): Task 9
- Testing Decisions (build + run verification): Each task's verify step
- `.dockerignore` minimal change: Task 2
- DB init scripts directory created: Task 1

**2. Placeholder scan:** No TBD, TODOs, or "implement later" patterns found. Every step has exact code or commands.

**3. Type consistency:** The DATABASE_URL env var name is consistent across all tasks. Provider function signature is unchanged (still returns `NodePgDatabase<typeof schema>`). Dockerfile paths are consistent. Healthcheck commands match what's in docker-compose.
