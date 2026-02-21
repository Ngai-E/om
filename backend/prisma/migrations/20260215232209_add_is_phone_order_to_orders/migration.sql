-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "isPhoneOrder" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "orders_isPhoneOrder_idx" ON "orders"("isPhoneOrder");
