ALTER TABLE "engineer_salaries"
  ADD COLUMN IF NOT EXISTS "allowanceItems" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "deductionItems" JSONB NOT NULL DEFAULT '[]'::jsonb;
