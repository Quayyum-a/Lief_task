import { PrismaClient } from '@prisma/client';

// Server-side Prisma client for serverless functions that need the full engine
// (e.g., NextAuth, complex queries, migrations, etc.)
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prismaServer =
  globalThis.__prisma ??
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prismaServer;
}
