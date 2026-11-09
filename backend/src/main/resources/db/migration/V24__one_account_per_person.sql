-- A person (employee or client) has at most one login account; lookups by client_id expect a single row.
CREATE UNIQUE INDEX app_user_client_id_unique ON app_user (client_id) WHERE client_id IS NOT NULL;
CREATE UNIQUE INDEX app_user_employee_id_unique ON app_user (employee_id) WHERE employee_id IS NOT NULL;
