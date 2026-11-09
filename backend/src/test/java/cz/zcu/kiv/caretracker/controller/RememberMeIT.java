package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import cz.zcu.kiv.caretracker.support.TestData;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.Duration;

import static cz.zcu.kiv.caretracker.support.FormLogin.REMEMBER_ME_COOKIE;
import static cz.zcu.kiv.caretracker.support.FormLogin.login;
import static cz.zcu.kiv.caretracker.support.FormLogin.loginRemembered;
import static org.assertj.core.api.Assertions.assertThat;
import static cz.zcu.kiv.caretracker.support.CsrfTokens.validCsrfToken;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * "Zapamatovat si mě": the login sets a 7-day remember-me cookie that signs the user in on a request
 * without a session, as long as the account stays active and keeps its password.
 */
class RememberMeIT extends AbstractIntegrationTest {

    private static final int SEVEN_DAYS_IN_SECONDS = (int) Duration.ofDays(7).toSeconds();

    @Autowired
    private UserRepository userRepository;


    private User account;

    @BeforeEach
    void createAccount() {
        account = testData.employee(testData.department(testData.organization()), EmployeeRole.CAREGIVER).getUser();
    }

    @Test
    void loginWithRememberMeSetsCookieValidForSevenDays() throws Exception {
        Cookie cookie = rememberMeCookie();

        assertThat(cookie.getValue()).isNotBlank();
        assertThat(cookie.getMaxAge()).isEqualTo(SEVEN_DAYS_IN_SECONDS);
        assertThat(cookie.isHttpOnly()).isTrue();
    }

    @Test
    void loginWithoutRememberMeSetsNoCookie() throws Exception {
        Cookie cookie = mockMvc.perform(login(account.getUsername(), TestData.PASSWORD))
                .andExpect(status().isOk())
                .andReturn().getResponse().getCookie(REMEMBER_ME_COOKIE);

        assertThat(cookie).isNull();
    }

    @Test
    void cookieAloneSignsTheUserIn() throws Exception {
        Cookie cookie = rememberMeCookie();

        withOnly(cookie, get("/api/auth-status"))
                .andExpect(jsonPath("$.isLoggedIn").value(true))
                .andExpect(jsonPath("$.username").value(account.getUsername()));
        withOnly(cookie, get("/api/user/me"))
                .andExpect(status().isOk());
    }

    @Test
    void cookieOfDeactivatedAccountNoLongerWorks() throws Exception {
        Cookie cookie = rememberMeCookie();
        User stored = userRepository.findById(account.getId()).orElseThrow();
        stored.setActive(false);
        userRepository.save(stored);

        withOnly(cookie, get("/api/user/me"))
                .andExpect(status().isUnauthorized());
        withOnly(cookie, get("/api/auth-status"))
                .andExpect(jsonPath("$.isLoggedIn").value(false));
    }

    @Test
    void cookieStopsWorkingAfterPasswordReset() throws Exception {
        Cookie cookie = rememberMeCookie();
        User stored = userRepository.findById(account.getId()).orElseThrow();
        stored.setResetToken("reset-token");
        stored.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(stored);

        mockMvc.perform(put("/api/activation/reset-password").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("token", "reset-token", "password", "NoveHeslo1!"))))
                .andExpect(status().isOk());

        withOnly(cookie, get("/api/user/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tamperedCookieIsRejected() throws Exception {
        Cookie cookie = rememberMeCookie();
        Cookie tampered = new Cookie(REMEMBER_ME_COOKIE, "x" + cookie.getValue());

        withOnly(tampered, get("/api/user/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void cookieStopsWorkingAfterLogout() throws Exception {
        Cookie cookie = rememberMeCookie();

        mockMvc.perform(post("/api/logout").with(validCsrfToken()).cookie(cookie))
                .andExpect(status().isOk());

        withOnly(cookie, get("/api/user/me"))
                .andExpect(status().isUnauthorized());
    }

    private Cookie rememberMeCookie() throws Exception {
        Cookie cookie = mockMvc.perform(loginRemembered(account.getUsername(), TestData.PASSWORD))
                .andExpect(status().isOk())
                .andReturn().getResponse().getCookie(REMEMBER_ME_COOKIE);
        assertThat(cookie).isNotNull();
        return cookie;
    }

    /** A request as from a browser restarted after login: no session, just the remember-me cookie. */
    private ResultActions withOnly(Cookie cookie, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.cookie(cookie));
    }
}
