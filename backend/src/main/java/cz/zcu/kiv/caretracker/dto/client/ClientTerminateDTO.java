package cz.zcu.kiv.caretracker.dto.client;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientTerminateDTO {
    private LocalDate terminationDate;
    private String terminationReason;
}
