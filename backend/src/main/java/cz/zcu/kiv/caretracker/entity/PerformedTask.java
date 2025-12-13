package cz.zcu.kiv.caretracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
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
    @JoinColumn(name = "department_id", nullable = false)
    @OnDelete(action = OnDeleteAction.RESTRICT)
    @JsonIgnore
    private Department department;

    @ManyToOne(optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    @OnDelete(action = OnDeleteAction.RESTRICT)
    @JsonIgnore
    private Organization organization;

    @Column(nullable = false)
    private LocalDateTime date;

    @Column(name="unit_count", nullable = false)
    private Integer unitCount;

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
