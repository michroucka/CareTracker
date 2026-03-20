ALTER TABLE organization
    DROP COLUMN "bank_account",
    ADD COLUMN "account_prefix" VARCHAR(6),
    ADD COLUMN "account_number" VARCHAR(10),
    ADD COLUMN "bank_code"      VARCHAR(4);

ALTER TABLE department
    ADD COLUMN "department_number" INTEGER;

UPDATE organization
SET account_prefix = '19',
    account_number = '2000145399',
    bank_code      = '0800'
WHERE id = 1;