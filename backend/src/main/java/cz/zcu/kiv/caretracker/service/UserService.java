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
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.task.TaskExecutionAutoConfiguration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService extends BaseRoleFilteringService<User, UserDTO>{
    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    private static final String RESET_REQUESTED_MESSAGE =
            "Pokud účet s tímto e-mailem existuje, poslali jsme na něj odkaz pro nastavení nového hesla";

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EmailService emailService;
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private Clock clock;
    @Autowired
    @Qualifier(TaskExecutionAutoConfiguration.APPLICATION_TASK_EXECUTOR_BEAN_NAME)
    private TaskExecutor mailExecutor;

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
     * @throws ValidationException if the username is empty or the e-mail belongs to another account
     */
    @Transactional
    public User updateCurrentUser(UserRequestDTO dto) {
        User user = getCurrentUser();
        if (dto.getUsername() == null || dto.getUsername().isBlank()) {
            throw new ValidationException("Uživatelské jméno nesmí být prázdné");
        }
        validateEmailAvailable(dto.getEmail(), user.getId());
        userMapper.requestToUser(user, dto);
        return userRepository.save(user);
    }

    /**
     * Password reset looks the account up by e-mail, so two accounts must not share one.
     *
     * @param ownUserId the account being changed (its own e-mail is fine), {@code null} for a new account
     * @throws ValidationException if another account already uses the e-mail
     */
    private void validateEmailAvailable(String email, Long ownUserId) {
        if (email == null) {
            return;
        }
        boolean taken = ownUserId == null
                ? userRepository.existsByEmailIgnoreCase(email)
                : userRepository.existsByEmailIgnoreCaseAndIdNot(email, ownUserId);
        if (taken) {
            throw new ValidationException("Tento e-mail už používá jiný účet");
        }
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
        User user = userRepository.findByResetToken(dto.getToken())
                .orElseThrow(() -> new ResourceNotFoundException("Neplatný token"));
        if (user.getResetTokenExpiry().isBefore(LocalDateTime.now(clock))) {
            throw new TokenExpiredException("Platnost odkazu pro reset hesla vypršela");
        }

        String hashedPassword = passwordEncoder.encode(dto.getPassword());

        user.setPassword(hashedPassword);
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
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
        validateEmailAvailable(email, null);
        User user = new User();
        user.setEmployee(employee);
        user.setEmail(email);
        user.setRole(Boolean.TRUE.equals(isAdmin) ? UserRole.ADMIN : employee.getRole().toUserRole());
        user.setActive(true);

        String activationToken = UUID.randomUUID().toString();
        user.setActivationToken(activationToken);
        user.setTokenExpiry(LocalDateTime.now(clock).plusDays(7));

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

        validateEmailAvailable(email, user.getId());
        user.setEmail(email);
        user.setRole(Boolean.TRUE.equals(isAdmin) ? UserRole.ADMIN : employee.getRole().toUserRole());

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
     * @throws ValidationException if the client already has an account or the e-mail belongs to another account
     */
    @Transactional
    public void createUserForClient(Client client, String email) {
        if (userRepository.existsByClientId(client.getId())) {
            throw new ValidationException("Klient už má v aplikaci účet");
        }
        validateEmailAvailable(email, null);
        User user = new User();
        user.setClient(client);
        user.setEmail(email);
        user.setRole(UserRole.CLIENT);
        user.setActive(true);

        String activationToken = UUID.randomUUID().toString();
        user.setActivationToken(activationToken);
        user.setTokenExpiry(LocalDateTime.now(clock).plusDays(7));

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

        if (isActivated(user)) {
            throw new ValidationException("Účet je již aktivován");
        }

        String activationToken = UUID.randomUUID().toString();
        user.setActivationToken(activationToken);
        user.setTokenExpiry(LocalDateTime.now(clock).plusDays(7));

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

    /** The owner has completed activation by choosing a username (and a password). */
    private static boolean isActivated(User user) {
        return user.getUsername() != null && !user.getUsername().isEmpty();
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

        if (user.getTokenExpiry().isBefore(LocalDateTime.now(clock))) {
            return false;
        }

        return !isActivated(user);
    }

    /**
     * Validates a password-reset token: checks existence and expiry only (activation state is ignored).
     *
     * @param token the reset token
     * @return {@code true} if the token exists and has not expired
     */
    @Transactional(readOnly = true)
    public boolean validateResetToken(String token) {
        Optional<User> userOpt = userRepository.findByResetToken(token);

        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();

        return !user.getResetTokenExpiry().isBefore(LocalDateTime.now(clock));
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

        if (user.getTokenExpiry().isBefore(LocalDateTime.now(clock))) {
            throw new TokenExpiredException("Platnost aktivačního tokenu vypršela");
        }

        if (isActivated(user)) {
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
        String token = issueResetToken(user);
        emailService.sendPasswordResetEmail(user.getEmail(), token, resetMailRecipientName(user));
        return new MessageResponseDTO(true, "Email pro reset hesla byl odeslán");
    }

    /**
     * Generates a password-reset token for the user with the given email and sends a reset email.
     * Used on the public forgot-password endpoint where the user is not authenticated, so the response
     * is the same whether or not a matching account exists.
     *
     * @param email the email address to look up
     * @return the same message for every e-mail
     */
    @Transactional
    public MessageResponseDTO sendResetPasswordEmailByEmail(String email) {
        List<User> matches = userRepository.findAllByEmailIgnoreCase(email);
        // Older data may hold one address in two letter cases; such a request is left unanswered instead of guessing.
        // A pending account has no password to reset; its activation link must stay valid.
        if (matches.size() == 1 && isActivated(matches.getFirst())) {
            User user = matches.getFirst();
            String token = issueResetToken(user);
            String recipientEmail = user.getEmail();
            String recipientName = resetMailRecipientName(user);
            // Sending takes long enough to reveal by timing that the account exists, so the response does not wait for it.
            mailExecutor.execute(() -> emailService.sendPasswordResetEmail(recipientEmail, token, recipientName));
        }
        return new MessageResponseDTO(true, RESET_REQUESTED_MESSAGE);
    }

    /** Creates a 24-hour reset token and persists it. */
    private String issueResetToken(User user) {
        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(LocalDateTime.now(clock).plusHours(24));
        userRepository.save(user);
        return token;
    }

    private static String resetMailRecipientName(User user) {
        if (user.getEmployee() != null) {
            return user.getEmployee().getFullName();
        }
        if (user.getClient() != null) {
            return user.getClient().getFullName();
        }
        return user.getUsername();
    }
}
