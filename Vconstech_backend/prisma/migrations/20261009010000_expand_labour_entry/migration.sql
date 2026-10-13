-- Extend the original attendance table into the detailed labour-entry sheet.
-- Defaults keep any existing attendance rows valid.
ALTER TABLE "LabourAttendance"
  ADD COLUMN "projectId" INTEGER,
  ADD COLUMN "headWage" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "headDayType" TEXT NOT NULL DEFAULT 'FULL_DAY',
  ADD COLUMN "fullHelpers" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "halfHelpers" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "helperRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "entryStatus" TEXT NOT NULL DEFAULT 'DRAFT';

CREATE INDEX "LabourAttendance_projectId_idx" ON "LabourAttendance"("projectId");

ALTER TABLE "LabourAttendance"
  ADD CONSTRAINT "LabourAttendance_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
