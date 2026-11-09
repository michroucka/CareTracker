package cz.zcu.kiv.caretracker.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.rememberme.InvalidCookieException;
import org.springframework.security.web.authentication.rememberme.PersistentRememberMeToken;
import org.springframework.security.web.authentication.rememberme.PersistentTokenBasedRememberMeServices;
import org.springframework.security.web.authentication.rememberme.PersistentTokenRepository;
import org.springframework.security.web.authentication.rememberme.RememberMeAuthenticationException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Date;

/**
 * Remember-me tokens stored in the database, so logout and a password reset revoke them on the server.
 * Unlike Spring's persistent tokens, a token is not replaced on every use: the SPA sends several requests
 * at once after the browser restarts, and replacing the token would make all but the first look like
 * a stolen cookie and sign the user out everywhere.
 */
public class RevocableRememberMeServices extends PersistentTokenBasedRememberMeServices {

    private final PersistentTokenRepository tokenRepository;

    public RevocableRememberMeServices(String key, UserDetailsService userDetailsService,
                                       PersistentTokenRepository tokenRepository) {
        super(key, userDetailsService, tokenRepository);
        this.tokenRepository = tokenRepository;
    }

    @Override
    protected UserDetails processAutoLoginCookie(String[] cookieTokens, HttpServletRequest request,
                                                 HttpServletResponse response) {
        if (cookieTokens.length != 2) {
            throw new InvalidCookieException("Remember-me cookie must contain series and token");
        }
        PersistentRememberMeToken stored = tokenRepository.getTokenForSeries(cookieTokens[0]);
        if (stored == null || !constantTimeEquals(stored.getTokenValue(), cookieTokens[1])) {
            throw new RememberMeAuthenticationException("Unknown or revoked remember-me token");
        }
        long expiresAt = stored.getDate().getTime() + getTokenValiditySeconds() * 1000L;
        if (expiresAt < new Date().getTime()) {
            tokenRepository.removeUserTokens(stored.getUsername());
            throw new RememberMeAuthenticationException("Remember-me token has expired");
        }
        return getUserDetailsService().loadUserByUsername(stored.getUsername());
    }

    /**
     * Revokes the token of the cookie even when the request has no signed-in user: logout runs before
     * remember-me sign-in, so a browser whose session expired would otherwise keep a working cookie.
     */
    @Override
    public void logout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        super.logout(request, response, authentication);
        if (authentication == null) {
            revokeTokenOf(extractRememberMeCookie(request));
        }
    }

    private void revokeTokenOf(String cookieValue) {
        if (cookieValue == null || cookieValue.isEmpty()) {
            return;
        }
        try {
            PersistentRememberMeToken stored = tokenRepository.getTokenForSeries(decodeCookie(cookieValue)[0]);
            if (stored != null) {
                tokenRepository.removeUserTokens(stored.getUsername());
            }
        } catch (InvalidCookieException e) {
            // nothing to revoke for a cookie that never was valid
        }
    }

    /** A cookie that is not valid Base64 of "series:token" is rejected like any other invalid cookie, not with a 500. */
    @Override
    protected String[] decodeCookie(String cookieValue) throws InvalidCookieException {
        try {
            return super.decodeCookie(cookieValue);
        } catch (IllegalArgumentException e) {
            throw new InvalidCookieException("Remember-me cookie cannot be decoded");
        }
    }

    private static boolean constantTimeEquals(String expected, String actual) {
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), actual.getBytes(StandardCharsets.UTF_8));
    }
}
