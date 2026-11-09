package cz.zcu.kiv.caretracker.dto.picture;

import cz.zcu.kiv.caretracker.entity.Picture;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Uploaded picture; {@code id} goes into picture URLs as a cache version. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PictureDTO {
    private Long id;
    private LocalDateTime uploadedAt;
    private Long size;

    public static PictureDTO of(Picture picture) {
        return new PictureDTO(picture.getId(), picture.getUploadedAt(), picture.getSize());
    }
}
