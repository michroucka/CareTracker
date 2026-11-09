package cz.zcu.kiv.caretracker.security.filter;

import cz.zcu.kiv.caretracker.repository.UserRepository;
import cz.zcu.kiv.caretracker.security.MyUserDetails;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Signs out a session whose account has been blocked since login. The session keeps the user loaded at login,
 * so without this check a blocked user could keep working until the session expires.
 * The request then continues as anonymous, so protected endpoints answer 401.
 */
public class ActiveAccountFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    public ActiveAccountFilter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null
                && authentication.getPrincipal() instanceof MyUserDetails user
                && !userRepository.existsByIdAndActiveTrue(user.getUserId())) {
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            SecurityContextHolder.clearContext();
        }
        chain.doFilter(request, response);
    }
}
