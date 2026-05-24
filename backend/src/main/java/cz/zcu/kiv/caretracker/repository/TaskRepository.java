package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByActiveTrueAndOrganizationId(Long organizationId);
    List<Task> findByActiveFalseAndOrganizationId(Long organizationId);
    List<Task> findByOrganizationId(Long organizationId);
}
