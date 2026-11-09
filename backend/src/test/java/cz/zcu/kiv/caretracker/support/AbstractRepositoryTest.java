package cz.zcu.kiv.caretracker.support;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

/**
 * Base class for tests of repositories and specifications (*IT): only the JPA layer (entities, repositories,
 * Flyway migrations) on real PostgreSQL, without services, security or the web layer, so the context starts
 * faster than in {@link AbstractIntegrationTest}.
 * <p>
 * PostgreSQL instead of an embedded database ({@code replace = NONE}) because the queries depend on it:
 * native SQL, NUMERIC rounding and microsecond timestamps. Each test runs in a transaction that is rolled back
 * at its end; the database is emptied at its start inside that transaction, so the Flyway dummy data does not
 * leak into results. Entities are created with {@link TestData} as in the other integration tests.
 * <p>
 * Native queries read the database, not the persistence context: call {@link #flushAndClear()} after
 * preparing data so the queries and the reloaded entities see exactly what PostgreSQL stored.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@Import({TestcontainersConfiguration.class, TestClockConfiguration.class, DatabaseCleaner.class, TestData.class,
        AbstractRepositoryTest.PasswordEncoderConfiguration.class})
public abstract class AbstractRepositoryTest {

    @Autowired
    protected TestData testData;

    @Autowired
    protected TestEntityManager entityManager;

    @Autowired
    private DatabaseCleaner databaseCleaner;

    @BeforeEach
    void cleanDatabase() {
        databaseCleaner.clean();
    }

    protected void flushAndClear() {
        entityManager.flush();
        entityManager.clear();
    }

    /** TestData creates login accounts with an encoded password; the slice context has no security configuration. */
    @TestConfiguration(proxyBeanMethods = false)
    static class PasswordEncoderConfiguration {

        @Bean
        PasswordEncoder passwordEncoder() {
            return new BCryptPasswordEncoder(4);
        }
    }
}
