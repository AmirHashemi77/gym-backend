/*
  Warnings:

  - Added the required column `durationDays` to the `Program` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Program" ADD COLUMN "durationDays" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Program" ALTER COLUMN "durationDays" DROP DEFAULT;
