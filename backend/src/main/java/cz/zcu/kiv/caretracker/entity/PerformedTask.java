package cz.zcu.kiv.caretracker.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "performed_task")
public class PerformedTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    @OnDelete(action = OnDeleteAction.RESTRICT)
    private Client client;

    @ManyToOne(optional = false)
    @JoinColumn(name = "task_id", nullable = false)
    @OnDelete(action = OnDeleteAction.RESTRICT)
    private Task task;

    @ManyToOne(optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    @OnDelete(action = OnDeleteAction.RESTRICT)
    private Organization organization;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private Integer unit_count;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToMany
    @JoinTable(
            name = "caregiver_performed_task",
            joinColumns = @JoinColumn(name = "performed_task_id"),
            inverseJoinColumns = @JoinColumn(name = "caregiver_id")
    )
    @OnDelete(action = OnDeleteAction.CASCADE)
    private List<Employee> caregivers;
}
