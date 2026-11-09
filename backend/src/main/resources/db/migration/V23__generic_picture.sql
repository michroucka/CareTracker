-- Pictures are shared by clients and employees: the owner points to its picture (picture_id),
-- so loading a client or employee no longer loads the image data.
ALTER TABLE picture ADD COLUMN thumbnail bytea;

ALTER TABLE client ADD COLUMN picture_id INT REFERENCES picture (id) ON DELETE SET NULL;
ALTER TABLE employee ADD COLUMN picture_id INT REFERENCES picture (id) ON DELETE SET NULL;

UPDATE client c SET picture_id = p.id FROM picture p WHERE p.client_id = c.id;

ALTER TABLE picture DROP COLUMN client_id;
ALTER TABLE picture DROP COLUMN filename;
