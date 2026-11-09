package cz.zcu.kiv.caretracker.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Active client without a performed task in the last days; {@code lastRecordDate} is null if the client has no record at all.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ClientAttentionDTO {
    private Long clientId;
    private String clientName;
    private LocalDateTime lastRecordDate;
}
