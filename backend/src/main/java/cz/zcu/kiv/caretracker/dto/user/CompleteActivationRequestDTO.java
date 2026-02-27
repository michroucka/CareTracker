package cz.zcu.kiv.caretracker.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompleteActivationRequestDTO {
    private String token;
    private String username;
    private String password;
}
