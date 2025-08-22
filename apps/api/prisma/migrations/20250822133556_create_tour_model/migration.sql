-- CreateTable
CREATE TABLE "public"."Tour" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "providerId" TEXT NOT NULL,

    CONSTRAINT "Tour_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Tour" ADD CONSTRAINT "Tour_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
