-- Remember-me tokens of Spring Security (JdbcTokenRepositoryImpl), so logout and a password change can revoke them
CREATE TABLE persistent_logins (
    username  VARCHAR(64) NOT NULL,
    series    VARCHAR(64) PRIMARY KEY,
    token     VARCHAR(64) NOT NULL,
    last_used TIMESTAMP   NOT NULL
);

CREATE INDEX persistent_logins_username_idx ON persistent_logins (username);
