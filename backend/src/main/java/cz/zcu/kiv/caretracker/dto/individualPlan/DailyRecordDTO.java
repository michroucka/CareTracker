package cz.zcu.kiv.caretracker.dto.individualPlan;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyRecordDTO {
    private Long id;
    private LocalDate date;
    private String content;
}
