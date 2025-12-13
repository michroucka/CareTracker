package cz.zcu.kiv.caretracker.dto;

import cz.zcu.kiv.caretracker.enums.UnitType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskDTO {
    private Long id;
    private String taskName;
    private Integer unitPrice;
    private String unitType;
    private Boolean doubleMeeting;
}
