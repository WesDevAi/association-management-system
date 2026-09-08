-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN "meetingNumber" TEXT,
ADD COLUMN "agenda" TEXT,
ADD COLUMN "notes" TEXT;

-- CreateIndex (nullable unique: PostgreSQL allows multiple NULLs)
CREATE UNIQUE INDEX "Meeting_associationId_meetingNumber_key" ON "Meeting"("associationId", "meetingNumber");
