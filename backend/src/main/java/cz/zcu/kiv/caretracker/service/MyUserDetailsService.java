package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import cz.zcu.kiv.caretracker.security.MyUserDetails;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MyUserDetailsService implements UserDetailsService {
    private static final Logger log = LoggerFactory.getLogger(MyUserDetailsService.class);

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.debug("Attempting to load user: {}", username);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("User '{}' not found", username);
                    return new UsernameNotFoundException("User not found: " + username);
                });

        log.info("User '{}' successfully loaded from database", username);

        // Získej organizationId z employee (pokud má zaměstnance)
        Long organizationId = null;
        if (user.getEmployee() != null && user.getEmployee().getOrganization() != null) {
            organizationId = user.getEmployee().getOrganization().getId();
        }

        // Vytvoř authorities z role
        List<SimpleGrantedAuthority> authorities = List.of(
            new SimpleGrantedAuthority("ROLE_" + user.getRole().toString())
        );

        return new MyUserDetails(
            user.getId(),
            user.getUsername(),
            user.getPassword(),
            organizationId,
            authorities,
            user.getActive()
        );
    }
}
