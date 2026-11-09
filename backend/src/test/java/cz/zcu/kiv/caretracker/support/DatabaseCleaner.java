package cz.zcu.kiv.caretracker.support;

import org.springframework.boot.test.context.TestComponent;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

/**
 * Empties all application tables, including the dummy data inserted by Flyway migrations,
 * so every integration test starts from an empty database and creates only what it needs.
 */
@TestComponent
public class DatabaseCleaner {

    private final JdbcTemplate jdbcTemplate;
    private String truncateStatement;

    public DatabaseCleaner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void clean() {
        if (truncateStatement == null) {
            truncateStatement = buildTruncateStatement();
        }
        jdbcTemplate.execute(truncateStatement);
    }

    private String buildTruncateStatement() {
        List<String> tables = jdbcTemplate.queryForList("""
                SELECT quote_ident(table_name) FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_type = 'BASE TABLE'
                  AND table_name <> 'flyway_schema_history'
                """, String.class);
        return "TRUNCATE TABLE " + String.join(", ", tables) + " RESTART IDENTITY CASCADE";
    }
}
