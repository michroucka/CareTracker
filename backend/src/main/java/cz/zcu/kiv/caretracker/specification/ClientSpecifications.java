package cz.zcu.kiv.caretracker.specification;

import cz.zcu.kiv.caretracker.entity.Client;
import org.springframework.data.jpa.domain.Specification;
import java.util.List;

/**
 * JPA Specifications for dynamic filtering of {@link Client} entities.
 * Combines individual filter methods via AND for flexible query composition.
 */
public class ClientSpecifications extends BaseSpecifications<Client> {

    /**
     * Filters clients by organization ID.
     *
     * @param organizationId the organization ID; {@code null} means no filter
     * @return the specification
     */
    public static Specification<Client> hasOrganization(Long organizationId) {
        return filterByOrganization("organization", organizationId);
    }

    /**
     * Filters clients by active/inactive status.
     *
     * @param active the desired status; {@code null} means no filter
     * @return the specification
     */
    public static Specification<Client> hasStatus(Boolean active) {
        return filterByStatus("active", active);
    }

    /**
     * Filters clients by department IDs.
     *
     * @param departmentIds the department IDs; {@code null} or empty means no filter
     * @return the specification
     */
    public static Specification<Client> hasDepartments(List<Long> departmentIds) {
        return filterByDepartments("department", departmentIds);
    }

    /**
     * Filters clients by caregiver IDs.
     *
     * @param caregiverIds the caregiver IDs; {@code null} or empty means no filter
     * @return the specification
     */
    public static Specification<Client> hasCaregivers(List<Long> caregiverIds) {
        return filterByCaregivers("caregiver", caregiverIds);
    }

    /**
     * Combines all individual filters into a single AND-composed specification.
     *
     * @param organizationId optional organization filter
     * @param active optional status filter
     * @param departmentIds optional department filter
     * @param caregiverIds optional caregiver filter
     * @return the combined specification
     */
    public static Specification<Client> withFilters(
            Long organizationId,
            Boolean active,
            List<Long> departmentIds,
            List<Long> caregiverIds
    ) {
        return hasOrganization(organizationId)
                .and(hasStatus(active))
                .and(hasDepartments(departmentIds))
                .and(hasCaregivers(caregiverIds));
    }
}
