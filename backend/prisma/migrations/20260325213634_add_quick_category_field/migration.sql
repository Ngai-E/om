-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "isQuickCategory" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "categories_isQuickCategory_idx" ON "categories"("isQuickCategory");
