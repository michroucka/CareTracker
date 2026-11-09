package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import cz.zcu.kiv.caretracker.support.TestData;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.Map;

import static cz.zcu.kiv.caretracker.support.FormLogin.login;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Writes of a signed-in user need the token from the XSRF-TOKEN cookie in the X-XSRF-TOKEN header,
 * so another site cannot make the browser send them with the session cookie.
 * Login, activation and password reset have no session yet and work without the token.
 * Uses real login sessions and cookies, as the browser does, not the test login helper.
 */
class CsrfIT extends AbstractIntegrationTest {

    private static final String CSRF_COOKIE = "XSRF-TOKEN";
    private static final String CSRF_HEADER = "X-XSRF-TOKEN";

    private User account;

    @BeforeEach
    void createAccount() {
        account = testData.employee(testData.department(testData.organization()), EmployeeRole.CAREGIVER).getUser();
    }

    @Test
    void firstRequestGetsTokenCookieReadableByTheApp() throws Exception {
        Cookie token = mockMvc.perform(get("/api/auth-status"))
                .andReturn().getResponse().getCookie(CSRF_COOKIE);

        assertThat(token).isNotNull();
        assertThat(token.getValue()).isNotBlank();
        assertThat(token.isHttpOnly()).isFalse();
    }

    @Test
    void loginWorksWithoutToken() throws Exception {
        mockMvc.perform(login(account.getUsername(), TestData.PASSWORD))
                .andExpect(status().isOk());
    }

    @Test
    void writeWithoutTokenIsForbidden() throws Exception {
        MockHttpSession session = signedInSession();

        mockMvc.perform(updateOwnAccount(session))
                .andExpect(status().isForbidden());
    }

    @Test
    void writeWithWrongTokenIsForbidden() throws Exception {
        MockHttpSession session = signedInSession();
        Cookie token = csrfCookie(session);

        mockMvc.perform(updateOwnAccount(session).cookie(token).header(CSRF_HEADER, "jiny-token"))
                .andExpect(status().isForbidden());
    }

    @Test
    void writeWithTokenFromCookieInHeaderIsAllowed() throws Exception {
        MockHttpSession session = signedInSession();
        Cookie token = csrfCookie(session);

        mockMvc.perform(updateOwnAccount(session).cookie(token).header(CSRF_HEADER, token.getValue()))
                .andExpect(status().isOk());
    }

    @Test
    void logoutWithoutTokenIsForbiddenSoAnotherSiteCannotSignTheUserOut() throws Exception {
        MockHttpSession session = signedInSession();

        mockMvc.perform(post("/api/logout").session(session))
                .andExpect(status().isForbidden());
    }

    @Test
    void readsNeedNoToken() throws Exception {
        mockMvc.perform(get("/api/user/me").session(signedInSession()))
                .andExpect(status().isOk());
    }

    @Test
    void passwordResetRequestNeedsNoToken() throws Exception {
        mockMvc.perform(post("/api/activation/forgot-password").param("email", account.getEmail()))
                .andExpect(status().isOk());
    }

    private MockHttpSession signedInSession() throws Exception {
        MvcResult result = mockMvc.perform(login(account.getUsername(), TestData.PASSWORD))
                .andExpect(status().isOk())
                .andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    /** The token the app reads before a write; a new one is issued after login. */
    private Cookie csrfCookie(MockHttpSession session) throws Exception {
        Cookie token = mockMvc.perform(get("/api/auth-status").session(session))
                .andReturn().getResponse().getCookie(CSRF_COOKIE);
        assertThat(token).isNotNull();
        return token;
    }

    private MockHttpServletRequestBuilder updateOwnAccount(MockHttpSession session) {
        return put("/api/user/me").session(session).contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("username", account.getUsername(), "email", account.getEmail())));
    }
}
