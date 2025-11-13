package cz.zcu.kiv.caretracker.controller;


import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class AuthController {

    @GetMapping("/auth-status")
    public Map<String, Object> authStatus(Authentication auth) {
        if (auth != null && auth.isAuthenticated()) {
            return Map.of(
                    "isLoggedIn", true,
                    "username", auth.getName()
            );
        }
        return Map.of("isLoggedIn", false);
    }
}
