package cz.zcu.kiv.caretracker.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.util.List;

@Entity
public class Client {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "date_of_birth", nullable = false)
    private String dateOfBirth;

    private String email;
    private String phone;
    private String address;
    private String city;

    @Column(nullable = false)
    private boolean active = true;

    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne
    @JoinColumn(name = "caregiver_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Employee caregiver;

    @ManyToMany
    @JoinTable(
            name = "client_task",
            joinColumns = @JoinColumn(name = "client_id"),
            inverseJoinColumns = @JoinColumn(name = "task_id")
    )
    @OnDelete(action = OnDeleteAction.CASCADE)
    private List<Task> tasks;
}
