-- 1. CRASH PREVENTION: Drop the index if it was partially created before
DROP INDEX IF EXISTS "Booking_paymentReference_key";

-- 2. PRISMA'S GENERATED CODE (Keep this part)
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_tourId_fkey";
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_userId_fkey";

CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TourCategory" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TourCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_slug_idx" ON "Category"("slug");
CREATE INDEX "TourCategory_tourId_idx" ON "TourCategory"("tourId");
CREATE INDEX "TourCategory_categoryId_idx" ON "TourCategory"("categoryId");
CREATE UNIQUE INDEX "TourCategory_tourId_categoryId_key" ON "TourCategory"("tourId", "categoryId");

-- This line would fail without the DROP INDEX above
CREATE UNIQUE INDEX "Booking_paymentReference_key" ON "Booking"("paymentReference");

CREATE INDEX "Tour_providerId_idx" ON "Tour"("providerId");
CREATE INDEX "Tour_location_idx" ON "Tour"("location");
CREATE INDEX "Tour_startDate_idx" ON "Tour"("startDate");

ALTER TABLE "TourCategory" ADD CONSTRAINT "TourCategory_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TourCategory" ADD CONSTRAINT "TourCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. YOUR SEED DATA (Added to the end)
INSERT INTO "Category" ("id", "name", "slug", "description", "icon", "color", "createdAt", "updatedAt") VALUES
    ('cat_adventure', 'Adventure', 'adventure', 'Thrilling outdoor activities and expeditions', '🏔️', '#FF6B6B', NOW(), NOW()),
    ('cat_culture', 'Culture & Heritage', 'culture-heritage', 'Explore historical sites and local traditions', '🏛️', '#4ECDC4', NOW(), NOW()),
    ('cat_food', 'Food & Culinary', 'food-culinary', 'Taste local cuisine and culinary experiences', '🍜', '#FFE66D', NOW(), NOW()),
    ('cat_nature', 'Nature & Wildlife', 'nature-wildlife', 'Discover natural landscapes and wildlife', '🌿', '#95E1D3', NOW(), NOW()),
    ('cat_religious', 'Religious & Spiritual', 'religious-spiritual', 'Visit sacred sites and spiritual places', '⛪', '#A8E6CF', NOW(), NOW()),
    ('cat_city', 'City Tours', 'city-tours', 'Urban exploration and city sightseeing', '🏙️', '#FFB6B9', NOW(), NOW()),
    ('cat_beach', 'Beach & Coastal', 'beach-coastal', 'Relax by the sea and coastal activities', '🏖️', '#87CEEB', NOW(), NOW()),
    ('cat_mountain', 'Mountain & Hiking', 'mountain-hiking', 'Trekking and mountain adventures', '⛰️', '#8B7355', NOW(), NOW()),
    ('cat_photography', 'Photography Tours', 'photography', 'Capture stunning views and moments', '📸', '#FF9F1C', NOW(), NOW()),
    ('cat_family', 'Family Friendly', 'family-friendly', 'Perfect for families with children', '👨‍👩‍👧‍👦', '#FCA5A5', NOW(), NOW());