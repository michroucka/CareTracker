-- Odstranit globální UNIQUE constraint z personal_number
ALTER TABLE client DROP CONSTRAINT IF EXISTS client_personal_number_key;

-- Přidat organization_id do client tabulky (denormalizace pro rychlejší dotazy a constraints)
ALTER TABLE client ADD COLUMN organization_id INT;

-- Vyplnit organization_id pro existující záznamy
UPDATE client
SET organization_id = (
    SELECT d.organization_id
    FROM department d
    WHERE d.id = client.department_id
);

-- Nastavit organization_id jako NOT NULL
ALTER TABLE client ALTER COLUMN organization_id SET NOT NULL;

-- Přidat foreign key constraint
ALTER TABLE client ADD CONSTRAINT fk_client_organization
    FOREIGN KEY (organization_id) REFERENCES organization(id);

-- Vytvořit unique constraint pro personal_number v rámci organizace
-- Klienti ve stejné organizaci nemohou mít stejné personal_number
-- Klienti z různých organizací mohou mít stejné personal_number
CREATE UNIQUE INDEX idx_client_personal_number_organization
ON client (personal_number, organization_id)
WHERE personal_number IS NOT NULL;
