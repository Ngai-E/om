/*
  Warnings:

  - You are about to drop the column `soldCount` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `soldCountInflation` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `usageCount` on the `promotions` table. All the data in the column will be lost.
  - You are about to drop the column `usageCountInflation` on the `promotions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "soldCount",
DROP COLUMN "soldCountInflation";

-- AlterTable
ALTER TABLE "promotions" DROP COLUMN "usageCount",
DROP COLUMN "usageCountInflation";
