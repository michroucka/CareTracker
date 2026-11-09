package cz.zcu.kiv.caretracker.support;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.service.GeocodingService;
import cz.zcu.kiv.caretracker.service.PaymentQrClient;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;

import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static cz.zcu.kiv.caretracker.support.CsrfTokens.validCsrfToken;
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
@Import({TestcontainersConfiguration.class, TestClockConfiguration.class, SynchronousTaskExecutorConfiguration.class,
        DatabaseCleaner.class, TestData.class})
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

    @MockitoBean
    protected PaymentQrClient paymentQrClient;

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
    /** Signed-in user with a valid CSRF token, as every write from the frontend carries one. */
    protected RequestPostProcessor loggedInAs(User account) {
        RequestPostProcessor signedIn = user(userDetailsService.loadUserByUsername(account.getUsername()));
        return request -> validCsrfToken().postProcessRequest(signedIn.postProcessRequest(request));
    }

    protected RequestPostProcessor loggedInAs(Employee employee) {
        return loggedInAs(employee.getUser());
    }

    /**
     * Signs the user in for direct service calls (no HTTP), the same way as {@link #loggedInAs}.
     * Services read the user from the {@link SecurityContextHolder}; it is cleared after each test.
     */
    protected void signInAs(User account) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(account.getUsername());
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(userDetails, null, userDetails.getAuthorities()));
    }

    protected void signInAs(Employee employee) {
        signInAs(employee.getUser());
    }

    @AfterEach
    void signOut() {
        SecurityContextHolder.clearContext();
    }

    /** HTML e-mails handed to the mocked mail sender during the current test, in the order sent. */
    protected List<MimeMessage> sentMails() {
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, atLeast(0)).send(captor.capture());
        return captor.getAllValues();
    }

    /** Text of all parts of the e-mail joined together (the HTML body sits inside nested multiparts). */
    protected static String mailText(Part mail) {
        try {
            Object content = mail.getContent();
            if (content instanceof Multipart multipart) {
                StringBuilder text = new StringBuilder();
                for (int i = 0; i < multipart.getCount(); i++) {
                    text.append(mailText(multipart.getBodyPart(i)));
                }
                return text.toString();
            }
            return content instanceof String string ? string : "";
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    /** Only the HTML part of the e-mail, without the plain-text alternative. */
    protected static String mailHtml(Part mail) {
        try {
            // the Content-Type header is only filled in when the message is sent, the data handler knows it already
            if (mail.getDataHandler().getContentType().toLowerCase().startsWith("text/html")) {
                return (String) mail.getContent();
            }
            if (mail.getContent() instanceof Multipart multipart) {
                StringBuilder html = new StringBuilder();
                for (int i = 0; i < multipart.getCount(); i++) {
                    html.append(mailHtml(multipart.getBodyPart(i)));
                }
                return html.toString();
            }
            return "";
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    protected static String recipientOf(MimeMessage mail) {
        try {
            return mail.getAllRecipients()[0].toString();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    protected String json(Object body) {
        try {
            return objectMapper.writeValueAsString(body);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException(e);
        }
    }
}
