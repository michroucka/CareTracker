package cz.zcu.kiv.caretracker.mapper;

import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanContentDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanContentRequestDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanVersionSummaryDTO;
import cz.zcu.kiv.caretracker.entity.IndividualPlan;
import cz.zcu.kiv.caretracker.entity.IndividualPlanContent;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class IndividualPlanContentMapper {

    public IndividualPlanContentDTO toDTO(IndividualPlanContent content) {
        if (content == null) {
            return null;
        }

        IndividualPlanContentDTO dto = new IndividualPlanContentDTO();
        dto.setId(content.getId());
        dto.setVersionNumber(content.getVersionNumber());
        dto.setProcessedDate(content.getProcessedDate());
        dto.setPlannedUpdateDate(content.getPlannedUpdateDate());

        // Osobní údaje
        dto.setLikes(content.getLikes());
        dto.setDislikes(content.getDislikes());
        dto.setStrengths(content.getStrengths());
        dto.setAspirations(content.getAspirations());
        dto.setLifePath(content.getLifePath());
        dto.setAdditionalInfo(content.getAdditionalInfo());

        // Oblasti péče
        dto.setHygiene(content.getHygiene());
        dto.setSelfCare(content.getSelfCare());
        dto.setMobility(content.getMobility());
        dto.setDiet(content.getDiet());
        dto.setHomeCare(content.getHomeCare());
        dto.setSocialContact(content.getSocialContact());
        dto.setActivities(content.getActivities());
        dto.setHealth(content.getHealth());
        dto.setExercisingRights(content.getExercisingRights());

        return dto;
    }

    public void requestToContent(
            IndividualPlanContent content,
            IndividualPlanContentRequestDTO dto,
            IndividualPlan individualPlan
    ) {
        content.setIndividualPlan(individualPlan);
        content.setProcessedDate(dto.getProcessedDate());
        content.setPlannedUpdateDate(dto.getPlannedUpdateDate());

        // Osobní údaje
        content.setLikes(dto.getLikes());
        content.setDislikes(dto.getDislikes());
        content.setStrengths(dto.getStrengths());
        content.setAspirations(dto.getAspirations());
        content.setLifePath(dto.getLifePath());
        content.setAdditionalInfo(dto.getAdditionalInfo());

        // Oblasti péče
        content.setHygiene(dto.getHygiene());
        content.setSelfCare(dto.getSelfCare());
        content.setMobility(dto.getMobility());
        content.setDiet(dto.getDiet());
        content.setHomeCare(dto.getHomeCare());
        content.setSocialContact(dto.getSocialContact());
        content.setActivities(dto.getActivities());
        content.setHealth(dto.getHealth());
        content.setExercisingRights(dto.getExercisingRights());
    }

    public List<IndividualPlanContentDTO> toDTOList(List<IndividualPlanContent> contents) {
        if (contents == null) {
            return null;
        }

        return contents.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Převede IndividualPlanContent na lightweight summary DTO (bez velkého textového contentu).
     * Použij pro seznam verzí.
     */
    public IndividualPlanVersionSummaryDTO toVersionSummary(IndividualPlanContent content) {
        if (content == null) {
            return null;
        }

        IndividualPlanVersionSummaryDTO dto = new IndividualPlanVersionSummaryDTO();
        dto.setId(content.getId());
        dto.setVersionNumber(content.getVersionNumber());
        dto.setProcessedDate(content.getProcessedDate());

        return dto;
    }

    public List<IndividualPlanVersionSummaryDTO> toVersionSummaryList(List<IndividualPlanContent> contents) {
        if (contents == null) {
            return null;
        }

        return contents.stream()
                .map(this::toVersionSummary)
                .collect(Collectors.toList());
    }
}
