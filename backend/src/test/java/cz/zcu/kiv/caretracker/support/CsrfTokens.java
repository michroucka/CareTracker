package cz.zcu.kiv.caretracker.support;

import jakarta.servlet.http.Cookie;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.Arrays;
import java.util.stream.Stream;

/**
 * A valid CSRF token sent the way the frontend sends it: the XSRF-TOKEN cookie and the same value
 * in the X-XSRF-TOKEN header. Used instead of Spring's {@code csrf()} post-processor, which swaps the token
 * repository inside the shared filter chain for good and so hides the real cookie from later tests.
 */
public final class CsrfTokens {

    public static final String COOKIE = "XSRF-TOKEN";
    public static final String HEADER = "X-XSRF-TOKEN";
    private static final String TEST_TOKEN = "test-csrf-token";

    private CsrfTokens() {
    }

    public static RequestPostProcessor validCsrfToken() {
        return request -> {
            Cookie[] existing = request.getCookies() != null ? request.getCookies() : new Cookie[0];
            request.setCookies(Stream.concat(Arrays.stream(existing), Stream.of(new Cookie(COOKIE, TEST_TOKEN)))
                    .toArray(Cookie[]::new));
            request.addHeader(HEADER, TEST_TOKEN);
            return request;
        };
    }
}
