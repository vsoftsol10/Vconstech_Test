ALTER TABLE "engineer_salaries" ADD COLUMN "projectId" INTEGER;
CREATE INDEX "engineer_salaries_projectId_idx" ON "engineer_salaries"("projectId");
ALTER TABLE "engineer_salaries" ADD CONSTRAINT "engineer_salaries_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
