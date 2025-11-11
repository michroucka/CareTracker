package cz.zcu.kiv.caretracker.entity;

import jakarta.persistence.*;

@Entity
public class IndividualPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "client_id")
    private Client client;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String content;
}
