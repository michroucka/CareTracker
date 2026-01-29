-- Add created_by_id column to daily_record table (nullable first)
ALTER TABLE "daily_record"
ADD COLUMN "created_by_id" INT;

-- Set a default value for existing records (first employee in the database)
-- This ensures existing records have a valid created_by_id
UPDATE "daily_record"
SET "created_by_id" = (SELECT "id" FROM "employee" ORDER BY "id" LIMIT 1)
WHERE "created_by_id" IS NULL;

-- Now make the column NOT NULL
ALTER TABLE "daily_record"
ALTER COLUMN "created_by_id" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "daily_record"
ADD CONSTRAINT "fk_daily_record_created_by"
FOREIGN KEY ("created_by_id")
REFERENCES "employee"("id")
ON DELETE RESTRICT;
