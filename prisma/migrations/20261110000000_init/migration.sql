CREATE TYPE "MembershipRole" AS ENUM ('OWNER','ADMIN','BUDGET_MANAGER','ENGINEER','FINANCE','VIEWER');
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT','BUDGETING','APPROVED','IN_PROGRESS','ON_HOLD','COMPLETED','CANCELLED');
CREATE TYPE "ResourceType" AS ENUM ('MATERIAL','LABOUR','EQUIPMENT','SUBCONTRACT','OTHER');
CREATE TYPE "RevisionStatus" AS ENUM ('DRAFT','SUBMITTED','APPROVED','REJECTED','SUPERSEDED');

CREATE TABLE "Company" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "nuit" TEXT, "baseCurrency" TEXT NOT NULL DEFAULT 'MZN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "User" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT NOT NULL, "passwordHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Membership" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "companyId" TEXT NOT NULL,
  "role" "MembershipRole" NOT NULL DEFAULT 'VIEWER', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Project" (
  "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL,
  "clientName" TEXT, "location" TEXT, "currency" TEXT NOT NULL DEFAULT 'MZN',
  "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT', "startDate" TIMESTAMP(3), "endDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "WorkItem" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "parentId" TEXT, "code" TEXT NOT NULL, "name" TEXT NOT NULL,
  "description" TEXT, "unit" TEXT, "quantity" DECIMAL(18,4) NOT NULL DEFAULT 0, "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "WorkItem_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Supplier" (
  "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "name" TEXT NOT NULL, "nuit" TEXT, "contactName" TEXT,
  "email" TEXT, "phone" TEXT, "address" TEXT, "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Resource" (
  "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "supplierId" TEXT, "code" TEXT NOT NULL, "name" TEXT NOT NULL,
  "type" "ResourceType" NOT NULL, "unit" TEXT NOT NULL, "unitPrice" DECIMAL(18,4) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'MZN', "productivity" DECIMAL(18,6), "importCost" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "transportCost" DECIMAL(18,4) NOT NULL DEFAULT 0, "otherCost" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CostComposition" (
  "id" TEXT NOT NULL, "workItemId" TEXT NOT NULL, "version" INTEGER NOT NULL DEFAULT 1,
  "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CostComposition_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CompositionLine" (
  "id" TEXT NOT NULL, "compositionId" TEXT NOT NULL, "resourceId" TEXT NOT NULL,
  "coefficient" DECIMAL(18,6) NOT NULL, "unitPriceAtSave" DECIMAL(18,4) NOT NULL,
  CONSTRAINT "CompositionLine_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BudgetRevision" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "revisionNumber" INTEGER NOT NULL,
  "status" "RevisionStatus" NOT NULL DEFAULT 'DRAFT', "directCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "indirectCost" DECIMAL(18,2) NOT NULL DEFAULT 0, "overheadRate" DECIMAL(8,5) NOT NULL DEFAULT 0,
  "profitRate" DECIMAL(8,5) NOT NULL DEFAULT 0, "taxRate" DECIMAL(8,5) NOT NULL DEFAULT 0,
  "sellingPrice" DECIMAL(18,2) NOT NULL DEFAULT 0, "assumptions" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "submittedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3), "approvedByUserId" TEXT,
  CONSTRAINT "BudgetRevision_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "userId" TEXT, "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL, "entityId" TEXT NOT NULL, "beforeData" JSONB, "afterData" JSONB,
  "ipAddress" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Membership_userId_companyId_key" ON "Membership"("userId","companyId");
CREATE INDEX "Membership_companyId_role_idx" ON "Membership"("companyId","role");
CREATE UNIQUE INDEX "Project_companyId_code_key" ON "Project"("companyId","code");
CREATE INDEX "Project_companyId_status_idx" ON "Project"("companyId","status");
CREATE UNIQUE INDEX "WorkItem_projectId_code_key" ON "WorkItem"("projectId","code");
CREATE INDEX "WorkItem_projectId_parentId_sortOrder_idx" ON "WorkItem"("projectId","parentId","sortOrder");
CREATE INDEX "Supplier_companyId_name_idx" ON "Supplier"("companyId","name");
CREATE UNIQUE INDEX "Resource_companyId_code_key" ON "Resource"("companyId","code");
CREATE INDEX "Resource_companyId_type_isActive_idx" ON "Resource"("companyId","type","isActive");
CREATE UNIQUE INDEX "CostComposition_workItemId_version_key" ON "CostComposition"("workItemId","version");
CREATE UNIQUE INDEX "CompositionLine_compositionId_resourceId_key" ON "CompositionLine"("compositionId","resourceId");
CREATE UNIQUE INDEX "BudgetRevision_projectId_revisionNumber_key" ON "BudgetRevision"("projectId","revisionNumber");
CREATE INDEX "BudgetRevision_projectId_status_idx" ON "BudgetRevision"("projectId","status");
CREATE INDEX "AuditLog_companyId_createdAt_idx" ON "AuditLog"("companyId","createdAt");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType","entityId");

ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "WorkItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CostComposition" ADD CONSTRAINT "CostComposition_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompositionLine" ADD CONSTRAINT "CompositionLine_compositionId_fkey" FOREIGN KEY ("compositionId") REFERENCES "CostComposition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompositionLine" ADD CONSTRAINT "CompositionLine_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BudgetRevision" ADD CONSTRAINT "BudgetRevision_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
