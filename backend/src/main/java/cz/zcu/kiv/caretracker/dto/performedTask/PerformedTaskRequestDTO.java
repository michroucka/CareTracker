package cz.zcu.kiv.caretracker.dto.performedTask;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PerformedTaskRequestDTO {
    private LocalDateTime date;
    private Double unitCount;
    private String notes;
    private Long clientId;
    private Long taskId;
    private List<Long> caregiverIds;
}
