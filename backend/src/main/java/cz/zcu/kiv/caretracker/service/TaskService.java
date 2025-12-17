package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.TaskDTO;
import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Task;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.mapper.TaskMapper;
import cz.zcu.kiv.caretracker.repository.TaskRepository;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import cz.zcu.kiv.caretracker.security.MyUserDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TaskService {
    @Autowired
    UserRepository userRepository;
    @Autowired
    TaskRepository taskRepository;
    @Autowired
    TaskMapper taskMapper;

    @Transactional(readOnly = true)
    public List<TaskDTO> getAllTasks() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new SecurityException("User is not authenticated");
        }

        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<Task> tasks;
        UserRole role = user.getRole();

        // SUPERADMIN má přístup ke všemu
        if (role == UserRole.SUPERADMIN) {
            tasks = taskRepository.findAll();
        }
        // Zaměstnanci - filtrování podle organizace
        else if (user.getEmployee() != null) {
            // ADMIN, COORDINATOR a CAREGIVER vidí ukony celé organizace
            if (role == UserRole.ADMIN || role == UserRole.COORDINATOR || role == UserRole.CAREGIVER) {
                if (user.getEmployee().getOrganization() == null) {
                    throw new SecurityException("Admin must have an associated organization");
                }
                Long organizationId = user.getEmployee().getOrganization().getId();
                tasks = taskRepository.findByOrganizationId(organizationId);
            }
            else {
                throw new SecurityException("Unauthorized employee role");
            }
        }
        // CLIENT role nemá přístup k seznamu klientů
        else {
            throw new SecurityException("User does not have permission to view clients");
        }

        return taskMapper.toDTOList(tasks);
    }
}
