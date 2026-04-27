package cz.zcu.kiv.caretracker.dto.individualPlan;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IndividualPlanDTO {
    private Long id;
    private Long clientId;
    private String clientName;
    private IndividualPlanContentDTO currentContent;
    private List<DailyRecordDTO> dailyRecords;
}
