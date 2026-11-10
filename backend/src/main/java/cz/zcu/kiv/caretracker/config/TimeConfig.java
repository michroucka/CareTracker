package cz.zcu.kiv.caretracker.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

/**
 * Source of the current time, injectable so that tests can fix "today".
 * Dates in the app are Czech wall-clock time, so the zone is fixed instead of taken from the server,
 * which runs in UTC inside Docker.
 */
@Configuration
public class TimeConfig {

    @Bean
    public Clock clock() {
        return Clock.system(ZoneId.of("Europe/Prague"));
    }
}
