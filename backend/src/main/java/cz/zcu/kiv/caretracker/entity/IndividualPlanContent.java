package cz.zcu.kiv.caretracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "individual_plan_content",
       uniqueConstraints = @UniqueConstraint(
           name = "unique_version_per_plan",
           columnNames = {"individual_plan_id", "version_number"}
       ))
public class IndividualPlanContent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "individual_plan_id", nullable = false)
    @JsonIgnore
    private IndividualPlan individualPlan;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(name = "processed_date", nullable = false)
    private LocalDate processedDate;

    @Column(name = "planned_update_date", nullable = false)
    private LocalDate plannedUpdateDate;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String likes;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String dislikes;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String strengths;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String aspirations;

    @Lob
    @Column(name = "life_path", columnDefinition = "TEXT")
    private String lifePath;

    @Lob
    @Column(name = "additional_info", columnDefinition = "TEXT")
    private String additionalInfo;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String hygiene;

    @Lob
    @Column(name = "self_care", columnDefinition = "TEXT")
    private String selfCare;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String mobility;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String diet;

    @Lob
    @Column(name = "home_care", columnDefinition = "TEXT")
    private String homeCare;

    @Lob
    @Column(name = "social_contact", columnDefinition = "TEXT")
    private String socialContact;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String activities;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String health;

    @Lob
    @Column(name = "exercising_rights", columnDefinition = "TEXT")
    private String exercisingRights;

    @ManyToMany
    @JoinTable(
        name = "individual_plan_content_daily_record",
        joinColumns = @JoinColumn(name = "individual_plan_content_id"),
        inverseJoinColumns = @JoinColumn(name = "daily_record_id")
    )
    private List<DailyRecord> dailyRecords;
}
