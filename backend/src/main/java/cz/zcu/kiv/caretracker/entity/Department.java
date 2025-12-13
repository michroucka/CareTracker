package cz.zcu.kiv.caretracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "department")
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
    @JsonIgnore
    private List<Employee> employees;

    @OneToOne
    @JoinColumn(name = "coordinator_id")
    @JsonIgnore
    private Employee coordinator;

    @ManyToOne(optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    @JsonIgnore
    private Organization organization;
}
