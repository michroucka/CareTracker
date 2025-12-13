package cz.zcu.kiv.caretracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import cz.zcu.kiv.caretracker.enums.UnitType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

@Getter
@Setter
@Entity
@Table(name = "task")
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_name", nullable = false)
    private String taskName;

    @Column(name = "unit_price", nullable = false)
    private Integer unitPrice;

    @Enumerated
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false)
    private UnitType unitType;

    @Column(name = "double_meeting", nullable = false)
    private Boolean doubleMeeting = Boolean.FALSE;

    @ManyToOne
    @JoinColumn(name = "organization_id", nullable = false)
    @JsonIgnore
    private Organization organization;
}
