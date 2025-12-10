package cz.zcu.kiv.caretracker.entity;

import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcType;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "employee")
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Enumerated
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false)
    private EmployeeRole role;

    @Column(nullable = false)
    private Boolean active = Boolean.TRUE;

    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToMany(mappedBy = "caregivers")
    private List<PerformedTask> performed_tasks;
}
