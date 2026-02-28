package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.MessageResponseDTO;
import cz.zcu.kiv.caretracker.dto.user.PasswordResetRequestDTO;
import cz.zcu.kiv.caretracker.dto.user.UserDTO;
import cz.zcu.kiv.caretracker.dto.user.UserRequestDTO;
import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.exception.ResourceNotFoundException;
import cz.zcu.kiv.caretracker.exception.TokenExpiredException;
import cz.zcu.kiv.caretracker.exception.ValidationException;
import cz.zcu.kiv.caretracker.mapper.UserMapper;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService extends BaseRoleFilteringService<User, UserDTO>{
    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EmailService emailService;
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserDTO getCurrentUserDTO() {
        User user = getCurrentUser();
        return userMapper.toDTO(user);
    }

    @Transactional
    public User updateCurrentUser(UserRequestDTO dto) {
        User user = getCurrentUser();
        userMapper.requestToUser(user, dto);
        return userRepository.save(user);
    }

    @Transactional
    public MessageResponseDTO resetPassword(PasswordResetRequestDTO dto) {
        User user = userRepository.findByActivationToken(dto.getToken())
                .orElseThrow(() -> new ResourceNotFoundException("Neplatný token"));
        validateToken(dto.getToken());

        String hashedPassword = passwordEncoder.encode(dto.getPassword());

        user.setPassword(hashedPassword);
        user.setActivationToken(null);
        user.setTokenExpiry(null);
        userRepository.save(user);

        return new MessageResponseDTO(true, "Heslo bylo úspěšně změněno");
    }

    /**
     * Vytvoří User účet pro zaměstnance s aktivačním tokenem.
     * Účet bude neaktivní dokud zaměstnanec nedokončí aktivaci.
     * Odešle aktivační email.
     */
    @Transactional
    public void createUserForEmployee(Employee employee, String email, Boolean isAdmin) {
        User user = new User();
        user.setEmployee(employee);
        user.setEmail(email);
        user.setRole(isAdmin ? UserRole.ADMIN : employee.getRole().toUserRole());
        user.setActive(true);

        String activationToken = UUID.randomUUID().toString();
        user.setActivationToken(activationToken);
        user.setTokenExpiry(LocalDateTime.now().plusDays(7));

        userRepository.save(user);
        emailService.sendActivationEmail(email, activationToken, employee.getFullName());
    }

    /**
     * Aktualizuje existující User účet zaměstnance.
     */
    @Transactional
    public void updateUserForEmployee(Employee employee, String email, Boolean isAdmin) {
        User user = employee.getUser();

        user.setEmail(email);
        user.setRole(isAdmin ? UserRole.ADMIN : employee.getRole().toUserRole());

        userRepository.save(user);
    }

    private void changeUserStatus(User user, Boolean active) {
        user.setActive(active);

        userRepository.save(user);
    }

    @Transactional
    public void deactivateUserForEmployee(Employee employee) {
        changeUserStatus(employee.getUser(), false);
    }

    @Transactional
    public void activateUserForEmployee(Employee employee) {
        changeUserStatus(employee.getUser(), true);
    }

    @Transactional
    public void createUserForClient(Client client, String email) {
        User user = new User();
        user.setClient(client);
        user.setEmail(email);
        user.setRole(UserRole.CLIENT);
        user.setActive(true);

        String activationToken = UUID.randomUUID().toString();
        user.setActivationToken(activationToken);
        user.setTokenExpiry(LocalDateTime.now().plusDays(7));

        userRepository.save(user);
        emailService.sendActivationEmail(email, activationToken, client.getFullName());
    }

    @Transactional
    public void deactivateUserForClient(Client client) {
        User user = userRepository.findByClientId(client.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Klient nemá v aplikaci účet"));
        changeUserStatus(user, false);
    }

    @Transactional
    public void activateUserForClient(Client client) {
        User user = userRepository.findByClientId(client.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Klient nemá v aplikaci účet"));
        changeUserStatus(user, true);
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
     * Validuje token
     */
    @Transactional(readOnly = true)
    public boolean validateActivationToken(String token) {
        Optional<User> userOpt = userRepository.findByActivationToken(token);

        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();

        if (user.getTokenExpiry().isBefore(LocalDateTime.now())) {
            return false;
        }

        // Kontrola, zda už není aktivován
        return user.getUsername() == null || user.getUsername().isEmpty();
    }

    @Transactional(readOnly = true)
    public boolean validateToken(String token) {
        Optional<User> userOpt = userRepository.findByActivationToken(token);

        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();

        return !user.getTokenExpiry().isBefore(LocalDateTime.now());
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

    @Transactional
    public MessageResponseDTO sendResetPasswordEmail() {
        User user = getCurrentUser();
        return generateAndSendResetToken(user);
    }

    @Transactional
    public MessageResponseDTO sendResetPasswordEmailByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Uživatel se zadaným emailem nenalezen"));
        return generateAndSendResetToken(user);
    }

    private MessageResponseDTO generateAndSendResetToken(User user) {
        String token = UUID.randomUUID().toString();
        user.setActivationToken(token);
        user.setTokenExpiry(LocalDateTime.now().plusHours(24));
        userRepository.save(user);

        String name = user.getEmployee() != null
                ? user.getEmployee().getFullName()
                : user.getUsername();
        emailService.sendPasswordResetEmail(user.getEmail(), token, name);

        return new MessageResponseDTO(true, "Email pro reset hesla byl odeslán");
    }
}
