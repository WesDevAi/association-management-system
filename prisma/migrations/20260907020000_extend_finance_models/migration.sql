-- AlterTable
ALTER TABLE "PaymentCategory" ADD COLUMN "description" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
