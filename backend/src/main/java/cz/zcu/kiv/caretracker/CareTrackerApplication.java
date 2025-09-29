package cz.zcu.kiv.caretracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;


@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
public class CareTrackerApplication {

    public static void main(String[] args) {
        SpringApplication.run(CareTrackerApplication.class, args);
    }

}
