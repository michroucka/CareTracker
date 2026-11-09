package cz.zcu.kiv.caretracker.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Profile picture of a client or an employee, stored as two JPEG sizes. Rows written before
 * the images were resized hold the original upload in {@code data} and no {@code thumbnail};
 * {@link cz.zcu.kiv.caretracker.service.PictureService} converts them on first access.
 */
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

    @Column(name = "data", columnDefinition = "bytea")
    private byte[] data;

    @Column(name = "thumbnail", columnDefinition = "bytea")
    private byte[] thumbnail;

    @Column(name = "content_type", length = 50)
    private String contentType;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @Column(name = "size")
    private Long size;
}
