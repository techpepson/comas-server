-- CreateTable
CREATE TABLE "ApplicantData" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "nationality" TEXT,
    "message" TEXT,

    CONSTRAINT "ApplicantData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApplicantData_email_key" ON "ApplicantData"("email");
