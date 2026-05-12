# PostgreSQL + Drizzle ORM + Users CRUD

## Overview

Add PostgreSQL database with Drizzle ORM to the existing NestJS 11 project, with a `users` CRUD API.

## Architecture

```
Dev (Windows 11)              Prod (Docker)
┌──────────────┐              ┌──────────────────┐
│  NestJS App  │              │  NestJS Container │
│  (npm start) │              │  (Dockerfile)     │
│       │      │              │       │           │
│  Drizzle ORM │              │  Drizzle ORM      │
│       │      │              │       │           │
│  PG Client   │              │  PG Client        │
└──────┬───────┘              └──────┬────────────┘
       │ localhost:5432              │ postgres:5432
┌──────┴───────┐              ┌──────┴────────────┐
│  PostgreSQL  │              │  PostgreSQL        │
│  (Win svc)   │              │  Container         │
└──────────────┘              └───────────────────┘
```

### Component Layout

```
docker-compose.yml              # PostgreSQL + app for prod
drizzle.config.ts               # Drizzle Kit config
.env                            # dev DB connection string
src/
├── main.ts
├── app.module.ts               # imports DatabaseModule + UsersModule
├── database/
│   ├── database.module.ts      # exports Drizzle provider
│   ├── database.provider.ts    # creates NodePgDatabase via pg Pool
│   └── schema/
│       └── users.ts            # table definition
└── users/
    ├── users.module.ts
    ├── users.controller.ts
    ├── users.service.ts
    └── dto/
        ├── create-user.dto.ts
        └── update-user.dto.ts
```

## Endpoints

| Method | Path | Body |
|--------|------|------|
| GET | `/users` | — |
| GET | `/users/:id` | — |
| POST | `/users` | `{ name, email }` |
| PATCH | `/users/:id` | `{ name?, email? }` |
| DELETE | `/users/:id` | — |

## Data Flow

Controller → Service (injects Drizzle DB) → Drizzle ORM → pg Pool → PostgreSQL

## Dependencies

Runtime: `drizzle-orm`, `pg`, `@nestjs/config`
Dev: `drizzle-kit`, `@types/pg`

## Migration Strategy

- Define schema in code (`src/database/schema/`)
- `drizzle-kit generate` creates SQL migration files
- `drizzle-kit push` applies to dev DB

## Setup Steps

1. Install PostgreSQL 17 natively on Windows 11 (winget or EDB installer)
2. Create database `my_nest_api` and user
3. Install npm dependencies
4. Configure `.env`
5. Generate and push initial migration
6. Run app with `npm run start:dev`

## Prod Docker Setup

- `docker-compose.yml` with PostgreSQL service + app service
- `Dockerfile` already exists
- Environment variables override for DB connection
