-- Add status to engineers and backfill existing records safely
ALTER TABLE "engineers"
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'Active';

UPDATE "engineers"
SET "status" = 'Active'
WHERE "status" IS NULL
   OR TRIM("status") = '';
