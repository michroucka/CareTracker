package cz.zcu.kiv.caretracker.dto.picture;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PictureDTO {
    private Long id;
    private String contentType;
    private String filename;
    private LocalDateTime uploadedAt;
    private Long size;
}
