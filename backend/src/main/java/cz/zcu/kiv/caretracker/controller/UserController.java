package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.dto.MessageResponseDTO;
import cz.zcu.kiv.caretracker.dto.user.UserDTO;
import cz.zcu.kiv.caretracker.dto.user.UserRequestDTO;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.mapper.UserMapper;
import cz.zcu.kiv.caretracker.service.MyUserDetailsService;
import cz.zcu.kiv.caretracker.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for the current user's own profile management and password reset.
 * After a successful username update the Spring Security context is refreshed in-place
 * so the session remains valid without requiring a re-login.
 */
@RestController
@RequestMapping("/api/user")
public class UserController {
    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserService userService;
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private MyUserDetailsService myUserDetailsService;

    /** Returns the current user's profile. */
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser() {
        log.info("Fetching current user details");
        UserDTO user = userService.getCurrentUserDTO();

        return ResponseEntity.ok(user);
    }

    /**
     * Updates the current user's profile.
     * After saving, the Spring Security context is refreshed so the session stays valid
     * even when the username changes.
     */
    @PutMapping("/me")
    public ResponseEntity<UserDTO> updateCurrentUser(@RequestBody UserRequestDTO dto) {
        log.info("Updating current user details");

        User user = userService.updateCurrentUser(dto);

        // Refresh security context in-place so the session remains valid after a username change
        Authentication currentAuth = SecurityContextHolder.getContext().getAuthentication();
        UserDetails newDetails = myUserDetailsService.loadUserByUsername(user.getUsername());
        Authentication newAuth = new UsernamePasswordAuthenticationToken(newDetails, currentAuth.getCredentials(), newDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(newAuth);

        return ResponseEntity.ok(userMapper.toDTO(user));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponseDTO> sendResetPasswordEmail() {
        return ResponseEntity.ok(userService.sendResetPasswordEmail());
    }
}
