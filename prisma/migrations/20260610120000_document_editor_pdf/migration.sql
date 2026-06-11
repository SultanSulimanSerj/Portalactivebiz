-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "DocumentEditorStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable Document
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "editorStatus" "DocumentEditorStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "contentJson" JSONB;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "sourceMeta" JSONB;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "lastExportedAt" TIMESTAMP(3);
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "hasUnpublishedChanges" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "numberAllocated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "pdfFileName" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "pdfFilePath" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "pdfFileSize" INTEGER;

-- AlterTable DocumentVersion
ALTER TABLE "DocumentVersion" ADD COLUMN IF NOT EXISTS "contentJson" JSONB;
ALTER TABLE "DocumentVersion" ADD COLUMN IF NOT EXISTS "comment" TEXT;
ALTER TABLE "DocumentVersion" ADD COLUMN IF NOT EXISTS "pdfFileName" TEXT;
ALTER TABLE "DocumentVersion" ADD COLUMN IF NOT EXISTS "pdfFilePath" TEXT;
ALTER TABLE "DocumentVersion" ADD COLUMN IF NOT EXISTS "pdfFileSize" INTEGER;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Document_editorStatus_idx" ON "Document"("editorStatus");
