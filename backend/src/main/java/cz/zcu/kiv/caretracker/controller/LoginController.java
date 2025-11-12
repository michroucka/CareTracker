package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.dto.LoginRequest;

import cz.zcu.kiv.caretracker.dto.LoginResult;
import cz.zcu.kiv.caretracker.service.LoginService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class LoginController {
    private final LoginService loginService;

    public LoginController(LoginService loginService) {
        this.loginService = loginService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        LoginResult result = loginService.login(request.getUsername(), request.getPassword());

        if (result.isSuccess()) {
            return ResponseEntity.ok(Map.of("message", result.getMessage()));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", result.getMessage()));
    }
}
