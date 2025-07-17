
import { PrismaClient } from '@prisma/client';

// Prisma's `singleton` pattern for efficient connection management.
// Ensures that only one instance of PrismaClient is created in the application.
// This is crucial in serverless environments like Next.js to prevent exhausting database connections.

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
