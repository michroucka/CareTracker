package cz.zcu.kiv.caretracker.entity;

import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import jakarta.persistence.*;

@Entity
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EmployeeRole role;

    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;
}
