package cz.zcu.kiv.caretracker.config;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import jakarta.mail.internet.MimeMessage;

@Configuration
@Profile("demo")
@EnableScheduling
public class DemoConfig {

    private static final Logger log = LoggerFactory.getLogger(DemoConfig.class);

    @Autowired
    private Flyway flyway;

    @Bean
    @Primary
    public JavaMailSender noOpMailSender() {
        return new JavaMailSenderImpl() {
            @Override
            protected void doSend(MimeMessage[] mimeMessages, Object[] originalMessages) {
                log.debug("Demo mode: suppressing email send to {} recipient(s)", mimeMessages.length);
            }
        };
    }

    @Scheduled(cron = "0 0 0 * * *", zone = "Europe/Prague")
    public void resetDemoData() {
        log.info("Demo reset: starting nightly data reset...");
        try {
            flyway.clean();
            flyway.migrate();
            log.info("Demo reset: completed successfully");
        } catch (Exception e) {
            log.error("Demo reset: failed", e);
        }
    }
}