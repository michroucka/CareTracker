-- Removes all performed tasks created by seed.sql (and their caregiver links).

SET client_min_messages = warning;

BEGIN;

CREATE TABLE IF NOT EXISTS demo_generated_performed_task (
    performed_task_id int PRIMARY KEY REFERENCES performed_task (id) ON DELETE CASCADE
);

DELETE FROM caregiver_performed_task
WHERE performed_task_id IN (SELECT performed_task_id FROM demo_generated_performed_task);

DELETE FROM performed_task
WHERE id IN (SELECT performed_task_id FROM demo_generated_performed_task);

SELECT COUNT(*) AS remaining_tracked FROM demo_generated_performed_task;

COMMIT;
