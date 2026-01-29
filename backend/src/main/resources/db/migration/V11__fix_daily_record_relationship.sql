-- Drop the incorrect join table between individual_plan_content and daily_record
DROP TABLE IF EXISTS "individual_plan_content_daily_record";

-- Add individual_plan_id to daily_record table
ALTER TABLE "daily_record"
ADD COLUMN "individual_plan_id" INT NOT NULL;

-- Add foreign key constraint
ALTER TABLE "daily_record"
ADD CONSTRAINT "fk_daily_record_individual_plan"
FOREIGN KEY ("individual_plan_id")
REFERENCES "individual_plan"("id")
ON DELETE CASCADE;
