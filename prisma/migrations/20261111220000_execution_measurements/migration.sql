-- Execution measurements: immutable quantity and unit-cost snapshot per record.
CREATE TYPE "MeasurementStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

CREATE TABLE "ExecutionMeasurement" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "workItemId" TEXT NOT NULL,
  "createdByUserId" TEXT,
  "measuredOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "periodStart" TIMESTAMP(3),
  "periodEnd" TIMESTAMP(3),
  "quantity" DECIMAL(18,4) NOT NULL,
  "unitPriceAtMeasurement" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "status" "MeasurementStatus" NOT NULL DEFAULT 'DRAFT',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExecutionMeasurement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ExecutionMeasurement_projectId_measuredOn_idx"
  ON "ExecutionMeasurement"("projectId", "measuredOn");
CREATE INDEX "ExecutionMeasurement_workItemId_status_idx"
  ON "ExecutionMeasurement"("workItemId", "status");

ALTER TABLE "ExecutionMeasurement"
  ADD CONSTRAINT "ExecutionMeasurement_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExecutionMeasurement"
  ADD CONSTRAINT "ExecutionMeasurement_workItemId_fkey"
  FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
