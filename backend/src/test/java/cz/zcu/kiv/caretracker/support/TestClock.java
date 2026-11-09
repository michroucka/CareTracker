package cz.zcu.kiv.caretracker.support;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * Clock of the integration test context. Runs on system time until a test fixes it with {@link #fixAt};
 * {@link AbstractIntegrationTest} resets it before each test. A mutable bean instead of
 * {@code @MockitoBean} keeps one shared Spring context for all integration tests.
 */
public class TestClock extends Clock {

    private volatile Clock current = Clock.systemDefaultZone();

    /** Stops the time at the given local date and time of the system zone. */
    public void fixAt(LocalDateTime now) {
        ZoneId zone = ZoneId.systemDefault();
        current = Clock.fixed(now.atZone(zone).toInstant(), zone);
    }

    public void reset() {
        current = Clock.systemDefaultZone();
    }

    @Override
    public ZoneId getZone() {
        return current.getZone();
    }

    @Override
    public Clock withZone(ZoneId zone) {
        return current.withZone(zone);
    }

    @Override
    public Instant instant() {
        return current.instant();
    }
}
