package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.dto.MessageResponseDTO;
import cz.zcu.kiv.caretracker.dto.user.CompleteActivationRequestDTO;
import cz.zcu.kiv.caretracker.dto.user.PasswordResetRequestDTO;
import cz.zcu.kiv.caretracker.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for account activation and password reset flows.
 * All endpoints are publicly accessible (no authentication required) since they are
 * used before the user has an active session.
 */
@RestController
@RequestMapping("/api/activation")
public class ActivationController {
    private static final Logger log = LoggerFactory.getLogger(ActivationController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Validates an activation token, checking expiry and whether the account is already activated.
     *
     * @param token the activation token from the email link
     * @return 200 OK if valid, 400 Bad Request if invalid or expired
     */
    @GetMapping("/validate")
    public ResponseEntity<MessageResponseDTO> validateActivationToken(@RequestParam String token) {
        boolean isValid = userService.validateActivationToken(token);

        MessageResponseDTO response = new MessageResponseDTO(
                isValid,
                isValid ? "Token je validní" : "Token je neplatný nebo vypršel"
        );

        return isValid
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
    }

    /**
     * Validates a password-reset token, checking expiry only (activation state is not checked).
     *
     * @param token the reset token from the email link
     * @return 200 OK if valid, 400 Bad Request if invalid or expired
     */
    @GetMapping("/validate-reset")
    public ResponseEntity<MessageResponseDTO> validateResetToken(@RequestParam String token) {
        boolean isValid = userService.validateToken(token);

        MessageResponseDTO response = new MessageResponseDTO(
                isValid,
                isValid ? "Token je validní" : "Token je neplatný nebo vypršel"
        );

        return isValid
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
    }

    /**
     * Completes account activation by setting the username and password.
     * The password is hashed here before being passed to the service.
     *
     * @param request contains the token, chosen username, and plaintext password
     * @return 200 OK on success; exceptions propagate to {@link cz.zcu.kiv.caretracker.exception.GlobalExceptionHandler}
     */
    @PostMapping("/complete")
    public ResponseEntity<MessageResponseDTO> completeActivation(@RequestBody CompleteActivationRequestDTO request) {
        if (request.getToken() == null || request.getUsername() == null || request.getPassword() == null) {
            return ResponseEntity.badRequest().body(new MessageResponseDTO(false, "Chybí povinné parametry"));
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());
        userService.completeActivation(request.getToken(), request.getUsername(), hashedPassword);

        log.info("Account activation completed successfully for user: {}", request.getUsername());

        return ResponseEntity.ok(new MessageResponseDTO(true, "Účet byl úspěšně aktivován"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponseDTO> sendResetPasswordEmailPublic(@RequestParam String email) {
        return ResponseEntity.ok(userService.sendResetPasswordEmailByEmail(email));
    }

    @PutMapping("/reset-password")
    public ResponseEntity<MessageResponseDTO> resetPassword(@RequestBody PasswordResetRequestDTO dto) {
        MessageResponseDTO response = userService.resetPassword(dto);

        return ResponseEntity.ok(response);
    }
}
