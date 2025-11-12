package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.LoginResult;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


@Service
public class LoginService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public LoginService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResult login(String username, String rawPassword) {
        return userRepository.findByUsername(username)
                .map(user -> {
                    if (passwordEncoder.matches(rawPassword, user.getPassword())) {
                        return new LoginResult(true, "Login successful");
                    } else {
                        return new LoginResult(false, "Nesprávné heslo");
                    }
                })
                .orElseGet(() -> new LoginResult(false, "Uživatel neexistuje"));
    }
}
