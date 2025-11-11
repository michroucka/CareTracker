package cz.zcu.kiv.caretracker.entity;

import jakarta.persistence.*;
import java.util.List;

@Entity
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String street;

    @Column(nullable = false)
    private String city;

    @Column(name = "postal_code", nullable = false, length = 10)
    private String postalCode;

    @OneToMany(mappedBy = "department")
    private List<Employee> employees;

    @OneToOne(optional = false)
    @JoinColumn(name = "coordinator_id", nullable = false)
    private Employee coordinator;

    @ManyToOne(optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;
}
