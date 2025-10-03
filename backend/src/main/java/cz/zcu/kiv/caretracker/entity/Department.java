package cz.zcu.kiv.caretracker.entity;

import jakarta.persistence.*;
import java.util.List;

@Entity
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String address;

    @OneToMany(mappedBy = "department")
    private List<Employee> employees;

    @OneToOne
    @JoinColumn(name = "coordinator_id", unique = true)
    private Employee coordinator;

}
