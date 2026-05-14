# my-nest-api — agent instructions

## Stack
- NestJS v11 + TypeScript (`module: "nodenext"` in tsconfig)
- PostgreSQL 16 + Drizzle ORM (`drizzle-orm` + `drizzle-kit`)
- Docker (multi-stage builds via `docker/api/Dockerfile` and `docker/db/Dockerfile`)

## Commands
| Command | What |
|---|---|
| `npm run start:dev` | dev server with watch |
| `npm run start:prod` | runs `node dist/main` (build first) |
| `npm run lint` | ESLint flat config (`eslint.config.mjs`) with `--fix` |
| `npm run format` | Prettier (singleQuote, trailingComma: all) |
| `npm run test` | unit tests — `*.spec.ts` in `src/`, jest config inline in package.json |
| `npm run test:e2e` | e2e tests — `*.e2e-spec.ts` in `test/`, config at `test/jest-e2e.json` |
| `npm run test:cov` | unit + coverage |
| `npm run db:generate` | `drizzle-kit generate` — creates SQL from schema |
| `npm run db:push` | `drizzle-kit push` — pushes schema to DB |
| `npm run db:migrate` | **same as push** (not `drizzle-kit migrate`) |

Lint before test is a good habit. There is no dedicated `typecheck` script.

## Architecture
- `AppModule` imports `ConfigModule.forRoot({ isGlobal: true })`, `DatabaseModule` (global), `UsersModule`
- Database accessed via custom `DRIZZLE` injection symbol (`Symbol('DRIZZLE')` from `src/database/database.provider.ts`)
- `DatabaseModule` is `@Global()` — no need to re-import in feature modules
- DB config accepts `DATABASE_URL` or individual `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- DTO validation uses `class-validator` + `class-transformer`; `ValidationPipe({ whitelist: true })` in `main.ts`
- `UsersModule` (controller + service + DTOs) is the reference pattern for new feature modules
- Drizzle schema in `src/database/schema/` — add new tables there and re-export from `index.ts`

## DB Setup
- `.env` is gitignored — copy from `.env` example or create one locally
- Start DB (Win): `docker compose up -d db` | (macOS): `docker compose -f docker-compose.mac.yml up -d db`
- Start full stack (Win): `docker compose up -d` | (macOS): `docker compose -f docker-compose.mac.yml up -d`
- After schema changes: `npm run db:generate` then `npm run db:push`
- Migration files in `drizzle/` — gitignored

## Testing quirks
- E2E tests compile their own `NestApplication` via `@nestjs/testing` — no external server needed
- E2E uses `supertest` for HTTP assertions
- Unit tests use inline jest config (rootDir: `src`, testRegex: `.*\\.spec\\.ts$`)

## Linting
- ESLint flat config (`eslint.config.mjs`) with `@typescript-eslint/recommended-type-checked`
- `noImplicitAny: false` in tsconfig, `@typescript-eslint/no-explicit-any` off
- Prettier rule in ESLint sets `endOfLine: "auto"` (avoids CRLF issues on Windows)

## Docker Images

### File Structure
```
docker/
├── api/
│   ├── Dockerfile              # Multi-stage: build → production
│   ├── docker-compose.yml      # Standalone API (Windows host path)
│   └── docker-compose.mac.yml  # Standalone API (macOS — no changes needed)
├── db/
│   ├── Dockerfile              # Wraps postgres:16-alpine with credentials
│   ├── docker-compose.yml      # Standalone DB (Windows host path)
│   ├── docker-compose.mac.yml  # Standalone DB (named volume pgdata)
│   └── init/                   # Optional SQL init scripts
docker-compose.mac.yml            # Full stack (named volume pgdata)
scripts/
├── mac/
│   ├── build-api.sh            # macOS — build API image
│   ├── build-db.sh             # macOS — build DB image
│   └── cleanup.sh              # macOS — start/stop/reset/nuke
├── win/
│   ├── build-api.bat           # Windows — build API image
│   ├── build-db.bat            # Windows — build DB image
│   └── cleanup.bat             # Windows — start/stop/reset/nuke
├── build-api.sh                # Cross-platform (bash)
├── build-db.sh                 # Cross-platform (bash)
└── cleanup.sh                  # Cross-platform (bash)
```

### Platform-Specific Compose Files

| File | Target | Volume |
|---|---|---|
| `docker-compose.yml` | Windows 11 | `C:\data\pgdata` (host path) |
| `docker-compose.mac.yml` | macOS | `pgdata` (named Docker volume) |
| `docker/db/docker-compose.yml` | Windows 11 | `C:\data\pgdata` (host path) |
| `docker/db/docker-compose.mac.yml` | macOS | `pgdata` (named Docker volume) |
| `docker/api/docker-compose.yml` | Any | No DB volume |
| `docker/api/docker-compose.mac.yml` | Any | No DB volume |

### Building Individually

**macOS:**
```bash
# API image
IMAGE_NAME=my-nest-api TAG=latest bash scripts/mac/build-api.sh

# DB image
IMAGE_NAME=my-nest-api-db TAG=latest bash scripts/mac/build-db.sh
```

**Windows:**
```bat
rem API image
scripts\win\build-api.bat

rem DB image
scripts\win\build-db.bat
```

### Running with docker-compose (dev)

**macOS (uses named volume for Postgres data):**
```bash
# Full stack
docker compose -f docker-compose.mac.yml up -d

# DB only
docker compose -f docker/db/docker-compose.mac.yml up -d

# API only (needs DATABASE_URL set or DB running)
docker compose -f docker/api/docker-compose.mac.yml up -d
```

**Windows 11:**
```bash
# Full stack
docker compose up -d

# DB only
docker compose -f docker/db/docker-compose.yml up -d

# API only (needs DATABASE_URL set or DB running)
docker compose -f docker/api/docker-compose.yml up -d
```

### Startup Order
1. Start DB first: `docker compose -f <platform-file> up -d db`
2. Wait for healthcheck to pass
3. Start API: `docker compose -f <platform-file> up -d api`

### Cleanup

**macOS:**
```bash
bash scripts/mac/cleanup.sh [start|stop|reset|nuke]
```

**Windows:**
```bat
scripts\win\cleanup.bat [start|stop|reset|nuke]
```

### Environment Variables
- **API**: `DATABASE_URL` (connection string, takes precedence) or individual `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- **DB**: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (all have defaults)

### Resource Limits
All containers capped via `deploy.resources.limits`:
- **CPU**: 2 cores (max)
- **RAM**: 2 GB (max)

### DB Volume

**Windows 11:** Host-mounted path for data persistence:
```
C:\data\pgdata:/var/lib/postgresql/data
```

**macOS:** Docker named volume (automatically managed, better I/O performance):
```
pgdata:/var/lib/postgresql/data
```
The named volume is created automatically the first time you run. To inspect or remove:
```bash
docker volume ls
docker volume rm my-nest-api_pgdata
```
