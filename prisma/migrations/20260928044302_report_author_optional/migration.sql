-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_generatedById_fkey";

-- AlterTable
ALTER TABLE "Report" ALTER COLUMN "generatedById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
