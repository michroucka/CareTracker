-- Dummy performed tasks from V18 and V19 (ids 2001-3068) stored HOUR tasks in hours (1.5 = 1.5 h),
-- but the application stores HOUR tasks in minutes. Older V2 dummy data already uses minutes.
UPDATE performed_task pt
SET unit_count = pt.unit_count * 60
FROM task t
WHERE pt.task_id = t.id
  AND t.unit_type = 'HOUR'
  AND pt.id BETWEEN 2001 AND 3068
  AND pt.unit_count <= 8;
