package cz.zcu.kiv.caretracker.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;

@Entity
@Table(name = "performed_task")
public class PerformedTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    @OnDelete(action = OnDeleteAction.RESTRICT)
    private Client client;

    @ManyToOne(optional = false)
    @JoinColumn(name = "task_id", nullable = false)
    @OnDelete(action = OnDeleteAction.RESTRICT)
    private Task task;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private int minutes;
}
