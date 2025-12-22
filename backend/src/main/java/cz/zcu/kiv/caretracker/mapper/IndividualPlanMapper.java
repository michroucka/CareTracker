package cz.zcu.kiv.caretracker.mapper;

import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanDTO;
import cz.zcu.kiv.caretracker.entity.IndividualPlan;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class IndividualPlanMapper {

    @Autowired
    private IndividualPlanContentMapper contentMapper;

    @Autowired
    private DailyRecordMapper dailyRecordMapper;

    public IndividualPlanDTO toDTO(IndividualPlan plan) {
        if (plan == null) {
            return null;
        }

        IndividualPlanDTO dto = new IndividualPlanDTO();
        dto.setId(plan.getId());

        // Client info
        if (plan.getClient() != null) {
            dto.setClientId(plan.getClient().getId());
            dto.setClientName(plan.getClient().getFirstName() + " " + plan.getClient().getLastName());
        }

        // Current content
        dto.setCurrentContent(contentMapper.toDTO(plan.getCurrentContent()));

        // Daily records (global for all versions)
        dto.setDailyRecords(dailyRecordMapper.toDTOList(plan.getDailyRecords()));

        return dto;
    }

    public List<IndividualPlanDTO> toDTOList(List<IndividualPlan> plans) {
        if (plans == null) {
            return null;
        }

        return plans.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}
