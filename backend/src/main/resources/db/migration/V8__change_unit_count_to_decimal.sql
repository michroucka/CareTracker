-- Change unit_count column from INT to NUMERIC to support decimal values for KG and KM unit types
ALTER TABLE "performed_task"
ALTER COLUMN "unit_count" TYPE NUMERIC(10,2);
