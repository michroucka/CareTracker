package cz.zcu.kiv.caretracker.dto.task;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskRequestDTO {
    private String name;
    private Integer unitPrice;
    private String unitType;
    private Boolean doubleMeeting;
    private Long organizationId;
}
