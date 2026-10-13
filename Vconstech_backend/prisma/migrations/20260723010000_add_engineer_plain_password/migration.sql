-- Add plainPassword to engineers so Prisma schema matches the database
ALTER TABLE "engineers"
ADD COLUMN IF NOT EXISTS "plainPassword" TEXT;
