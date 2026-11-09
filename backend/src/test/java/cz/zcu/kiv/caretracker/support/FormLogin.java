package cz.zcu.kiv.caretracker.support;

import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * Login request exactly as the frontend sends it: a form-encoded POST to {@code /api/login}
 * with {@code remember-me} set to "on" or left empty.
 */
public final class FormLogin {

    public static final String REMEMBER_ME_COOKIE = "remember-me";

    private FormLogin() {
    }

    public static MockHttpServletRequestBuilder login(String username, String password) {
        return login(username, password, false);
    }

    public static MockHttpServletRequestBuilder loginRemembered(String username, String password) {
        return login(username, password, true);
    }

    private static MockHttpServletRequestBuilder login(String username, String password, boolean rememberMe) {
        return post("/api/login")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("username", username)
                .param("password", password)
                .param("remember-me", rememberMe ? "on" : "");
    }
}
