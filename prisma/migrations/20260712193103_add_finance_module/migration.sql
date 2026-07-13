/*
  Warnings:

  - The `status` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'UNPAID';

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "amountPaid" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Expense_tenantId_idx" ON "Expense"("tenantId");

-- CreateIndex
CREATE INDEX "Expense_expenseDate_idx" ON "Expense"("expenseDate");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");
