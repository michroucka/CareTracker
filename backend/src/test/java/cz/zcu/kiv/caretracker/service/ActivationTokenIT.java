package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.ResultActions;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Account activation: the token from the e-mail is valid for 7 days, works once and lets the owner choose
 * a unique username and a password. The clock stands on {@link #CREATED}, when the pending account is made.
 */
class ActivationTokenIT extends AbstractIntegrationTest {

    private static final LocalDateTime CREATED = LocalDateTime.of(2026, 11, 9, 10, 0);
    private static final LocalDateTime EXPIRY = CREATED.plusDays(7);
    private static final String NEW_PASSWORD = "Aktivace1!";

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Department department;
    private User pending;

    @BeforeEach
    void createPendingAccount() {
        clock.fixAt(CREATED);
        department = testData.department(testData.organization());
        pending = testData.withPendingAccount(testData.employee(department, EmployeeRole.CAREGIVER)).getUser();
    }

    @Test
    void newClientAccountGetsTokenValidForSevenDaysAndActivationMail() {
        Employee caregiver = testData.employee(department, EmployeeRole.CAREGIVER);
        Client client = testData.client(caregiver);

        userService.createUserForClient(client, "klient@caretracker.test");

        User account = userRepository.findByClientId(client.getId()).orElseThrow();
        assertThat(account.getTokenExpiry()).isEqualTo(EXPIRY);
        assertThat(account.getUsername()).isNull();
        List<MimeMessage> mails = sentMails();
        assertThat(mails).hasSize(1);
        assertThat(recipientOf(mails.getFirst())).isEqualTo("klient@caretracker.test");
        assertThat(mailText(mails.getFirst())).contains("/activate?token=" + account.getActivationToken());
    }

    @Test
    void tokenIsValidUpToItsExpiry() throws Exception {
        clock.fixAt(EXPIRY);

        validate(pending.getActivationToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void tokenIsInvalidOneSecondAfterExpiry() throws Exception {
        clock.fixAt(EXPIRY.plusSeconds(1));

        validate(pending.getActivationToken())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void unknownTokenIsInvalid() throws Exception {
        validate("neexistujici-token")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void tokenOfActivatedAccountIsNotValidForActivation() throws Exception {
        User activated = testData.employee(department, EmployeeRole.CAREGIVER).getUser();
        activated.setActivationToken("reset-token");
        activated.setTokenExpiry(EXPIRY);
        userRepository.save(activated);

        validate("reset-token")
                .andExpect(status().isBadRequest());
    }

    @Test
    void activationSetsCredentialsAndClearsToken() throws Exception {
        clock.fixAt(EXPIRY);

        complete(pending.getActivationToken(), "jana.novakova", NEW_PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        User activated = userRepository.findById(pending.getId()).orElseThrow();
        assertThat(activated.getUsername()).isEqualTo("jana.novakova");
        assertThat(passwordEncoder.matches(NEW_PASSWORD, activated.getPassword())).isTrue();
        assertThat(activated.getActivationToken()).isNull();
        assertThat(activated.getTokenExpiry()).isNull();
        assertThat(activated.getActive()).isTrue();
    }

    @Test
    void expiredTokenCannotActivate() throws Exception {
        clock.fixAt(EXPIRY.plusSeconds(1));

        complete(pending.getActivationToken(), "jana.novakova", NEW_PASSWORD)
                .andExpect(status().isUnauthorized());

        assertStillPending();
    }

    @Test
    void unknownTokenCannotActivate() throws Exception {
        complete("neexistujici-token", "jana.novakova", NEW_PASSWORD)
                .andExpect(status().isNotFound());

        assertStillPending();
    }

    @Test
    void tokenCannotBeUsedTwice() throws Exception {
        String token = pending.getActivationToken();
        complete(token, "jana.novakova", NEW_PASSWORD)
                .andExpect(status().isOk());

        complete(token, "utocnik", "Utocnik1!")
                .andExpect(status().isNotFound());
        validate(token)
                .andExpect(status().isBadRequest());

        User activated = userRepository.findById(pending.getId()).orElseThrow();
        assertThat(activated.getUsername()).isEqualTo("jana.novakova");
        assertThat(passwordEncoder.matches(NEW_PASSWORD, activated.getPassword())).isTrue();
    }

    @Test
    void usernameOfAnotherAccountIsRejectedAndTokenKeptForRetry() throws Exception {
        User colleague = testData.employee(department, EmployeeRole.COORDINATOR).getUser();

        complete(pending.getActivationToken(), colleague.getUsername(), NEW_PASSWORD)
                .andExpect(status().isBadRequest());

        assertStillPending();
        complete(pending.getActivationToken(), "jana.novakova", NEW_PASSWORD)
                .andExpect(status().isOk());
    }

    @Test
    void usernameDifferingOnlyInCaseIsRejected() throws Exception {
        User colleague = testData.employee(department, EmployeeRole.COORDINATOR).getUser();

        complete(pending.getActivationToken(), colleague.getUsername().toUpperCase(), NEW_PASSWORD)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Uživatelské jméno je již použité"));

        assertStillPending();
    }

    @Test
    void missingFieldIsRejected() throws Exception {
        Map<String, String> withoutPassword = new HashMap<>();
        withoutPassword.put("token", pending.getActivationToken());
        withoutPassword.put("username", "jana.novakova");

        mockMvc.perform(post("/api/activation/complete").contentType(MediaType.APPLICATION_JSON)
                        .content(json(withoutPassword)))
                .andExpect(status().isBadRequest());

        assertStillPending();
    }

    @Test
    void tooShortPasswordIsRejected() throws Exception {
        complete(pending.getActivationToken(), "jana.novakova", "12345")
                .andExpect(status().isBadRequest());

        assertStillPending();
    }

    @Test
    void blankUsernameIsRejected() throws Exception {
        complete(pending.getActivationToken(), " ", NEW_PASSWORD)
                .andExpect(status().isBadRequest());

        assertStillPending();
    }

    private void assertStillPending() {
        User account = userRepository.findById(pending.getId()).orElseThrow();
        assertThat(account.getUsername()).isNull();
        assertThat(account.getPassword()).isNull();
        assertThat(account.getActivationToken()).isEqualTo(pending.getActivationToken());
    }

    private ResultActions validate(String token) throws Exception {
        return mockMvc.perform(get("/api/activation/validate").param("token", token));
    }

    private ResultActions complete(String token, String username, String password) throws Exception {
        return mockMvc.perform(post("/api/activation/complete").contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("token", token, "username", username, "password", password))));
    }
}
