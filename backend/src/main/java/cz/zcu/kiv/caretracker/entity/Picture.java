package cz.zcu.kiv.caretracker.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import java.time.LocalDateTime;

@Entity
@Table(name = "picture")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Picture {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Client client;

    @Column(name = "data", columnDefinition = "bytea")
    private byte[] data;

    @Column(name = "content_type", length = 50)
    private String contentType;

    @Column(name = "filename")
    private String filename;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @Column(name = "size")
    private Long size;
}
