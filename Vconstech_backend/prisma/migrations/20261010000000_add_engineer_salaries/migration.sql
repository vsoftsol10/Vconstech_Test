CREATE TABLE "engineer_salaries" (
    "id" SERIAL NOT NULL,
    "engineerId" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "engineer_salaries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "engineer_salaries_engineerId_effectiveFrom_idx" ON "engineer_salaries"("engineerId", "effectiveFrom");
CREATE INDEX "engineer_salaries_companyId_idx" ON "engineer_salaries"("companyId");

ALTER TABLE "engineer_salaries" ADD CONSTRAINT "engineer_salaries_engineerId_fkey"
  FOREIGN KEY ("engineerId") REFERENCES "engineers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "engineer_salaries" ADD CONSTRAINT "engineer_salaries_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
