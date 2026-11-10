package cz.zcu.kiv.caretracker.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Each exception reaching {@link GlobalExceptionHandler} ends with the right status and a JSON body.
 * The application's own exceptions keep their Czech message, everything else gets a fixed Czech message,
 * so exception texts of Java, Spring or Hibernate never reach the user.
 */
class GlobalExceptionHandlerTest {

    private static final String UNEXPECTED_ERROR = "Nastala neočekávaná chyba na serveru";

    private final ThrowingController controller = new ThrowingController();
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    static Stream<Arguments> applicationExceptions() {
        return Stream.of(
                Arguments.of(new ResourceNotFoundException("Klient nebyl nalezen"), 404, "Klient nebyl nalezen"),
                Arguments.of(new ValidationException("Datum ukončení nesmí být v budoucnosti"), 400, "Datum ukončení nesmí být v budoucnosti"),
                Arguments.of(new SecurityException("Nemáte přístup k tomuto klientovi"), 403, "Nemáte přístup k tomuto klientovi"),
                Arguments.of(new TokenExpiredException("Platnost odkazu vypršela"), 401, "Platnost odkazu vypršela"),
                Arguments.of(new UsernameNotFoundException("Uživatel nebyl nalezen"), 404, "Uživatel nebyl nalezen")
        );
    }

    @ParameterizedTest
    @MethodSource("applicationExceptions")
    void applicationExceptionKeepsItsMessage(RuntimeException exception, int status, String message) throws Exception {
        expectError(exception, status, message);
    }

    static Stream<Arguments> foreignExceptions() {
        return Stream.of(
                Arguments.of(new AccessDeniedException("Access is denied for user caregiver"), 403, "Nemáte oprávnění k této operaci"),
                Arguments.of(new AuthorizationDeniedException("Access is denied for user caregiver", new AuthorizationDecision(false)),
                        403, "Nemáte oprávnění k této operaci"),
                Arguments.of(new IllegalArgumentException("No enum constant cz.zcu.kiv.caretracker.enums.Gender.ALIEN"),
                        400, "Neplatná hodnota v požadavku"),
                Arguments.of(new NoResourceFoundException(HttpMethod.GET, "/api/client/1", "api/client/1"), 404, "Požadovaná adresa neexistuje"),
                Arguments.of(new MaxUploadSizeExceededException(5 * 1024 * 1024), 413, "Soubor je příliš velký"),
                Arguments.of(new NullPointerException("Cannot invoke \"java.util.List.iterator()\""), 500, UNEXPECTED_ERROR),
                Arguments.of(new IllegalStateException("JPEG encoding failed"), 500, UNEXPECTED_ERROR),
                Arguments.of(new RuntimeException("org.hibernate.LazyInitializationException: could not initialize proxy"),
                        500, UNEXPECTED_ERROR),
                Arguments.of(new IOException("Broken pipe"), 500, UNEXPECTED_ERROR)
        );
    }

    @ParameterizedTest
    @MethodSource("foreignExceptions")
    void foreignExceptionGetsFixedMessage(Exception exception, int status, String message) throws Exception {
        expectError(exception, status, message);
    }

    static Stream<Arguments> dataIntegrityViolations() {
        return Stream.of(
                Arguments.of("duplicate key value violates unique constraint \"idx_client_personal_number_organization\"",
                        "Osobní číslo již existuje"),
                Arguments.of("duplicate key value violates unique constraint \"users_username_key\"",
                        "Uživatelské jméno již existuje"),
                Arguments.of("duplicate key value violates unique constraint \"users_email_key\"", "Email již existuje"),
                Arguments.of("duplicate key value violates unique constraint \"task_name_key\"",
                        "Záznam s těmito údaji již existuje"),
                Arguments.of("update or delete on table \"client\" violates foreign key constraint \"fk_task_client\"",
                        "Nelze smazat, existují závislé záznamy"),
                Arguments.of("null value in column \"first_name\" violates not-null constraint",
                        "Všechna povinná pole musí být vyplněna"),
                Arguments.of("value too long for type character varying(50)", "Chyba při ukládání dat")
        );
    }

    @ParameterizedTest
    @MethodSource("dataIntegrityViolations")
    void dataIntegrityViolationIsTranslated(String databaseMessage, String message) throws Exception {
        expectError(new DataIntegrityViolationException(databaseMessage), 400, message);
    }

    @Test
    void errorBodyCarriesStatusAndPath() throws Exception {
        controller.exceptionToThrow = new ResourceNotFoundException("Klient nebyl nalezen");

        mockMvc.perform(get("/throw"))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.path").value("/throw"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    private void expectError(Exception exception, int status, String message) throws Exception {
        controller.exceptionToThrow = exception;

        String body = mockMvc.perform(get("/throw"))
                .andExpect(status().is(status))
                .andExpect(jsonPath("$.status").value(status))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        assertThat(body).contains("\"message\":\"" + message + "\"");
        if (!message.equals(exception.getMessage())) {
            assertThat(body).doesNotContain(exception.getMessage());
        }
    }

    @RestController
    static class ThrowingController {

        Exception exceptionToThrow;

        @GetMapping("/throw")
        void throwConfiguredException() throws Exception {
            throw exceptionToThrow;
        }
    }
}
