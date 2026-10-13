CREATE TABLE "LabourAttendance" (
  "id" SERIAL NOT NULL,
  "labourId" INTEGER NOT NULL,
  "companyId" TEXT NOT NULL,
  "projectId" INTEGER,
  "attendanceDate" TIMESTAMP(3) NOT NULL,
  "headWage" DOUBLE PRECISION NOT NULL,
  "headDayType" TEXT NOT NULL DEFAULT 'FULL_DAY',
  "fullHelpers" INTEGER NOT NULL DEFAULT 0,
  "halfHelpers" INTEGER NOT NULL DEFAULT 0,
  "helperRate" DOUBLE PRECISION NOT NULL,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "entryStatus" TEXT NOT NULL DEFAULT 'DRAFT',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LabourAttendance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LabourAttendance_labourId_attendanceDate_key" ON "LabourAttendance"("labourId", "attendanceDate");
CREATE INDEX "LabourAttendance_companyId_attendanceDate_idx" ON "LabourAttendance"("companyId", "attendanceDate");
CREATE INDEX "LabourAttendance_labourId_idx" ON "LabourAttendance"("labourId");
CREATE INDEX "LabourAttendance_projectId_idx" ON "LabourAttendance"("projectId");
ALTER TABLE "LabourAttendance" ADD CONSTRAINT "LabourAttendance_labourId_fkey" FOREIGN KEY ("labourId") REFERENCES "Labour"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LabourAttendance" ADD CONSTRAINT "LabourAttendance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LabourAttendance" ADD CONSTRAINT "LabourAttendance_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
