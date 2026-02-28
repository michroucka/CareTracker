package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import cz.zcu.kiv.caretracker.security.MyUserDetails;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.transaction.annotation.Transactional;
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
    @Transactional(readOnly = true)
    public Map<String, Object> authStatus(Authentication auth) {
        try {
            if (auth != null && auth.isAuthenticated()) {
                User user;
                if (auth.getPrincipal() instanceof MyUserDetails myUserDetails) {
                    user = userRepository.findById(myUserDetails.getUserId())
                            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
                } else {
                    user = userRepository.findByUsername(auth.getName())
                            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
                }

                log.debug("Authentication status check - authenticated user '{}'", user.getUsername());

                // Základní odpověď
                Map<String, Object> response = new java.util.HashMap<>();
                response.put("isLoggedIn", true);
                response.put("username", user.getUsername());
                response.put("role", user.getRole().toString());

                // Přidání organizačního kontextu pro zaměstnance
                try {
                    if (user.getEmployee() != null) {
                        response.put("employeeId", user.getEmployee().getId());
                        response.put("employeeRole", user.getEmployee().getRole().toString());

                        // Přidání department ID pro CAREGIVER, COORDINATOR a ADMIN
                        if (user.getEmployee().getDepartment() != null) {
                            response.put("departmentId", user.getEmployee().getDepartment().getId());
                        }

                        // Přidání organization ID
                        if (user.getEmployee().getOrganization() != null) {
                            response.put("organizationId", user.getEmployee().getOrganization().getId());
                        }
                    }
                } catch (Exception e) {
                    log.warn("Error loading employee context for user '{}': {}", user.getUsername(), e.getMessage());
                    // Continue with basic auth info without employee context
                }

                // Přidání klientského kontextu pro CLIENT roli
                try {
                    if (user.getClient() != null) {
                        response.put("clientId", user.getClient().getId());
                    }
                } catch (Exception e) {
                    log.warn("Error loading client context for user '{}': {}", user.getUsername(), e.getMessage());
                }

                return response;
            }
            log.debug("Authentication status check - no authenticated user");
            return Map.of("isLoggedIn", false);
        } catch (Exception e) {
            log.error("Error in auth status check", e);
            return Map.of("isLoggedIn", false, "error", e.getMessage());
        }
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
