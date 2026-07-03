/*
  Warnings:

  - You are about to drop the column `bakaiPassword` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `bakaiToken` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `bakaiUsername` on the `Business` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Business" DROP COLUMN "bakaiPassword",
DROP COLUMN "bakaiToken",
DROP COLUMN "bakaiUsername",
ADD COLUMN     "finikAccountId" TEXT,
ADD COLUMN     "finikApiKey" TEXT,
ADD COLUMN     "finikPrivateKeyEncrypted" TEXT,
ADD COLUMN     "finikPublicKey" TEXT;
