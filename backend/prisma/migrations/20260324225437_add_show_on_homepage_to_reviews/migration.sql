-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "showOnHomepage" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "reviews_showOnHomepage_idx" ON "reviews"("showOnHomepage");
