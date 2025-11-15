package cz.zcu.kiv.caretracker.controller;


import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/auth-status")
    public Map<String, Object> authStatus(Authentication auth) {
        if (auth != null && auth.isAuthenticated()) {
            User user = userRepository.findByUsername(auth.getName())
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));

            log.debug("Authentication status check - authenticated user '{}'", auth.getName());
            return Map.of(
                    "isLoggedIn", true,
                    "username", auth.getName(),
                    "role", user.getRole().getDisplayName()
            );
        }
        log.debug("Authentication status check - no authenticated user");
        return Map.of("isLoggedIn", false);
    }

    @PostMapping("/logout")
    public Map<String, Object> logout(HttpServletRequest request, HttpServletResponse response) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            String username = auth.getName();
            new SecurityContextLogoutHandler().logout(request, response, auth);
            log.info("User '{}' logged out successfully", username);
            return Map.of(
                    "success", true
            );
        }
        log.debug("Logout attempt with no authenticated user");
        return Map.of(
                "success", false
        );
    }
}
