-- Add active column to task table (initially nullable)
ALTER TABLE "task"
ADD COLUMN "active" BOOLEAN;

-- Set active to true for all existing tasks
UPDATE "task"
SET "active" = true
WHERE "active" IS NULL;

-- Make the column NOT NULL
ALTER TABLE "task"
ALTER COLUMN "active" SET NOT NULL;
