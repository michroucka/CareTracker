package cz.zcu.kiv.caretracker.entity;

import cz.zcu.kiv.caretracker.enums.BenefitLevel;
import cz.zcu.kiv.caretracker.enums.Gender;
import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "client")
public class Client {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Gender gender;

    @Column(name = "personal_number", nullable = false)
    private Integer personalNumber;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Column(name = "date_of_death")
    private LocalDate dateOfDeath;

    private String email;
    private String phone;

    @Column(nullable = false)
    private String street;

    @Column(nullable = false)
    private String city;

    @Column(name = "postal_code", nullable = false, length = 10)
    private String postalCode;

    @Column(name = "legally_competent", nullable = false)
    private Boolean legallyCompetent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BenefitLevel benefits;

    @Column(columnDefinition = "TEXT", name = "relatives_contact")
    private String relativesContact;

    @Column(columnDefinition = "TEXT", name = "general_practitioner")
    private String generalPractitioner;

    private String notes;
    private LocalDate created = LocalDate.now();

    @Column(nullable = false)
    private Boolean active = Boolean.TRUE;

    @ManyToOne(optional = false)
    @JoinColumn(name = "department_id", nullable = false)
    @OnDelete(action = OnDeleteAction.RESTRICT)
    private Department department;

    @ManyToOne
    @JoinColumn(name = "caregiver_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Employee caregiver;

    @ManyToMany
    @JoinTable(
            name = "client_task",
            joinColumns = @JoinColumn(name = "client_id"),
            inverseJoinColumns = @JoinColumn(name = "task_id")
    )
    @OnDelete(action = OnDeleteAction.CASCADE)
    private List<Task> tasks;
}
