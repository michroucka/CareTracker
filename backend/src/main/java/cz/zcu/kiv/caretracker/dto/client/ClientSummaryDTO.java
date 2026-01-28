package cz.zcu.kiv.caretracker.dto.client;

import cz.zcu.kiv.caretracker.dto.task.TaskDTO;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@NoArgsConstructor
@Getter
@Setter
public class ClientSummaryDTO {
    private Long id;
    private String fullName;

    private List<TaskDTO> tasks;
}
