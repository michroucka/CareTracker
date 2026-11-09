package cz.zcu.kiv.caretracker;

import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;

/** Fails when Flyway migrations do not apply or entities do not match the schema (ddl-auto=validate). */
class ApplicationContextIT extends AbstractIntegrationTest {

    @Test
    void contextStartsWithMigratedSchema() {
    }
}
