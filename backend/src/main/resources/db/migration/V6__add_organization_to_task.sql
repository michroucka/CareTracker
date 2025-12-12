-- Add organization_id column to task table (initially nullable)
ALTER TABLE "task"
ADD COLUMN "organization_id" INT;

-- Set organization_id for all existing tasks to the first organization
UPDATE "task"
SET "organization_id" = (SELECT MIN(id) FROM "organization")
WHERE "organization_id" IS NULL;

-- Make the column NOT NULL
ALTER TABLE "task"
ALTER COLUMN "organization_id" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "task"
ADD CONSTRAINT "fk_task_organization"
FOREIGN KEY ("organization_id")
REFERENCES "organization"("id");

-- Add organization_id to employee table
ALTER TABLE "employee"
ADD COLUMN "organization_id" INT;

-- Set organization_id for all existing employees based on their department
UPDATE "employee" e
SET "organization_id" = d.organization_id
FROM "department" d
WHERE e.department_id = d.id;

-- Make the column NOT NULL
ALTER TABLE "employee"
ALTER COLUMN "organization_id" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "employee"
ADD CONSTRAINT "fk_employee_organization"
FOREIGN KEY ("organization_id")
REFERENCES "organization"("id");

-- Add organization_id to performed_task table
ALTER TABLE "performed_task"
ADD COLUMN "organization_id" INT;

-- Set organization_id for all existing performed_tasks based on their client
UPDATE "performed_task" pt
SET "organization_id" = c.organization_id
FROM "client" c
WHERE pt.client_id = c.id;

-- Make the column NOT NULL
ALTER TABLE "performed_task"
ALTER COLUMN "organization_id" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "performed_task"
ADD CONSTRAINT "fk_performed_task_organization"
FOREIGN KEY ("organization_id")
REFERENCES "organization"("id");

-- Add organization_id to individual_plan table
ALTER TABLE "individual_plan"
ADD COLUMN "organization_id" INT;

-- Set organization_id for all existing individual_plans based on their client
UPDATE "individual_plan" ip
SET "organization_id" = c.organization_id
FROM "client" c
WHERE ip.client_id = c.id;

-- Make the column NOT NULL
ALTER TABLE "individual_plan"
ALTER COLUMN "organization_id" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "individual_plan"
ADD CONSTRAINT "fk_individual_plan_organization"
FOREIGN KEY ("organization_id")
REFERENCES "organization"("id");
