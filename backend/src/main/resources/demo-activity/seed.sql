-- Demo activity generator: realistic performed tasks for the last 12 months up to now,
-- plus individual plan update dates kept around today.
--
-- Safe to run repeatedly (e.g. once a month): a client-day that already has any performed task is skipped,
-- so a new run only fills what is missing since the last one. Generated rows are tracked in
-- demo_generated_performed_task, clear.sql removes exactly those rows.
--
-- Every active client gets a stable care profile derived from its id (lunch on weekdays, hygiene a few times
-- a week, weekly cleaning, shopping, laundry every other week, an occasional escort). Every 20th client gets
-- nothing, so the dashboard has clients "without a recent record". Tasks are matched by name in the client's
-- organization (Oběd, Hygiena, Úklid, Nákup, Prádlo, Doprovod); HOUR tasks are stored in minutes.

SET client_min_messages = warning;

BEGIN;

CREATE TABLE IF NOT EXISTS demo_generated_performed_task (
    performed_task_id bigint PRIMARY KEY REFERENCES performed_task (id) ON DELETE CASCADE
);

-- Earlier migrations inserted explicit ids, make sure the identity continues after them
DO $$ BEGIN
    PERFORM setval(pg_get_serial_sequence('performed_task', 'id'), (SELECT COALESCE(MAX(id), 1) FROM performed_task));
END $$;

WITH client_days AS (
    SELECT c.id AS client_id,
           c.caregiver_id,
           c.department_id,
           c.organization_id,
           day::date AS day,
           EXTRACT(ISODOW FROM day)::int AS weekday,
           EXTRACT(WEEK FROM day)::int AS week,
           ABS(HASHTEXT(c.id || ':' || day::date)) AS dice
    FROM client c
    CROSS JOIN LATERAL GENERATE_SERIES(
        GREATEST(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months'), c.created::timestamp),
        CURRENT_DATE,
        INTERVAL '1 day') AS day
    WHERE c.active
      AND c.caregiver_id IS NOT NULL
      AND c.id % 20 <> 0
      AND NOT EXISTS (
          SELECT 1 FROM performed_task pt
          WHERE pt.client_id = c.id AND pt.date::date = day::date)
),
planned AS (
    -- one row per task the client's profile wants on that day: (task name, unit count, time of day)
    SELECT cd.*, p.task_name, p.unit_count, p.start_time
    FROM client_days cd
    CROSS JOIN LATERAL (VALUES
        ('Oběd', 1::numeric, TIME '11:30' + (cd.dice % 60) * INTERVAL '1 minute',
            cd.client_id % 3 = 0 AND cd.weekday <= 5),
        ('Hygiena', (ARRAY[30, 45, 60])[cd.dice % 3 + 1]::numeric, TIME '07:30' + (cd.dice % 90) * INTERVAL '1 minute',
            cd.client_id % 4 IN (0, 1) AND cd.weekday <= 5 AND cd.dice % 7 < 3),
        ('Úklid', (ARRAY[60, 90, 120])[cd.dice % 3 + 1]::numeric, TIME '13:00' + (cd.dice % 120) * INTERVAL '1 minute',
            cd.weekday = cd.client_id % 5 + 1),
        ('Nákup', (ARRAY[30, 45, 60, 90])[cd.dice % 4 + 1]::numeric, TIME '09:30' + (cd.dice % 150) * INTERVAL '1 minute',
            cd.client_id % 2 = 0 AND cd.weekday = (cd.client_id + 2) % 5 + 1),
        ('Prádlo', (2 + (cd.dice % 9) * 0.5)::numeric, TIME '14:00' + (cd.dice % 90) * INTERVAL '1 minute',
            cd.client_id % 3 = 1 AND cd.weekday = (cd.client_id + 1) % 5 + 1 AND cd.week % 2 = cd.client_id % 2),
        ('Doprovod', (4 + cd.dice % 27)::numeric, TIME '08:30' + (cd.dice % 240) * INTERVAL '1 minute',
            cd.weekday <= 5 AND cd.dice % 30 = 0)
    ) AS p(task_name, unit_count, start_time, is_planned)
    WHERE p.is_planned
      AND cd.day + p.start_time <= NOW()
),
inserted AS (
    INSERT INTO performed_task (client_id, task_id, date, unit_count, unit_price, notes, department_id, organization_id)
    SELECT pl.client_id, t.id, pl.day + pl.start_time, pl.unit_count, t.unit_price, NULL, pl.department_id, pl.organization_id
    FROM planned pl
    JOIN task t ON t.organization_id = pl.organization_id AND t.name = pl.task_name AND t.active
    RETURNING id, client_id
),
tracked AS (
    INSERT INTO demo_generated_performed_task (performed_task_id)
    SELECT id FROM inserted
)
INSERT INTO caregiver_performed_task (caregiver_id, performed_task_id)
SELECT c.caregiver_id, i.id
FROM inserted i
JOIN client c ON c.id = i.client_id;

-- Keep individual plan update dates alive: a plan more than 14 days overdue gets a new date between
-- 10 days ago and 45 days ahead (spread evenly by plan id), and its processed date half a year before it.
-- Plans then drift towards "overdue" naturally and are renewed two weeks later.
UPDATE individual_plan_content c
SET planned_update_date = CURRENT_DATE + (ip.id * 7 % 56 - 10)::int,
    processed_date = CURRENT_DATE + (ip.id * 7 % 56 - 10)::int - INTERVAL '6 months'
FROM individual_plan ip
WHERE ip.current_content_id = c.id
  AND c.planned_update_date < CURRENT_DATE - 14;

SELECT COUNT(*) AS generated_total,
       MAX(pt.date) AS latest_generated
FROM demo_generated_performed_task g
JOIN performed_task pt ON pt.id = g.performed_task_id;

COMMIT;
