-- Add nullable project relation for project-scoped notifications.
-- Existing notifications remain valid with projectId = NULL.
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "projectId" INTEGER;

CREATE INDEX IF NOT EXISTS "Notification_projectId_idx" ON "Notification"("projectId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Notification_projectId_fkey'
  ) THEN
    ALTER TABLE "Notification"
      ADD CONSTRAINT "Notification_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
