# my-nest-api — agent instructions

## Stack
- NestJS v11 + TypeScript (`module: "nodenext"` in tsconfig)
- PostgreSQL 16 + Drizzle ORM (`drizzle-orm` + `drizzle-kit`)
- Docker (node:20-alpine, postgres:16-alpine via docker-compose)

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
- Start DB: `docker compose up -d db`
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
