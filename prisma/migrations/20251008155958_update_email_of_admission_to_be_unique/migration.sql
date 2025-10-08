/*
  Warnings:

  - You are about to drop the column `file` on the `Academics` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Academics" DROP COLUMN "file",
ADD COLUMN     "supportingCertificates" TEXT[];
