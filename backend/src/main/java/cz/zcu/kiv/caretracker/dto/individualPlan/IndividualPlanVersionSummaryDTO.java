package cz.zcu.kiv.caretracker.dto.individualPlan;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IndividualPlanVersionSummaryDTO {
    private Long id;
    private Integer versionNumber;
    private LocalDate processedDate;
    private LocalDate plannedUpdateDate;
}
