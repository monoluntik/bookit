-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "isDeposit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totalAmount" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "depositAmount" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "depositAmount" DECIMAL(10,2);
