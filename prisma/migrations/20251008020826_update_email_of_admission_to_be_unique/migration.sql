/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Admission` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Admission_email_key" ON "Admission"("email");
