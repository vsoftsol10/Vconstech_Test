ALTER TABLE "engineers" ADD COLUMN "email" TEXT;

CREATE INDEX "engineers_email_idx" ON "engineers"("email");

CREATE UNIQUE INDEX "engineers_email_companyId_key" ON "engineers"("email", "companyId");
