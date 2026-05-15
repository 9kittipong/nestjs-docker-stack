# Drizzle to Prisma Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all Drizzle ORM code with Prisma ORM while preserving existing API behavior and database schema.

**Architecture:** Install Prisma, create `schema.prisma` matching existing table, rewrite database provider and service layer, remove Drizzle entirely.

**Tech Stack:** Prisma, @prisma/client, NestJS 11, PostgreSQL 16, TypeScript

---

### Task 1: Install Prisma and Initialize Schema

**Files:**
- Create: `prisma/schema.prisma`
- Modify: `package.json`

- [ ] **Step 1: Install Prisma dependencies**

Run:
```bash
npm install prisma @prisma/client
```

Expected: `prisma` added to devDependencies, `@prisma/client` added to dependencies in `package.json`.

- [ ] **Step 2: Create Prisma schema file**

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @default(now()) @map("updated_at")

  @@map("users")
}
```

- [ ] **Step 3: Generate Prisma client**

Run:
```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client (vX.X.X) to ./node_modules/@prisma/client`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma package.json package-lock.json
git commit -m "feat: add Prisma ORM and initial schema"
```

---

### Task 2: Create Prisma Provider and Update Database Module

**Files:**
- Create: `src/database/prisma.provider.ts`
- Modify: `src/database/database.module.ts`

- [ ] **Step 1: Create Prisma provider**

Create `src/database/prisma.provider.ts`:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export const PRISMA = Symbol('PRISMA');

@Injectable()
export class PrismaProvider extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

export const prismaProvider = {
  provide: PRISMA,
  useClass: PrismaProvider,
};
```

- [ ] **Step 2: Update database module**

Replace contents of `src/database/database.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { prismaProvider } from './prisma.provider';

@Global()
@Module({
  providers: [prismaProvider],
  exports: [prismaProvider],
})
export class DatabaseModule {}
```

- [ ] **Step 3: Commit**

```bash
git add src/database/prisma.provider.ts src/database/database.module.ts
git commit -m "feat: replace Drizzle provider with Prisma provider"
```

---

### Task 3: Rewrite UsersService to Use Prisma

**Files:**
- Modify: `src/users/users.service.ts`

- [ ] **Step 1: Rewrite UsersService**

Replace contents of `src/users/users.service.ts`:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { PRISMA } from '../database/prisma.provider';
import { PrismaProvider } from '../database/prisma.provider';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@Inject(PRISMA) private prisma: PrismaProvider) {}

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(dto: CreateUserDto) {
    return this.prisma.user.create({ data: dto });
  }

  async update(id: number, dto: UpdateUserDto) {
    return this.prisma.user.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/users/users.service.ts
git commit -m "refactor: rewrite UsersService to use Prisma client"
```

---

### Task 4: Create Prisma Seed Script

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json`

- [ ] **Step 1: Create seed script**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleUsers = [
  { name: 'Alice Johnson', email: 'alice@example.com' },
  { name: 'Bob Smith', email: 'bob@example.com' },
  { name: 'Charlie Brown', email: 'charlie@example.com' },
  { name: 'Diana Prince', email: 'diana@example.com' },
  { name: 'Eve Miller', email: 'eve@example.com' },
];

async function seed() {
  const existing = await prisma.user.findMany();
  if (existing.length > 0) {
    console.log(
      `Users table already has ${existing.length} rows — skipping seed`,
    );
    return;
  }

  const inserted = await prisma.user.createMany({
    data: sampleUsers,
  });

  console.log(`Seeded ${inserted.count} users`);
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Update package.json seed script**

Add to `package.json` scripts section:

```json
"db:seed": "ts-node -r tsconfig-paths/register prisma/seed.ts"
```

- [ ] **Step 3: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add Prisma seed script"
```

---

### Task 5: Update package.json Scripts and Remove Drizzle

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Replace Drizzle scripts with Prisma scripts**

In `package.json`, replace the Drizzle scripts:

```json
"db:generate": "prisma generate",
"db:push": "prisma db push",
"db:migrate": "prisma migrate dev",
```

Remove `"db:seed": "ts-node -r tsconfig-paths/register src/database/seed.ts"` (already replaced in Task 4).

- [ ] **Step 2: Remove Drizzle dependencies**

Remove from `package.json` dependencies:
- `"drizzle-orm": "^0.45.2"`

Remove from `package.json` devDependencies:
- `"drizzle-kit": "^0.31.10"`

Keep `"pg"` in dependencies for now (may be needed by Prisma's PostgreSQL driver).

- [ ] **Step 3: Clean install**

Run:
```bash
npm install
```

Expected: Drizzle packages removed from `node_modules`, lock file updated.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: replace Drizzle scripts and dependencies with Prisma"
```

---

### Task 6: Delete Drizzle Files

**Files:**
- Delete: `drizzle.config.ts`
- Delete: `src/database/schema/index.ts`
- Delete: `src/database/schema/users.ts`
- Delete: `src/database/seed.ts`

- [ ] **Step 1: Remove Drizzle files**

Run:
```powershell
Remove-Item -LiteralPath "drizzle.config.ts"
Remove-Item -LiteralPath "src\database\schema\index.ts"
Remove-Item -LiteralPath "src\database\schema\users.ts"
Remove-Item -LiteralPath "src\database\seed.ts"
Remove-Item -Path "src\database\schema" -Recurse
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove all Drizzle ORM files"
```

---

### Task 7: Build and Verify

**Files:**
- No file changes

- [ ] **Step 1: Run build**

Run:
```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors. Output in `dist/`.

- [ ] **Step 2: Run lint**

Run:
```bash
npm run lint
```

Expected: No lint errors.

- [ ] **Step 3: Run format**

Run:
```bash
npm run format
```

Expected: Files formatted, no errors.

- [ ] **Step 4: Commit any lint/format fixes**

```bash
git add -A
git commit -m "style: apply lint and format fixes after migration"
```

---

### Task 8: Update AGENTS.md Documentation

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Update AGENTS.md commands table**

Replace the Drizzle commands section:

```markdown
| Command | What |
|---|---|
| `npm run db:generate` | `prisma generate` — generates Prisma Client |
| `npm run db:push` | `prisma db push` — pushes schema to DB without migration |
| `npm run db:migrate` | `prisma migrate dev` — creates and applies migration |
| `npm run db:seed` | `ts-node prisma/seed.ts` — seeds database with sample data |
```

- [ ] **Step 2: Update AGENTS.md architecture section**

Replace:
> Database accessed via custom `DRIZZLE` injection symbol (`Symbol('DRIZZLE')` from `src/database/database.provider.ts`)

With:
> Database accessed via custom `PRISMA` injection symbol (`Symbol('PRISMA')` from `src/database/prisma.provider.ts`)
> Prisma schema in `prisma/schema.prisma` — add new models there

- [ ] **Step 3: Update AGENTS.md DB Setup section**

Replace:
> After schema changes: `npm run db:generate` then `npm run db:push`
> Migration files in `drizzle/` — gitignored

With:
> After schema changes: `npm run db:migrate` (creates and applies migration)
> Migration files in `prisma/migrations/` — gitignored

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md
git commit -m "docs: update AGENTS.md for Prisma ORM"
```
