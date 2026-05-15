# Drizzle to Prisma Migration Design

**Date:** 2026-05-15
**Status:** Approved (no testing)

## Goal

Replace Drizzle ORM with Prisma ORM throughout the NestJS project while preserving all existing functionality, database schema, and API behavior.

## Current State

The project uses Drizzle ORM with:
- `src/database/schema/users.ts` — `pgTable` definition for users
- `src/database/database.provider.ts` — `drizzle()` factory with `pg.Pool`, injected via `Symbol('DRIZZLE')`
- `src/database/seed.ts` — Drizzle-based seed script
- `src/users/users.service.ts` — Drizzle query builder calls
- `drizzle.config.ts` — Drizzle Kit configuration
- `package.json` — `db:generate`, `db:push`, `db:migrate`, `db:seed` scripts

## Architecture

### Prisma Schema

Single `prisma/schema.prisma` file replacing `src/database/schema/`:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @default(now()) @map("updated_at")

  @@map("users")
}
```

This maps exactly to the existing `users` table structure, preserving column names and constraints.

### Database Provider

`src/database/prisma.provider.ts` replaces `database.provider.ts`:
- Wraps `PrismaClient` in a NestJS provider
- Implements `OnModuleInit` (connect) and `OnModuleDestroy` (disconnect)
- Injected via `Symbol('PRISMA')` using the same global module pattern

### Service Layer

`src/users/users.service.ts` rewritten:
- `findAll()` → `prisma.user.findMany()`
- `findOne(id)` → `prisma.user.findUnique({ where: { id } })`
- `create(dto)` → `prisma.user.create({ data: dto })`
- `update(id, dto)` → `prisma.user.update({ where: { id }, data: dto })`
- `remove(id)` → `prisma.user.delete({ where: { id } })`

### Seed Script

`prisma/seed.ts` replaces `src/database/seed.ts`:
- Uses `PrismaClient` directly
- Same sample data, same "skip if exists" logic

## File Changes

| Action | File |
|---|---|
| Create | `prisma/schema.prisma` |
| Create | `prisma/seed.ts` |
| Create | `src/database/prisma.provider.ts` |
| Modify | `src/database/database.module.ts` — swap provider |
| Modify | `src/users/users.service.ts` — rewrite to Prisma API |
| Modify | `package.json` — replace Drizzle deps/scripts with Prisma |
| Delete | `drizzle.config.ts` |
| Delete | `src/database/schema/` (entire directory) |
| Delete | `src/database/seed.ts` |

## Migration Strategy

1. Install `prisma` and `@prisma/client`, remove Drizzle packages
2. Create `schema.prisma` matching existing table structure
3. Run `prisma migrate dev` to baseline the migration history
4. Rewrite database provider, service, and seed script
5. Remove all Drizzle files
6. Verify with `npm run build`

## Error Handling

- Prisma throws `PrismaClientKnownRequestError` for constraint violations — these bubble up unchanged (same as current Drizzle behavior)
- `findOne` returns `null` when not found (preserved)
- No additional error handling layers added (YAGNI)
