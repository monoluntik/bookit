-- Drop old email+password auth
DROP INDEX "User_email_key";
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" DROP COLUMN "passwordHash";

-- Phone becomes the unique login identifier
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- New auth enums
CREATE TYPE "AuthChannel" AS ENUM ('TELEGRAM', 'SMS');
CREATE TYPE "AuthChallengeStatus" AS ENUM ('PENDING', 'CONFIRMED', 'EXPIRED');

-- AuthChallenge: pending name+phone verification via Telegram or SMS
CREATE TABLE "AuthChallenge" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "AuthChannel" NOT NULL,
    "codeHash" TEXT,
    "telegramToken" TEXT,
    "status" "AuthChallengeStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3),
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthChallenge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthChallenge_telegramToken_key" ON "AuthChallenge"("telegramToken");

-- Session: long-lived refresh sessions (~1y, sliding, revocable)
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Session_refreshTokenHash_key" ON "Session"("refreshTokenHash");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
