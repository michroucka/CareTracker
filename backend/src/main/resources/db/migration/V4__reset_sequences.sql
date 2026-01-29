-- Reset všech sekvencí na správné hodnoty podle aktuálních dat v tabulkách
-- Toto je potřeba protože dummy data byla vložena s explicitními ID

-- Organization sequence
SELECT setval('organization_id_seq', COALESCE((SELECT MAX(id) FROM organization), 1), true);

-- Department sequence
SELECT setval('department_id_seq', COALESCE((SELECT MAX(id) FROM department), 1), true);

-- Employee sequence
SELECT setval('employee_id_seq', COALESCE((SELECT MAX(id) FROM employee), 1), true);

-- Client sequence (600 záznamů)
SELECT setval('client_id_seq', COALESCE((SELECT MAX(id) FROM client), 1), true);

-- Task sequence
SELECT setval('task_id_seq', COALESCE((SELECT MAX(id) FROM task), 1), true);

-- Picture sequence (pokud existuje)
SELECT setval('picture_id_seq', COALESCE((SELECT MAX(id) FROM picture), 1), true);

-- Individual plan sequence (pokud existuje)
SELECT setval('individual_plan_id_seq', COALESCE((SELECT MAX(id) FROM individual_plan), 1), true);

-- Performed task sequence (pokud existuje)
SELECT setval('performed_task_id_seq', COALESCE((SELECT MAX(id) FROM performed_task), 1), true);

-- App user sequence
SELECT setval('app_user_id_seq', COALESCE((SELECT MAX(id) FROM app_user), 1), true);
