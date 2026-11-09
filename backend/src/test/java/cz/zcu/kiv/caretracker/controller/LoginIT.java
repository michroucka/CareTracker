package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import cz.zcu.kiv.caretracker.support.TestData;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MvcResult;

import static cz.zcu.kiv.caretracker.support.FormLogin.REMEMBER_ME_COOKIE;
import static cz.zcu.kiv.caretracker.support.FormLogin.login;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Form login and logout through the real security filter chain, with the JSON responses the login page reads
 * ({@code success}, {@code message}, {@code username}, {@code role}, {@code errorType}).
 */
class LoginIT extends AbstractIntegrationTest {

    private static final String WRONG_PASSWORD = "Spatne123!";

    @Autowired
    private UserRepository userRepository;

    private Employee employee;
    private User account;

    @BeforeEach
    void createAccount() {
        employee = testData.employee(testData.department(testData.organization()), EmployeeRole.CAREGIVER);
        account = employee.getUser();
    }

    @Test
    void successReturnsJsonForLoginPageAndStartsSession() throws Exception {
        MvcResult result = mockMvc.perform(login(account.getUsername(), TestData.PASSWORD))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Přihlášení proběhlo úspěšně"))
                .andExpect(jsonPath("$.username").value(account.getUsername()))
                .andExpect(jsonPath("$.role").value("CAREGIVER"))
                .andReturn();

        mockMvc.perform(get("/api/auth-status").session(sessionOf(result)))
                .andExpect(jsonPath("$.isLoggedIn").value(true))
                .andExpect(jsonPath("$.username").value(account.getUsername()));
    }

    @Test
    void loginChangesSessionIdAgainstSessionFixation() throws Exception {
        MockHttpSession sessionBeforeLogin = new MockHttpSession();
        String idBeforeLogin = sessionBeforeLogin.getId();

        MvcResult result = mockMvc.perform(login(account.getUsername(), TestData.PASSWORD).session(sessionBeforeLogin))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(sessionOf(result).getId()).isNotEqualTo(idBeforeLogin);
    }

    @Test
    void wrongPasswordIsRejectedWithoutSession() throws Exception {
        MvcResult result = mockMvc.perform(login(account.getUsername(), WRONG_PASSWORD))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorType").value("INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.message").value("Neplatné přihlašovací údaje"))
                .andReturn();

        assertNotSignedIn(result);
    }

    @Test
    void unknownUserGetsTheSameAnswerAsWrongPassword() throws Exception {
        String wrongPassword = mockMvc.perform(login(account.getUsername(), WRONG_PASSWORD))
                .andReturn().getResponse().getContentAsString();

        mockMvc.perform(login("nikdo@caretracker.test", WRONG_PASSWORD))
                .andExpect(status().isUnauthorized())
                .andExpect(content().json(wrongPassword, true));
    }

    @Test
    void deactivatedAccountCannotSignIn() throws Exception {
        deactivate(account);

        MvcResult result = mockMvc.perform(login(account.getUsername(), TestData.PASSWORD))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorType").value("ACCOUNT_DISABLED"))
                .andExpect(jsonPath("$.message").value("Váš účet byl deaktivován"))
                .andReturn();

        assertNotSignedIn(result);
    }

    @Disabled("Nález: zablokovaný účet hlásí ACCOUNT_DISABLED i při špatném heslu (Spring kontroluje stav účtu "
            + "před heslem), takže kdokoli bez hesla zjistí, že účet existuje a je zablokovaný")
    @Test
    void deactivatedAccountWithWrongPasswordLooksLikeWrongPassword() throws Exception {
        String wrongPassword = mockMvc.perform(login(account.getUsername(), WRONG_PASSWORD))
                .andReturn().getResponse().getContentAsString();
        deactivate(account);

        mockMvc.perform(login(account.getUsername(), WRONG_PASSWORD))
                .andExpect(status().isUnauthorized())
                .andExpect(content().json(wrongPassword, true));
    }

    @Test
    void pendingAccountWithoutPasswordCannotSignIn() throws Exception {
        User pending = testData.withPendingAccount(
                testData.employee(employee.getDepartment(), EmployeeRole.CAREGIVER)).getUser();

        mockMvc.perform(login(pending.getEmail(), ""))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorType").value("INVALID_CREDENTIALS"));
        mockMvc.perform(login(pending.getEmail(), TestData.PASSWORD))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorType").value("INVALID_CREDENTIALS"));
    }

    @Test
    void usernameIsCaseSensitive() throws Exception {
        mockMvc.perform(login(account.getUsername().toUpperCase(), TestData.PASSWORD))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorType").value("INVALID_CREDENTIALS"));
    }

    @Disabled("Nález: zablokování účtu neukončí jeho přihlášené session, uživatel pracuje dál až do jejich vypršení")
    @Test
    void deactivationEndsExistingSession() throws Exception {
        MockHttpSession session = sessionOf(mockMvc.perform(login(account.getUsername(), TestData.PASSWORD))
                .andExpect(status().isOk())
                .andReturn());

        deactivate(account);

        mockMvc.perform(get("/api/user/me").session(session))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logoutInvalidatesSessionAndClearsCookies() throws Exception {
        MockHttpSession session = sessionOf(mockMvc.perform(login(account.getUsername(), TestData.PASSWORD))
                .andExpect(status().isOk())
                .andReturn());

        MockHttpServletResponse response = mockMvc.perform(post("/api/logout").session(session))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andReturn().getResponse();

        assertThat(session.isInvalid()).isTrue();
        assertCleared(response.getCookie("JSESSIONID"));
        assertCleared(response.getCookie(REMEMBER_ME_COOKIE));
        mockMvc.perform(get("/api/user/me").session(session))
                .andExpect(status().isUnauthorized());
    }

    private void deactivate(User user) {
        User stored = userRepository.findById(user.getId()).orElseThrow();
        stored.setActive(false);
        userRepository.save(stored);
    }

    private void assertNotSignedIn(MvcResult result) throws Exception {
        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        var request = get("/api/auth-status");
        if (session != null) {
            request.session(session);
        }
        mockMvc.perform(request)
                .andExpect(jsonPath("$.isLoggedIn").value(false));
    }

    private static void assertCleared(Cookie cookie) {
        assertThat(cookie).isNotNull();
        assertThat(cookie.getMaxAge()).isZero();
    }

    private static MockHttpSession sessionOf(MvcResult result) {
        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        assertThat(session).isNotNull();
        return session;
    }
}
