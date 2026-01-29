package cz.zcu.kiv.caretracker.dto.organization;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationSummaryDTO {
    private Long id;
    private String name;
}
