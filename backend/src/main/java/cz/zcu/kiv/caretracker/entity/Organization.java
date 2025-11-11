package cz.zcu.kiv.caretracker.entity;

import jakarta.persistence.*;
import java.util.List;

@Entity
public class Organization {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Boolean active = Boolean.TRUE;

    @OneToOne(optional = false)
    @JoinColumn(name = "manager_id", nullable = false)
    private Employee manager;

    @OneToMany(mappedBy = "organization")
    private List<Department> departments;
}
