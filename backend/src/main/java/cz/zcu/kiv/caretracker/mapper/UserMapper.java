package cz.zcu.kiv.caretracker.mapper;

import cz.zcu.kiv.caretracker.dto.user.UserDTO;
import cz.zcu.kiv.caretracker.dto.user.UserRequestDTO;
import cz.zcu.kiv.caretracker.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    public UserDTO toDTO(User user) {
        if (user == null) {
            return null;
        }

        UserDTO dto = new UserDTO();

        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole().name());

        String fullName = null;
        if (user.getEmployee() != null) {
            fullName = user.getEmployee().getFullName();
        } else if (user.getClient() != null) {
            fullName = user.getClient().getFullName();
        }
        dto.setFullName(fullName);

        return dto;
    }

    public void requestToUser(User user, UserRequestDTO dto) {
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
    }
}
