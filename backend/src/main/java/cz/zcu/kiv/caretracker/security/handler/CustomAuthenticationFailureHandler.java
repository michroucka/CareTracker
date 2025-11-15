package cz.zcu.kiv.caretracker.security.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
public class CustomAuthenticationFailureHandler implements AuthenticationFailureHandler {

    private static final Logger log = LoggerFactory.getLogger(CustomAuthenticationFailureHandler.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                       HttpServletResponse response,
                                       AuthenticationException exception) throws IOException, ServletException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> data = new HashMap<>();
        data.put("success", false);

        // Rozlišení typu chyby
        String message;
        String errorType;
        String username = request.getParameter("username");

        if (exception instanceof BadCredentialsException) {
            message = "Neplatné přihlašovací údaje";
            errorType = "INVALID_CREDENTIALS";
            log.warn("Failed login attempt for user '{}' from IP: {} - Invalid credentials",
                    username, request.getRemoteAddr());
        } else if (exception instanceof LockedException) {
            message = "Váš účet byl zablokován";
            errorType = "ACCOUNT_LOCKED";
            log.warn("Login attempt for locked account '{}' from IP: {}",
                    username, request.getRemoteAddr());
        } else if (exception instanceof DisabledException) {
            message = "Váš účet byl deaktivován";
            errorType = "ACCOUNT_DISABLED";
            log.warn("Login attempt for disabled account '{}' from IP: {}",
                    username, request.getRemoteAddr());
        } else if (exception instanceof AccountExpiredException) {
            message = "Platnost vašeho účtu vypršela";
            errorType = "ACCOUNT_EXPIRED";
            log.warn("Login attempt for expired account '{}' from IP: {}",
                    username, request.getRemoteAddr());
        } else if (exception instanceof CredentialsExpiredException) {
            message = "Platnost vašeho hesla vypršela";
            errorType = "CREDENTIALS_EXPIRED";
            log.info("Login attempt with expired credentials for user '{}' from IP: {}",
                    username, request.getRemoteAddr());
        } else {
            message = "Přihlášení se nezdařilo";
            errorType = "AUTHENTICATION_FAILED";
            log.error("Unexpected authentication failure for user '{}' from IP: {} - {}",
                    username, request.getRemoteAddr(), exception.getMessage());
        }

        data.put("message", message);
        data.put("errorType", errorType);

        response.getWriter().write(objectMapper.writeValueAsString(data));
        response.getWriter().flush();
    }
}
