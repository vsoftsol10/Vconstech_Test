// src/config/database.js or src/lib/prisma.js
import { PrismaClient } from '@prisma/client';
import { requestTimingContext } from './requestTimingContext.js';

const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: [
    'error',
    'warn',
    { emit: 'event', level: 'query' },
  ],
});

// Temporary diagnostics: log slow query durations and route only, never SQL or parameters.
prisma.$on('query', (event) => {
  if (event.duration < 250) return;

  const request = requestTimingContext.getStore();
  console.warn(JSON.stringify({
    type: 'slow_db_query',
    method: request?.method,
    path: request?.path,
    durationMs: event.duration,
  }));
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
