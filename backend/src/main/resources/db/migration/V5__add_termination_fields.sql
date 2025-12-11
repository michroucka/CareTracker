-- Create termination_reason enum type
CREATE TYPE "termination_reason" AS ENUM (
  'EXITUS',
  'RESIDENTIAL_SERVICE',
  'CONTRACT_TERMINATION',
  'MUTUAL_AGREEMENT',
  'OTHER'
);

-- Add new termination columns
ALTER TABLE "client"
ADD COLUMN "termination_date" date,
ADD COLUMN "termination_reason" termination_reason;

-- Migrate existing date_of_death data to termination fields
-- If date_of_death exists, set termination_date to date_of_death and reason to EXITUS
UPDATE "client"
SET "termination_date" = "date_of_death",
    "termination_reason" = 'EXITUS'
WHERE "date_of_death" IS NOT NULL;

-- Drop the old date_of_death column
ALTER TABLE "client"
DROP COLUMN "date_of_death";
