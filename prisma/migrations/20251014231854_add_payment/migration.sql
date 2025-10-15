/*
  Warnings:

  - You are about to drop the column `paymentId` on the `ApplicantData` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Payment_userId_key";

-- AlterTable
ALTER TABLE "ApplicantData" DROP COLUMN "paymentId";
