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

    /**
     * Returns the current user's profile as a DTO.
     *
     * @return the user DTO
     */
    @Transactional(readOnly = true)
    public UserDTO getCurrentUserDTO() {
        User user = getCurrentUser();
        return userMapper.toDTO(user);
    }

    /**
     * Updates the current user's profile from the supplied DTO.
     *
     * @param dto updated user data
     * @return the updated user entity
     */
    @Transactional
    public User updateCurrentUser(UserRequestDTO dto) {
        User user = getCurrentUser();
        userMapper.requestToUser(user, dto);
        return userRepository.save(user);
    }

    /**
     * Resets the user's password using a valid reset token.
     * Clears the token after a successful password change.
     *
     * @param dto contains the reset token and new password
     * @return success message
     * @throws ResourceNotFoundException if the token is not found
     * @throws TokenExpiredException if the token has expired
     */
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
     * Creates a user account for an employee and sends an activation email.
     * The account requires activation via the emailed token before it can be used.
     *
     * @param employee the employee to create an account for
     * @param email the email address for the account and activation message
     * @param isAdmin if {@code true}, the user is assigned the ADMIN role; otherwise uses the employee's role
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
     * Updates the email and role of an existing employee user account.
     *
     * @param employee the employee whose account should be updated
     * @param email new email address
     * @param isAdmin if {@code true}, assigns ADMIN role; otherwise uses the employee's role
     * @throws ResourceNotFoundException if the employee has no user account
     */
    @Transactional
    public void updateUserForEmployee(Employee employee, String email, Boolean isAdmin) {
        User user = employee.getUser();
        if (user == null) {
            throw new ResourceNotFoundException("Zaměstnanec nemá uživatelský účet");
        }

        user.setEmail(email);
        user.setRole(isAdmin ? UserRole.ADMIN : employee.getRole().toUserRole());

        userRepository.save(user);
    }

    /**
     * Sets the active flag on a user account.
     *
     * @throws ResourceNotFoundException if the user is null (no account exists)
     */
    private void changeUserStatus(User user, Boolean active) {
        if (user == null) {
            throw new ResourceNotFoundException("Zaměstnanec nemá uživatelský účet");
        }

        user.setActive(active);

        userRepository.save(user);
    }

    /**
     * Deactivates the user account associated with an employee.
     *
     * @param employee the employee whose account should be deactivated
     */
    @Transactional
    public void deactivateUserForEmployee(Employee employee) {
        changeUserStatus(employee.getUser(), false);
    }

    /**
     * Activates the user account associated with an employee.
     *
     * @param employee the employee whose account should be activated
     */
    @Transactional
    public void activateUserForEmployee(Employee employee) {
        changeUserStatus(employee.getUser(), true);
    }

    /**
     * Creates a user account for a client and sends an activation email.
     *
     * @param client the client to create an account for
     * @param email the email address for the account and activation message
     */
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

    /**
     * Deactivates the user account associated with a client.
     *
     * @param client the client whose account should be deactivated
     * @throws ResourceNotFoundException if the client has no user account
     */
    @Transactional
    public void deactivateUserForClient(Client client) {
        User user = userRepository.findByClientId(client.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Klient nemá v aplikaci účet"));
        changeUserStatus(user, false);
    }

    /**
     * Activates the user account associated with a client.
     *
     * @param client the client whose account should be activated
     * @throws ResourceNotFoundException if the client has no user account
     */
    @Transactional
    public void activateUserForClient(Client client) {
        User user = userRepository.findByClientId(client.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Klient nemá v aplikaci účet"));
        changeUserStatus(user, true);
    }

    /**
     * Generates a new activation token and resends the activation email.
     * Throws if the account is already activated.
     *
     * @param user the user to resend the activation email to
     * @throws ResourceNotFoundException if {@code user} is null
     * @throws ValidationException if the account is already activated or the email fails to send
     */
    @Transactional
    public void resendActivationEmail(User user) {
        if (user == null) {
            throw new ResourceNotFoundException("Uživatel neexistuje");
        }

        if (user.getUsername() != null && !user.getUsername().isEmpty()) {
            throw new ValidationException("Účet je již aktivován");
        }

        String activationToken = UUID.randomUUID().toString();
        user.setActivationToken(activationToken);
        user.setTokenExpiry(LocalDateTime.now().plusDays(7));

        userRepository.save(user);

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
     * Validates an activation token: checks existence, expiry, and that the account is not yet activated.
     *
     * @param token the activation token
     * @return {@code true} if the token is valid and the account is not yet activated
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

        return user.getUsername() == null || user.getUsername().isEmpty();
    }

    /**
     * Validates a password-reset token: checks existence and expiry only (activation state is ignored).
     *
     * @param token the reset token
     * @return {@code true} if the token exists and has not expired
     */
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
     * Completes account activation by setting the username and hashed password.
     * Clears the activation token on success.
     *
     * @param token the activation token from the email link
     * @param username the chosen username
     * @param password the already-hashed password
     * @return the activated user entity
     * @throws ResourceNotFoundException if the token is not found
     * @throws TokenExpiredException if the token has expired
     * @throws ValidationException if the account is already activated or the username is taken
     */
    @Transactional
    public User completeActivation(String token, String username, String password) {
        User user = userRepository.findByActivationToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Neplatný aktivační token"));

        if (user.getTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new TokenExpiredException("Platnost aktivačního tokenu vypršela");
        }

        if (user.getUsername() != null && !user.getUsername().isEmpty()) {
            throw new ValidationException("Účet je již aktivován");
        }

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

    /**
     * Generates a password-reset token for the current user and sends a reset email.
     *
     * @return success message
     */
    @Transactional
    public MessageResponseDTO sendResetPasswordEmail() {
        User user = getCurrentUser();
        return generateAndSendResetToken(user);
    }

    /**
     * Generates a password-reset token for the user with the given email and sends a reset email.
     * Used on the public forgot-password endpoint where the user is not authenticated.
     *
     * @param email the email address to look up
     * @return success message
     * @throws ResourceNotFoundException if no user with this email exists
     */
    @Transactional
    public MessageResponseDTO sendResetPasswordEmailByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Uživatel se zadaným emailem nenalezen"));
        return generateAndSendResetToken(user);
    }

    /** Creates a 24-hour reset token, persists it, and sends the reset email. */
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
