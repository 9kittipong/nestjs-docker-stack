import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({});

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
