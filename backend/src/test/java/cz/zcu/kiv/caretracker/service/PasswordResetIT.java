package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import cz.zcu.kiv.caretracker.support.TestData;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.ResultActions;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Forgotten password from the login page: the request by e-mail must not reveal whether an account exists,
 * the reset token is valid for 24 hours and works once. The clock stands on {@link #REQUESTED}.
 */
class PasswordResetIT extends AbstractIntegrationTest {

    private static final LocalDateTime REQUESTED = LocalDateTime.of(2026, 11, 9, 10, 0);
    private static final LocalDateTime EXPIRY = REQUESTED.plusHours(24);
    private static final String NEW_PASSWORD = "NoveHeslo1!";

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Department department;
    private User account;

    @BeforeEach
    void createAccount() {
        clock.fixAt(REQUESTED);
        department = testData.department(testData.organization());
        account = testData.employee(department, EmployeeRole.CAREGIVER).getUser();
    }

    @Test
    void requestSendsResetLinkValidForTwentyFourHours() throws Exception {
        requestReset(account.getEmail())
                .andExpect(status().isOk());

        String token = currentToken();
        assertThat(token).isNotNull();
        assertThat(userRepository.findById(account.getId()).orElseThrow().getTokenExpiry()).isEqualTo(EXPIRY);
        List<MimeMessage> mails = sentMails();
        assertThat(mails).hasSize(1);
        assertThat(recipientOf(mails.getFirst())).isEqualTo(account.getEmail());
        assertThat(mailText(mails.getFirst())).contains("/reset-password?token=" + token);
    }

    @Test
    @Disabled("Nález: neexistující e-mail vrací 404 \"Uživatel se zadaným emailem nenalezen\", lze tak zjistit, které e-maily mají účet")
    void unknownEmailGetsSameResponseAndNoMail() throws Exception {
        MockHttpServletResponse known = requestReset(account.getEmail()).andReturn().getResponse();
        MockHttpServletResponse unknown = requestReset("nikdo@caretracker.test").andReturn().getResponse();

        assertThat(unknown.getStatus()).isEqualTo(known.getStatus());
        assertThat(unknown.getContentAsString()).isEqualTo(known.getContentAsString());
        assertThat(sentMails()).hasSize(1);
    }

    @Test
    @Disabled("Nález: e-mail se při resetu hledá s ohledem na velikost písmen, ačkoli jeho jedinečnost se kontroluje bez ní")
    void emailIsMatchedIgnoringCase() throws Exception {
        requestReset(account.getEmail().toUpperCase())
                .andExpect(status().isOk());

        assertThat(currentToken()).isNotNull();
        assertThat(sentMails()).hasSize(1);
    }

    @Test
    @Disabled("Nález: deaktivovaný účet dostane e-mail pro reset hesla, i když se přihlásit nemůže")
    void deactivatedAccountGetsNoResetMail() throws Exception {
        account.setActive(false);
        userRepository.save(account);

        requestReset(account.getEmail())
                .andExpect(status().isOk());

        assertThat(currentToken()).isNull();
        assertThat(sentMails()).isEmpty();
    }

    @Test
    @Disabled("Nález: reset hesla u neaktivovaného účtu přepíše aktivační token; po resetu má účet heslo, ale žádné uživatelské jméno ani token, a nejde aktivovat ani se přihlásit")
    void resetRequestDoesNotReplaceActivationToken() throws Exception {
        User pending = testData.withPendingAccount(testData.employee(department, EmployeeRole.CAREGIVER)).getUser();

        requestReset(pending.getEmail())
                .andExpect(status().isOk());

        assertThat(userRepository.findById(pending.getId()).orElseThrow().getActivationToken())
                .isEqualTo(pending.getActivationToken());
    }

    @Test
    @Disabled("Nález: aktivační token jde použít i pro reset hesla; účet pak má heslo bez uživatelského jména a token zmizí, takže aktivaci nejde dokončit")
    void activationTokenCannotResetPassword() throws Exception {
        User pending = testData.withPendingAccount(testData.employee(department, EmployeeRole.CAREGIVER)).getUser();

        resetPassword(pending.getActivationToken(), NEW_PASSWORD);

        User stillPending = userRepository.findById(pending.getId()).orElseThrow();
        assertThat(stillPending.getPassword()).isNull();
        assertThat(stillPending.getActivationToken()).isEqualTo(pending.getActivationToken());
    }

    @Test
    void validTokenChangesPasswordAndIsCleared() throws Exception {
        String token = requestedToken();
        clock.fixAt(EXPIRY);

        resetPassword(token, NEW_PASSWORD)
                .andExpect(status().isOk());

        User changed = userRepository.findById(account.getId()).orElseThrow();
        assertThat(passwordEncoder.matches(NEW_PASSWORD, changed.getPassword())).isTrue();
        assertThat(changed.getActivationToken()).isNull();
        assertThat(changed.getTokenExpiry()).isNull();
    }

    @Test
    void tokenIsValidUpToItsExpiry() throws Exception {
        String token = requestedToken();
        clock.fixAt(EXPIRY);

        validateReset(token)
                .andExpect(status().isOk());
    }

    @Test
    void tokenIsInvalidOneSecondAfterExpiry() throws Exception {
        String token = requestedToken();
        clock.fixAt(EXPIRY.plusSeconds(1));

        validateReset(token)
                .andExpect(status().isBadRequest());
    }

    @Test
    void expiredTokenCannotChangePassword() throws Exception {
        String token = requestedToken();
        clock.fixAt(EXPIRY.plusSeconds(1));

        resetPassword(token, NEW_PASSWORD)
                .andExpect(status().isUnauthorized());

        assertPasswordUnchanged(account);
    }

    @Test
    void tokenCannotBeUsedTwice() throws Exception {
        String token = requestedToken();
        resetPassword(token, NEW_PASSWORD)
                .andExpect(status().isOk());

        resetPassword(token, "Utocnik1!")
                .andExpect(status().isNotFound());
        validateReset(token)
                .andExpect(status().isBadRequest());

        assertThat(passwordEncoder.matches(NEW_PASSWORD,
                userRepository.findById(account.getId()).orElseThrow().getPassword())).isTrue();
    }

    @Test
    void newRequestInvalidatesPreviousToken() throws Exception {
        String first = requestedToken();
        requestReset(account.getEmail());

        resetPassword(first, NEW_PASSWORD)
                .andExpect(status().isNotFound());

        assertPasswordUnchanged(account);
    }

    @Test
    void unknownTokenIsRejected() throws Exception {
        requestedToken();

        resetPassword("neexistujici-token", NEW_PASSWORD)
                .andExpect(status().isNotFound());
        validateReset("neexistujici-token")
                .andExpect(status().isBadRequest());

        assertPasswordUnchanged(account);
    }

    @Test
    void missingTokenChangesNoPassword() throws Exception {
        resetPasswordWithoutToken()
                .andExpect(status().isBadRequest());

        assertPasswordUnchanged(account);
    }

    @Test
    @Disabled("Nález: reset bez tokenu volá findByActivationToken(null), což najde účet s prázdným tokenem; "
            + "heslo dnes chrání jen NullPointerException na prázdném tokenExpiry, ne kontrola tokenu")
    void missingTokenChangesNoPasswordEvenWithLeftoverExpiry() throws Exception {
        account.setTokenExpiry(EXPIRY);
        userRepository.save(account);

        resetPasswordWithoutToken()
                .andExpect(status().isBadRequest());

        assertPasswordUnchanged(account);
    }

    private ResultActions resetPasswordWithoutToken() throws Exception {
        return mockMvc.perform(put("/api/activation/reset-password").contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("password", NEW_PASSWORD))));
    }

    @Test
    @Disabled("Nález: backend nekontroluje délku nového hesla při resetu, pravidlo (alespoň 6 znaků) je jen ve frontendu")
    void tooShortPasswordIsRejected() throws Exception {
        String token = requestedToken();

        resetPassword(token, "12345")
                .andExpect(status().isBadRequest());

        assertPasswordUnchanged(account);
    }

    private String requestedToken() throws Exception {
        requestReset(account.getEmail())
                .andExpect(status().isOk());
        return currentToken();
    }

    private String currentToken() {
        return userRepository.findById(account.getId()).orElseThrow().getActivationToken();
    }

    private void assertPasswordUnchanged(User user) {
        assertThat(passwordEncoder.matches(TestData.PASSWORD,
                userRepository.findById(user.getId()).orElseThrow().getPassword())).isTrue();
    }

    private ResultActions requestReset(String email) throws Exception {
        return mockMvc.perform(post("/api/activation/forgot-password").param("email", email));
    }

    private ResultActions validateReset(String token) throws Exception {
        return mockMvc.perform(get("/api/activation/validate-reset").param("token", token));
    }

    private ResultActions resetPassword(String token, String password) throws Exception {
        return mockMvc.perform(put("/api/activation/reset-password").contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("token", token, "password", password))));
    }
}
