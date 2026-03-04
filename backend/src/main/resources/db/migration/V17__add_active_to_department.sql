ALTER TABLE "department"
    ADD COLUMN "active" BOOLEAN;

UPDATE "department"
SET "active" = true
WHERE "active" IS NULL;

ALTER TABLE "department"
    ALTER COLUMN "active" SET NOT NULL;