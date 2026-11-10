-- The schema follows the entities, so the tests can validate it against them (spring.jpa.hibernate.ddl-auto=validate):
-- ids and foreign keys become bigint like the Long ids of the entities, postal codes varchar like their String fields.
-- Identity columns take their sequence along; the sequences are widened explicitly as well, to be sure.

ALTER TABLE organization
    ALTER COLUMN id TYPE bigint,
    ALTER COLUMN manager_id TYPE bigint;

ALTER TABLE department
    ALTER COLUMN id TYPE bigint,
    ALTER COLUMN organization_id TYPE bigint,
    ALTER COLUMN coordinator_id TYPE bigint,
    ALTER COLUMN postal_code TYPE varchar(6);

ALTER TABLE picture
    ALTER COLUMN id TYPE bigint;

ALTER TABLE employee
    ALTER COLUMN id TYPE bigint,
    ALTER COLUMN organization_id TYPE bigint,
    ALTER COLUMN department_id TYPE bigint,
    ALTER COLUMN picture_id TYPE bigint;

ALTER TABLE client
    ALTER COLUMN id TYPE bigint,
    ALTER COLUMN organization_id TYPE bigint,
    ALTER COLUMN department_id TYPE bigint,
    ALTER COLUMN caregiver_id TYPE bigint,
    ALTER COLUMN picture_id TYPE bigint,
    ALTER COLUMN personal_number TYPE bigint,
    ALTER COLUMN postal_code TYPE varchar(6);

ALTER TABLE app_user
    ALTER COLUMN id TYPE bigint,
    ALTER COLUMN employee_id TYPE bigint,
    ALTER COLUMN client_id TYPE bigint;

ALTER TABLE task
    ALTER COLUMN id TYPE bigint,
    ALTER COLUMN organization_id TYPE bigint;

ALTER TABLE client_task
    ALTER COLUMN client_id TYPE bigint,
    ALTER COLUMN task_id TYPE bigint;

ALTER TABLE performed_task
    ALTER COLUMN id TYPE bigint,
    ALTER COLUMN client_id TYPE bigint,
    ALTER COLUMN task_id TYPE bigint,
    ALTER COLUMN department_id TYPE bigint,
    ALTER COLUMN organization_id TYPE bigint;

ALTER TABLE caregiver_performed_task
    ALTER COLUMN caregiver_id TYPE bigint,
    ALTER COLUMN performed_task_id TYPE bigint;

ALTER TABLE individual_plan
    ALTER COLUMN id TYPE bigint,
    ALTER COLUMN client_id TYPE bigint,
    ALTER COLUMN organization_id TYPE bigint,
    ALTER COLUMN current_content_id TYPE bigint;

ALTER TABLE individual_plan_content
    ALTER COLUMN id TYPE bigint,
    ALTER COLUMN individual_plan_id TYPE bigint;

ALTER TABLE daily_record
    ALTER COLUMN id TYPE bigint,
    ALTER COLUMN individual_plan_id TYPE bigint,
    ALTER COLUMN created_by_id TYPE bigint;

ALTER SEQUENCE organization_id_seq AS bigint;
ALTER SEQUENCE department_id_seq AS bigint;
ALTER SEQUENCE picture_id_seq AS bigint;
ALTER SEQUENCE employee_id_seq AS bigint;
ALTER SEQUENCE client_id_seq AS bigint;
ALTER SEQUENCE app_user_id_seq AS bigint;
ALTER SEQUENCE task_id_seq AS bigint;
ALTER SEQUENCE performed_task_id_seq AS bigint;
ALTER SEQUENCE individual_plan_id_seq AS bigint;
ALTER SEQUENCE individual_plan_content_id_seq AS bigint;
ALTER SEQUENCE daily_record_id_seq AS bigint;
