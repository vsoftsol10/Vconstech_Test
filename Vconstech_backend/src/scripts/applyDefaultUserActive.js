import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const migrationName = '20260828000000_default_user_active';

try {
  await prisma.$executeRawUnsafe('ALTER TABLE "User" ALTER COLUMN "isActive" SET DEFAULT true');

  const existingMigration = await prisma.$queryRawUnsafe(
    'SELECT 1 FROM "_prisma_migrations" WHERE migration_name = $1 LIMIT 1',
    migrationName
  );

  if (existingMigration.length === 0) {
    await prisma.$executeRawUnsafe(
      'INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES (gen_random_uuid()::text, $1, NOW(), $2, NULL, NULL, NOW(), 1)',
      'manual-default-user-active',
      migrationName
    );
  }

  console.log('User.isActive default is now true');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
