CREATE TABLE IF NOT EXISTS "crm_invitations" (
  "id" SERIAL PRIMARY KEY,
  "idempotencyKey" TEXT NOT NULL,
  "crmLeadId" TEXT NOT NULL,
  "crmCustomerId" TEXT NOT NULL,
  "invitationId" TEXT,
  "erpCustomerId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'INVITED',
  "companyId" TEXT NOT NULL,
  "clientId" INTEGER NOT NULL,
  "registeredUserId" TEXT,
  "requestPayload" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "registeredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "crm_invitations_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "crm_invitations_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "crm_invitations_registeredUserId_fkey"
    FOREIGN KEY ("registeredUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "clientId" INTEGER,
  ADD COLUMN IF NOT EXISTS "crmLeadId" TEXT,
  ADD COLUMN IF NOT EXISTS "crmCustomerId" TEXT,
  ADD COLUMN IF NOT EXISTS "erpCustomerId" TEXT,
  ADD COLUMN IF NOT EXISTS "accountStatus" TEXT NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "crm_invitations"
  ADD COLUMN IF NOT EXISTS "registeredUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "registeredAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "crm_invitations_idempotencyKey_key"
ON "crm_invitations" ("idempotencyKey");

CREATE UNIQUE INDEX IF NOT EXISTS "crm_invitations_crmLeadId_key"
ON "crm_invitations" ("crmLeadId");

CREATE UNIQUE INDEX IF NOT EXISTS "crm_invitations_crmCustomerId_key"
ON "crm_invitations" ("crmCustomerId");

CREATE UNIQUE INDEX IF NOT EXISTS "crm_invitations_invitationId_key"
ON "crm_invitations" ("invitationId");

CREATE INDEX IF NOT EXISTS "crm_invitations_companyId_idx"
ON "crm_invitations" ("companyId");

CREATE INDEX IF NOT EXISTS "crm_invitations_clientId_idx"
ON "crm_invitations" ("clientId");

CREATE INDEX IF NOT EXISTS "crm_invitations_registeredUserId_idx"
ON "crm_invitations" ("registeredUserId");

CREATE INDEX IF NOT EXISTS "crm_invitations_status_idx"
ON "crm_invitations" ("status");

CREATE INDEX IF NOT EXISTS "User_clientId_idx"
ON "User" ("clientId");

CREATE INDEX IF NOT EXISTS "User_crmLeadId_idx"
ON "User" ("crmLeadId");

CREATE INDEX IF NOT EXISTS "User_crmCustomerId_idx"
ON "User" ("crmCustomerId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'User_clientId_fkey'
  ) THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_invitations_registeredUserId_fkey'
  ) THEN
    ALTER TABLE "crm_invitations"
      ADD CONSTRAINT "crm_invitations_registeredUserId_fkey"
      FOREIGN KEY ("registeredUserId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
