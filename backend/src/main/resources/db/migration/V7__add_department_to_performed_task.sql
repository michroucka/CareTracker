-- Add department_id column to performed_task table (initially nullable)
ALTER TABLE "performed_task"
ADD COLUMN "department_id" INT;

-- Set department_id for all existing performed_tasks based on their client's department
UPDATE "performed_task" pt
SET "department_id" = c.department_id
FROM "client" c
WHERE pt.client_id = c.id;

-- Make the column NOT NULL
ALTER TABLE "performed_task"
ALTER COLUMN "department_id" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "performed_task"
ADD CONSTRAINT "fk_performed_task_department"
FOREIGN KEY ("department_id")
REFERENCES "department"("id")
ON DELETE RESTRICT;

-- Rename task_name column to name in task table
ALTER TABLE "task"
RENAME COLUMN "task_name" TO "name";

-- Change date column to timestamp in performed_task table
ALTER TABLE "performed_task"
ALTER COLUMN "date" TYPE TIMESTAMP USING "date"::TIMESTAMP;
