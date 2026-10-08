CREATE TYPE "AccountTokenType" AS ENUM ('PASSWORD_RESET', 'MEMBERSHIP_INVITE');

CREATE TABLE "AccountToken" (
    "id" TEXT NOT NULL,
    "type" "AccountTokenType" NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "membershipId" TEXT,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccountToken_tokenHash_key" ON "AccountToken"("tokenHash");
CREATE INDEX "AccountToken_email_type_createdAt_idx" ON "AccountToken"("email", "type", "createdAt");
CREATE INDEX "AccountToken_membershipId_type_consumedAt_idx" ON "AccountToken"("membershipId", "type", "consumedAt");
CREATE INDEX "AccountToken_expiresAt_idx" ON "AccountToken"("expiresAt");

ALTER TABLE "AccountToken" ADD CONSTRAINT "AccountToken_membershipId_fkey"
    FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountToken" ADD CONSTRAINT "AccountToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
