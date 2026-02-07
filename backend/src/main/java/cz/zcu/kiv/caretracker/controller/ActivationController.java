package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/activation")
public class ActivationController {
    private static final Logger log = LoggerFactory.getLogger(ActivationController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Validuje aktivační token bez aktivace účtu
     */
    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateToken(@RequestParam String token) {
        boolean isValid = userService.validateActivationToken(token);

        if (isValid) {
            log.debug("Activation token validated successfully: {}", token.substring(0, 8) + "...");
            return ResponseEntity.ok(Map.of(
                    "valid", true,
                    "message", "Token je validní"
            ));
        } else {
            log.debug("Invalid or expired activation token: {}", token.substring(0, 8) + "...");
            return ResponseEntity.ok(Map.of(
                    "valid", false,
                    "message", "Token je neplatný nebo vypršel"
            ));
        }
    }

    /**
     * Dokončí aktivaci účtu - nastaví username a heslo
     */
    @PostMapping("/complete")
    public ResponseEntity<Map<String, Object>> completeActivation(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String username = request.get("username");
        String password = request.get("password");

        if (token == null || username == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Chybí povinné parametry"
            ));
        }

        // Zahashuj heslo
        String hashedPassword = passwordEncoder.encode(password);

        // Dokončení aktivace - výjimky se propagují do GlobalExceptionHandler
        User user = userService.completeActivation(token, username, hashedPassword);

        log.info("Account activation completed successfully for user: {}", username);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Účet byl úspěšně aktivován",
                "username", user.getUsername()
        ));
    }
}
