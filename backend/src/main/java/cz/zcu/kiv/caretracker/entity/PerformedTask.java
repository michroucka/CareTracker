package cz.zcu.kiv.caretracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import cz.zcu.kiv.caretracker.enums.UnitType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "performed_task")
public class PerformedTask {
    private static final BigDecimal MINUTES_PER_HOUR = BigDecimal.valueOf(60);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    @OnDelete(action = OnDeleteAction.RESTRICT)
    private Client client;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    @OnDelete(action = OnDeleteAction.RESTRICT)
    private Task task;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    @OnDelete(action = OnDeleteAction.RESTRICT)
    @JsonIgnore
    private Department department;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    @OnDelete(action = OnDeleteAction.RESTRICT)
    @JsonIgnore
    private Organization organization;

    @Column(nullable = false)
    private LocalDateTime date;

    @Column(name="unit_count", nullable = false)
    private Double unitCount;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "caregiver_performed_task",
            joinColumns = @JoinColumn(name = "performed_task_id"),
            inverseJoinColumns = @JoinColumn(name = "caregiver_id")
    )
    private List<Employee> caregivers;

    public int calculatePrice() {
        // decimal arithmetic: in double 0.29 * 50 is 14.4999... and would round down; matches ROUND on NUMERIC in the dashboard queries
        BigDecimal amount = BigDecimal.valueOf(getUnitCount()).multiply(BigDecimal.valueOf(getTask().getUnitPrice()));
        BigDecimal price = getTask().getUnitType() == UnitType.HOUR
                ? amount.divide(MINUTES_PER_HOUR, 0, RoundingMode.HALF_UP)
                : amount.setScale(0, RoundingMode.HALF_UP);
        return price.intValueExact();
    }
}
