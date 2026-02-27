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

@RestController
@RequestMapping("/api/activation")
public class ActivationController {
    private static final Logger log = LoggerFactory.getLogger(ActivationController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Validuje aktivační token - kontroluje expiraci i to, zda účet ještě není aktivován
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
     * Validuje token pro reset hesla - kontroluje pouze expiraci
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
     * Dokončí aktivaci účtu - nastaví username a heslo
     */
    @PostMapping("/complete")
    public ResponseEntity<MessageResponseDTO> completeActivation(@RequestBody CompleteActivationRequestDTO request) {
        if (request.getToken() == null || request.getUsername() == null || request.getPassword() == null) {
            return ResponseEntity.badRequest().body(new MessageResponseDTO(false, "Chybí povinné parametry"));
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());

        // Dokončení aktivace - výjimky se propagují do GlobalExceptionHandler
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
