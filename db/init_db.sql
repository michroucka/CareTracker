-- ======================================
-- Table: department
-- ======================================
CREATE TABLE department (
                            id SERIAL PRIMARY KEY,
                            city VARCHAR NOT NULL,
                            address VARCHAR NOT NULL,
                            coordinator_id BIGINT UNIQUE
);

-- ======================================
-- Table: employee
-- ======================================
CREATE TABLE employee (
                          id BIGSERIAL PRIMARY KEY,
                          first_name VARCHAR NOT NULL,
                          last_name VARCHAR NOT NULL,
                          role VARCHAR NOT NULL,
                          department_id INT REFERENCES department(id) ON DELETE SET NULL
);

-- napojení koordinátora na department
ALTER TABLE department
    ADD CONSTRAINT fk_department_coordinator FOREIGN KEY (coordinator_id)
        REFERENCES employee(id);

-- ======================================
-- Table: client
-- ======================================
CREATE TABLE client (
                        id BIGSERIAL PRIMARY KEY,
                        first_name VARCHAR NOT NULL,
                        last_name VARCHAR NOT NULL,
                        date_of_birth VARCHAR NOT NULL,
                        email VARCHAR,
                        phone VARCHAR,
                        address VARCHAR,
                        city VARCHAR,
                        active BOOLEAN NOT NULL DEFAULT true,
                        department_id INT REFERENCES department(id) ON DELETE SET NULL,
                        caregiver_id BIGINT REFERENCES employee(id) ON DELETE SET NULL
);

-- ======================================
-- Table: task
-- ======================================
CREATE TABLE task (
                      id BIGSERIAL PRIMARY KEY,
                      task_name VARCHAR NOT NULL,
                      price INT NOT NULL,
                      double_meeting BOOLEAN NOT NULL DEFAULT false
);

-- ======================================
-- Join table: client_task (many-to-many client <-> task)
-- ======================================
CREATE TABLE client_task (
                             client_id BIGINT NOT NULL REFERENCES client(id) ON DELETE CASCADE,
                             task_id BIGINT NOT NULL REFERENCES task(id) ON DELETE CASCADE,
                             PRIMARY KEY (client_id, task_id)
);

-- ======================================
-- Table: performed_task
-- ======================================
CREATE TABLE performed_task (
                                id BIGSERIAL PRIMARY KEY,
                                client_id BIGINT NOT NULL REFERENCES client(id) ON DELETE CASCADE,
                                task_id BIGINT NOT NULL REFERENCES task(id) ON DELETE CASCADE,
                                date DATE NOT NULL,
                                minutes INT NOT NULL
);

CREATE TABLE users (
                       id SERIAL PRIMARY KEY,
                       username VARCHAR NOT NULL UNIQUE,
                       password VARCHAR NOT NULL,
                       role VARCHAR NOT NULL
);