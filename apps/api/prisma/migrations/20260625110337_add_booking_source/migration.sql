-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "guestName" TEXT,
ADD COLUMN     "guestPhone" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'ONLINE';
