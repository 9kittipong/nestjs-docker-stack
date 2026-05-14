import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { users } from './schema/users';

const sampleUsers = [
  { name: 'Alice Johnson', email: 'alice@example.com' },
  { name: 'Bob Smith', email: 'bob@example.com' },
  { name: 'Charlie Brown', email: 'charlie@example.com' },
  { name: 'Diana Prince', email: 'diana@example.com' },
  { name: 'Eve Miller', email: 'eve@example.com' },
];

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema: { users } });

  const existing = await db.select().from(users);
  if (existing.length > 0) {
    console.log(`Users table already has ${existing.length} rows — skipping seed`);
    await pool.end();
    return;
  }

  const inserted = await db.insert(users).values(sampleUsers).returning();
  console.log(`Seeded ${inserted.length} users:`);
  inserted.forEach((u) => console.log(`  ${u.id}: ${u.name} <${u.email}>`));

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
