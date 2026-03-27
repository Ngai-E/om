/*
  Warnings:

  - You are about to drop the column `showSoldCount` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `showUsageCount` on the `promotions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "showSoldCount",
ADD COLUMN     "orderCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "promotions" DROP COLUMN "showUsageCount",
ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0;
