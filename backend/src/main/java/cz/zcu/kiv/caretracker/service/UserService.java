package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    /**
     * Vytvoří User účet pro zaměstnance s aktivačním tokenem.
     * Účet bude neaktivní dokud zaměstnanec nedokončí aktivaci.
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

        return userRepository.save(user);
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
}
