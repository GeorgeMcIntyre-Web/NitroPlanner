/*
  Warnings:

  - You are about to drop the column `lastLogin` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "lastLogin",
ADD COLUMN     "backupCodes" JSONB,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT,
ALTER COLUMN "role" SET DEFAULT 'TECHNICIAN';
