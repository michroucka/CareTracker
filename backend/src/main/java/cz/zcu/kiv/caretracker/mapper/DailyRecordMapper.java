package cz.zcu.kiv.caretracker.mapper;

import cz.zcu.kiv.caretracker.dto.individualPlan.DailyRecordDTO;
import cz.zcu.kiv.caretracker.entity.DailyRecord;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class DailyRecordMapper {

    public DailyRecordDTO toDTO(DailyRecord dailyRecord) {
        if (dailyRecord == null) {
            return null;
        }

        DailyRecordDTO dto = new DailyRecordDTO();
        dto.setId(dailyRecord.getId());
        dto.setDate(dailyRecord.getDate());
        dto.setContent(dailyRecord.getContent());

        return dto;
    }

    public void toDailyRecord(DailyRecord dr, DailyRecordDTO dto) {
        dr.setDate(dto.getDate());
        dr.setContent(dto.getContent());
    }

    public List<DailyRecordDTO> toDTOList(List<DailyRecord> dailyRecords) {
        if (dailyRecords == null) {
            return null;
        }

        return dailyRecords.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}
