-- CreateEnum
CREATE TYPE "DocumentExportJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN "exportContentHash" TEXT;

-- CreateTable
CREATE TABLE "DocumentExportJob" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "status" "DocumentExportJobStatus" NOT NULL DEFAULT 'QUEUED',
    "contentHash" TEXT NOT NULL,
    "publish" BOOLEAN NOT NULL DEFAULT false,
    "comment" TEXT,
    "errorMessage" TEXT,
    "bullJobId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentExportJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentExportJob_documentId_status_idx" ON "DocumentExportJob"("documentId", "status");

-- CreateIndex
CREATE INDEX "DocumentExportJob_companyId_createdAt_idx" ON "DocumentExportJob"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentExportJob_requestedById_createdAt_idx" ON "DocumentExportJob"("requestedById", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentExportJob_status_createdAt_idx" ON "DocumentExportJob"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "DocumentExportJob" ADD CONSTRAINT "DocumentExportJob_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentExportJob" ADD CONSTRAINT "DocumentExportJob_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentExportJob" ADD CONSTRAINT "DocumentExportJob_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
