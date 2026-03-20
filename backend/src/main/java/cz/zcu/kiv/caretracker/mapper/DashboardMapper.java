package cz.zcu.kiv.caretracker.mapper;

import cz.zcu.kiv.caretracker.dto.dashboard.ClientIPUpdateDTO;
import cz.zcu.kiv.caretracker.entity.IndividualPlan;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class DashboardMapper {

    public ClientIPUpdateDTO toClientIPUpdateDTO(IndividualPlan ip) {
        return new ClientIPUpdateDTO(
                ip.getClient().getId(),
                ip.getClient().getFullName(),
                ip.getCurrentContent().getPlannedUpdateDate()
        );
    }

    public List<ClientIPUpdateDTO> toClientIPUpdateDTOList(List<IndividualPlan> plans) {
        return plans.stream().map(this::toClientIPUpdateDTO).collect(Collectors.toList());
    }
}
