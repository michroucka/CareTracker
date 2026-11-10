-- A performed task keeps the price per unit it was recorded with, so a later change of the catalog price
-- does not rewrite past months and receipts that were already issued
ALTER TABLE performed_task ADD COLUMN unit_price int;

UPDATE performed_task pt
SET unit_price = t.unit_price
FROM task t
WHERE t.id = pt.task_id;

ALTER TABLE performed_task ALTER COLUMN unit_price SET NOT NULL;
