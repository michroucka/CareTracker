package cz.zcu.kiv.caretracker.specification;

import cz.zcu.kiv.caretracker.entity.PerformedTask;
import org.springframework.data.jpa.domain.Specification;
import java.time.LocalDateTime;
import java.util.List;

/**
 * JPA Specifications for dynamic filtering of {@link PerformedTask} entities.
 */
public class PerformedTaskSpecifications extends BaseSpecifications<PerformedTask> {

    /**
     * Filters performed tasks by organization ID.
     *
     * @param organizationId the organization ID; {@code null} means no filter
     * @return the specification
     */
    public static Specification<PerformedTask> hasOrganization(Long organizationId) {
        return filterByOrganization("organization", organizationId);
    }

    /**
     * Filters performed tasks by department IDs.
     *
     * @param departmentIds the department IDs; {@code null} or empty means no filter
     * @return the specification
     */
    public static Specification<PerformedTask> hasDepartments(List<Long> departmentIds) {
        return filterByDepartments("department", departmentIds);
    }

    /**
     * Filters performed tasks by client ID.
     *
     * @param clientId the client ID; {@code null} means no filter
     * @return the specification
     */
    public static Specification<PerformedTask> hasClient(Long clientId) {
        return filterByClient("client", clientId);
    }

    /**
     * Filters performed tasks by caregiver IDs.
     * Uses a join on the ManyToMany {@code caregivers} collection, matching tasks that have
     * at least one caregiver from the supplied list.
     *
     * @param caregiverIds the caregiver IDs; {@code null} or empty means no filter
     * @return the specification
     */
    public static Specification<PerformedTask> hasCaregivers(List<Long> caregiverIds) {
        return (root, query, criteriaBuilder) -> {
            if (caregiverIds == null || caregiverIds.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            return root.join("caregivers").get("id").in(caregiverIds);
        };
    }

    /**
     * Filters performed tasks to those whose date falls within the given month and year.
     * If {@code month} is null or invalid (outside 1–12), no filter is applied.
     *
     * @param month the month (1–12); {@code null} means no filter
     * @param year the year (required when month is non-null)
     * @return the specification
     */
    public static Specification<PerformedTask> hasDateInMonth(Integer month, Integer year) {
        return (root, query, criteriaBuilder) -> {
            if (month == null || month < 1 || month > 12) {
                return criteriaBuilder.conjunction();
            }

            LocalDateTime startOfMonth = LocalDateTime.of(year, month, 1, 0,0);
            LocalDateTime endOfMonth = startOfMonth.plusMonths(1).minusNanos(1);

            return criteriaBuilder.between(root.get("date"), startOfMonth, endOfMonth);
        };
    }

    /**
     * Combines all individual filters into a single AND-composed specification.
     *
     * @param organizationId optional organization filter
     * @param departmentIds optional department filter
     * @param caregiverIds optional caregiver filter
     * @param clientId optional client filter
     * @param month optional month filter (1–12)
     * @param year required when month is non-null
     * @return the combined specification
     */
    public static Specification<PerformedTask> withFilters(
            Long organizationId,
            List<Long> departmentIds,
            List<Long> caregiverIds,
            Long clientId,
            Integer month,
            Integer year
    ) {
        return hasOrganization(organizationId)
                .and(hasDepartments(departmentIds))
                .and(hasCaregivers(caregiverIds))
                .and(hasClient(clientId))
                .and(hasDateInMonth(month, year));
    }
}
