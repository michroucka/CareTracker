package cz.zcu.kiv.caretracker.entity;

import jakarta.persistence.*;

@Entity
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String taskName;

    @Column(nullable = false)
    private int price;

    @Column(nullable = false)
    private boolean doubleMeeting = false;
}
