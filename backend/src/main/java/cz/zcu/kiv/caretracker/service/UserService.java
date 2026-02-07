package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.exception.ResourceNotFoundException;
import cz.zcu.kiv.caretracker.exception.TokenExpiredException;
import cz.zcu.kiv.caretracker.exception.ValidationException;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {
    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Vytvoří User účet pro zaměstnance s aktivačním tokenem.
     * Účet bude neaktivní dokud zaměstnanec nedokončí aktivaci.
     * Odešle aktivační email.
     */
    @Transactional
    public User createUserForEmployee(Employee employee, String email, Boolean isAdmin) {
        User user = new User();
        user.setEmployee(employee);
        user.setEmail(email);
        user.setRole(isAdmin ? UserRole.ADMIN : employee.getRole().toUserRole());
        user.setActive(true);

        // Vygeneruj aktivační token
        String activationToken = UUID.randomUUID().toString();
        user.setActivationToken(activationToken);
        user.setTokenExpiry(LocalDateTime.now().plusDays(7)); // Token platný 7 dní

        User savedUser = userRepository.save(user);

        // Odeslání aktivačního emailu
        try {
            String recipientName = employee.getFirstName() + " " + employee.getLastName();
            emailService.sendActivationEmail(email, activationToken, recipientName);
            log.info("Activation email sent for user: {}", email);
        } catch (Exception e) {
            log.error("Failed to send activation email for user: {}, error: {}", email, e.getMessage());
            // Pokračujeme i při selhání emailu - uživatel je vytvořen
        }

        return savedUser;
    }

    /**
     * Aktualizuje existující User účet zaměstnance.
     */
    @Transactional
    public User updateUserForEmployee(Employee employee, String email, Boolean isAdmin) {
        User user = employee.getUser();

        user.setEmail(email);
        user.setRole(isAdmin ? UserRole.ADMIN : employee.getRole().toUserRole());

        return userRepository.save(user);
    }

    private User changeUserStatus(User user, Boolean active) {
        user.setActive(active);

        return userRepository.save(user);
    }

    @Transactional
    public User deactivateUserForEmployee(Employee employee) {
        return changeUserStatus(employee.getUser(), false);
    }

    @Transactional
    public User activateUserForEmployee(Employee employee) {
        return changeUserStatus(employee.getUser(), true);
    }

    /**
     * Znovu odešle aktivační email s novým tokenem
     */
    @Transactional
    public void resendActivationEmail(User user) {
        // Kontrola, zda už není účet aktivován
        if (user.getUsername() != null && !user.getUsername().isEmpty()) {
            throw new ValidationException("Účet je již aktivován");
        }

        // Vygeneruj nový aktivační token
        String activationToken = UUID.randomUUID().toString();
        user.setActivationToken(activationToken);
        user.setTokenExpiry(LocalDateTime.now().plusDays(7));

        userRepository.save(user);

        // Odeslání aktivačního emailu
        try {
            String recipientName = user.getEmployee() != null
                    ? user.getEmployee().getFirstName() + " " + user.getEmployee().getLastName()
                    : "uživateli";
            emailService.sendActivationEmail(user.getEmail(), activationToken, recipientName);
        } catch (Exception e) {
            log.error("Failed to resend activation email for user: {}, error: {}", user.getEmail(), e.getMessage());
            throw new ValidationException("Nepodařilo se odeslat aktivační email");
        }
    }

    /**
     * Validuje aktivační token (bez aktivace účtu)
     */
    @Transactional(readOnly = true)
    public boolean validateActivationToken(String token) {
        Optional<User> userOpt = userRepository.findByActivationToken(token);

        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();

        // Kontrola expirace
        if (user.getTokenExpiry().isBefore(LocalDateTime.now())) {
            return false;
        }

        // Kontrola, zda už není aktivován
        if (user.getUsername() != null && !user.getUsername().isEmpty()) {
            return false;
        }

        return true;
    }

    /**
     * Dokončí aktivaci účtu - nastaví username a heslo
     */
    @Transactional
    public User completeActivation(String token, String username, String password) {
        User user = userRepository.findByActivationToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Neplatný aktivační token"));

        // Kontrola expirace tokenu
        if (user.getTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new TokenExpiredException("Platnost aktivačního tokenu vypršela");
        }

        // Kontrola, zda už není účet aktivován
        if (user.getUsername() != null && !user.getUsername().isEmpty()) {
            throw new ValidationException("Účet je již aktivován");
        }

        // Kontrola, zda username není již použité
        if (userRepository.findByUsername(username).isPresent()) {
            throw new ValidationException("Uživatelské jméno je již použité");
        }

        user.setUsername(username);
        user.setPassword(password);
        user.setActivationToken(null);
        user.setTokenExpiry(null);
        user.setActive(true);

        User savedUser = userRepository.save(user);
        log.info("User activation completed for: {}", username);

        return savedUser;
    }
}
