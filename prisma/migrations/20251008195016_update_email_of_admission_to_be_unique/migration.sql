-- DropForeignKey
ALTER TABLE "public"."Academics" DROP CONSTRAINT "Academics_uniqueId_fkey";

-- AddForeignKey
ALTER TABLE "Academics" ADD CONSTRAINT "Academics_uniqueId_fkey" FOREIGN KEY ("uniqueId") REFERENCES "Admission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
