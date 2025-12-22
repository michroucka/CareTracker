package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.DailyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DailyRecordRepository extends JpaRepository<DailyRecord, Long> {
}
