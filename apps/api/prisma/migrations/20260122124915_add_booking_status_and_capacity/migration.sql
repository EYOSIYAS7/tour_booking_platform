-- Migration: add_booking_status_and_capacity
-- This migration handles existing data properly

-- Step 1: Create BookingStatus enum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'FAILED');

-- Step 2: Add new columns to Tour table
ALTER TABLE "Tour" 
ADD COLUMN "maxParticipants" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "bookedSlots" INTEGER NOT NULL DEFAULT 0;

-- Step 3: Add new columns to Booking table (nullable first, then update)
ALTER TABLE "Booking" 
ADD COLUMN "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "numberOfParticipants" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "totalAmount" INTEGER, -- Nullable first
ADD COLUMN "paymentReference" TEXT,
ADD COLUMN "paidAt" TIMESTAMP(3),
ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "cancellationReason" TEXT;

-- Step 4: Update existing bookings totalAmount based on tour price
UPDATE "Booking" b
SET "totalAmount" = t.price * b."numberOfParticipants"
FROM "Tour" t
WHERE b."tourId" = t.id;

-- Step 5: Make totalAmount NOT NULL after populating data
ALTER TABLE "Booking" 
ALTER COLUMN "totalAmount" SET NOT NULL;

-- Step 6: Update bookedSlots for tours based on existing PENDING/CONFIRMED bookings
UPDATE "Tour" t
SET "bookedSlots" = COALESCE((
  SELECT SUM(b."numberOfParticipants")
  FROM "Booking" b
  WHERE b."tourId" = t.id
  AND b."status" IN ('PENDING', 'CONFIRMED')
), 0);

-- Safely drop the index if it's stuck in the shadow DB or main DB
DROP INDEX IF EXISTS "Booking_paymentReference_key";

-- Step 7: Add unique constraint for payment reference
CREATE UNIQUE INDEX "Booking_paymentReference_key" ON "Booking"("paymentReference") WHERE "paymentReference" IS NOT NULL;

-- Step 8: Create indexes for better query performance
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");
CREATE INDEX "Booking_tourId_idx" ON "Booking"("tourId");
CREATE INDEX "Booking_status_idx" ON "Booking"("status");