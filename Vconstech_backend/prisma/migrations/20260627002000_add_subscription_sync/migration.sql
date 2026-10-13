ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "trialStartDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "trialEndDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "subscriptionStartedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "subscriptionPlan" TEXT;

CREATE INDEX IF NOT EXISTS "User_subscriptionStatus_idx"
ON "User" ("subscriptionStatus");

CREATE INDEX IF NOT EXISTS "User_phoneNumber_idx"
ON "User" ("phoneNumber");

CREATE TABLE IF NOT EXISTS "customer_subscriptions" (
  "id" SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "crmCustomerId" TEXT NOT NULL,
  "erpCustomerId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "plan" TEXT,
  "trialStartDate" TIMESTAMP(3),
  "trialEndDate" TIMESTAMP(3),
  "purchaseDate" TIMESTAMP(3),
  "crmSyncedAt" TIMESTAMP(3),
  "crmSyncStatus" TEXT,
  "crmSyncPayload" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "customer_subscriptions_eventId_key"
ON "customer_subscriptions" ("eventId");

CREATE INDEX IF NOT EXISTS "customer_subscriptions_userId_idx"
ON "customer_subscriptions" ("userId");

CREATE INDEX IF NOT EXISTS "customer_subscriptions_crmCustomerId_idx"
ON "customer_subscriptions" ("crmCustomerId");

CREATE INDEX IF NOT EXISTS "customer_subscriptions_erpCustomerId_idx"
ON "customer_subscriptions" ("erpCustomerId");

CREATE INDEX IF NOT EXISTS "customer_subscriptions_status_idx"
ON "customer_subscriptions" ("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customer_subscriptions_userId_fkey'
  ) THEN
    ALTER TABLE "customer_subscriptions"
      ADD CONSTRAINT "customer_subscriptions_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
