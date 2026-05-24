package cz.zcu.kiv.caretracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;


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

    @Column(columnDefinition = "TEXT")
    private String likes;

    @Column(columnDefinition = "TEXT")
    private String dislikes;

    @Column(columnDefinition = "TEXT")
    private String strengths;

    @Column(columnDefinition = "TEXT")
    private String aspirations;

    @Column(name = "life_path", columnDefinition = "TEXT")
    private String lifePath;

    @Column(name = "additional_info", columnDefinition = "TEXT")
    private String additionalInfo;

    @Column(columnDefinition = "TEXT")
    private String hygiene;

    @Column(name = "self_care", columnDefinition = "TEXT")
    private String selfCare;

    @Column(columnDefinition = "TEXT")
    private String mobility;

    @Column(columnDefinition = "TEXT")
    private String diet;

    @Column(name = "home_care", columnDefinition = "TEXT")
    private String homeCare;

    @Column(name = "social_contact", columnDefinition = "TEXT")
    private String socialContact;

    @Column(columnDefinition = "TEXT")
    private String activities;

    @Column(columnDefinition = "TEXT")
    private String health;

    @Column(name = "exercising_rights", columnDefinition = "TEXT")
    private String exercisingRights;
}
