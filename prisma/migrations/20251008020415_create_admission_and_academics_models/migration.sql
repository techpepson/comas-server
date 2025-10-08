-- CreateTable
CREATE TABLE "Admission" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "passportPhoto" TEXT NOT NULL,
    "supportingDocument" TEXT,
    "idCardPhoto" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "email" TEXT NOT NULL,
    "nationality" TEXT,
    "postalAddress" TEXT,
    "maritalStatus" TEXT,
    "languages" TEXT[],
    "programChoice" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "addressOfReference" TEXT NOT NULL,
    "phoneOfReference" TEXT NOT NULL,
    "emailOfReference" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "parentPhoneNumber" TEXT NOT NULL,
    "parentEmail" TEXT,
    "parentAddress" TEXT,
    "sponsor" TEXT NOT NULL,
    "declarationDocument" TEXT,

    CONSTRAINT "Admission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Academics" (
    "id" TEXT NOT NULL,
    "qualification" TEXT[],
    "institution" TEXT[],
    "yearOfCompletion" TEXT[],
    "country" TEXT[],
    "file" TEXT[],
    "startDate" TIMESTAMP(3)[],
    "uniqueId" TEXT NOT NULL,
    "endDate" TIMESTAMP(3)[],

    CONSTRAINT "Academics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Academics_uniqueId_key" ON "Academics"("uniqueId");

-- AddForeignKey
ALTER TABLE "Academics" ADD CONSTRAINT "Academics_uniqueId_fkey" FOREIGN KEY ("uniqueId") REFERENCES "Admission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
