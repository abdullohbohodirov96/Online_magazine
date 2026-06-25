import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  const globalWithPrisma = global as typeof globalThis & {
    prisma?: PrismaClient;
    pool?: Pool;
  };
  if (!globalWithPrisma.prisma) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool);
    globalWithPrisma.pool = pool;
    globalWithPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalWithPrisma.prisma;
}

export { prisma };
