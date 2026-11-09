package cz.zcu.kiv.caretracker.support;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.service.GeocodingService;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

/**
 * Base class for integration tests (*IT): full Spring context, real PostgreSQL with Flyway migrations,
 * MockMvc for HTTP calls. The database is emptied before each test.
 * Do not add @MockitoBean in subclasses: every different set of mocks creates a new Spring context
 * (and a slower test run). Shared mocks of external systems belong here.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import({TestcontainersConfiguration.class, TestClockConfiguration.class, DatabaseCleaner.class, TestData.class})
public abstract class AbstractIntegrationTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected TestData testData;

    @Autowired
    protected ObjectMapper objectMapper;

    /** Application clock; fix it with {@code clock.fixAt(...)}, it returns to system time before each test. */
    @Autowired
    protected TestClock clock;

    @MockitoBean
    protected JavaMailSender mailSender;

    @MockitoBean
    protected GeocodingService geocodingService;

    @Autowired
    private DatabaseCleaner databaseCleaner;

    @Autowired
    private UserDetailsService userDetailsService;

    @BeforeEach
    void cleanDatabase() {
        databaseCleaner.clean();
    }

    @BeforeEach
    void resetClock() {
        clock.reset();
    }

    @BeforeEach
    void stubMailSender() {
        when(mailSender.createMimeMessage()).thenAnswer(invocation -> new MimeMessage((Session) null));
    }

    /** Authenticates the request as the given user, loaded the same way as on a real login. */
    protected RequestPostProcessor loggedInAs(User account) {
        return user(userDetailsService.loadUserByUsername(account.getUsername()));
    }

    protected RequestPostProcessor loggedInAs(Employee employee) {
        return loggedInAs(employee.getUser());
    }

    protected String json(Object body) {
        try {
            return objectMapper.writeValueAsString(body);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException(e);
        }
    }
}
