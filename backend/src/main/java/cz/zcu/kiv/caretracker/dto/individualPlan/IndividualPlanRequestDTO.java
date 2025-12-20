package cz.zcu.kiv.caretracker.dto.individualPlan;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IndividualPlanRequestDTO {
    private Long clientId;
    private IndividualPlanContentRequestDTO initialContent;
}
