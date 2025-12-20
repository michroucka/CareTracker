package cz.zcu.kiv.caretracker.dto.individualPlan;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IndividualPlanContentDTO {
    private Long id;
    private Integer versionNumber;
    private LocalDate processedDate;
    private LocalDate plannedUpdateDate;

    // Osobní údaje
    private String likes;
    private String dislikes;
    private String strengths;
    private String aspirations;
    private String lifePath;
    private String additionalInfo;

    // Oblasti péče
    private String hygiene;
    private String selfCare;
    private String mobility;
    private String diet;
    private String homeCare;
    private String socialContact;
    private String activities;
    private String health;
    private String exercisingRights;

    // Metadata
    private Long createdById;
    private String createdByName;

    // Daily records
    private List<DailyRecordDTO> dailyRecords;
}
