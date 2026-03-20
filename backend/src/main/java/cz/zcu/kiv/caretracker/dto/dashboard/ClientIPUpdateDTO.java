package cz.zcu.kiv.caretracker.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ClientIPUpdateDTO {
    private Long clientId;
    private String clientName;
    private LocalDate plannedUpdateDate;
}
