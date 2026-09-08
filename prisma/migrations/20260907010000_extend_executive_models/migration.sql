-- AlterEnum
ALTER TYPE "ExecutiveAppointmentStatus" ADD VALUE IF NOT EXISTS 'RESIGNED';
ALTER TYPE "ExecutiveAppointmentStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';

-- CreateEnum
CREATE TYPE "ExecutiveAppointmentType" AS ENUM ('ELECTED', 'APPOINTED', 'ACTING', 'INTERIM');

-- AlterTable
ALTER TABLE "ExecutivePosition" ADD COLUMN "description" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "maxOccupants" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "ExecutiveAppointment" ADD COLUMN "appointmentType" "ExecutiveAppointmentType" NOT NULL DEFAULT 'APPOINTED',
ADD COLUMN "notes" TEXT;

-- CreateIndex
CREATE INDEX "ExecutiveAppointment_status_idx" ON "ExecutiveAppointment"("status");
