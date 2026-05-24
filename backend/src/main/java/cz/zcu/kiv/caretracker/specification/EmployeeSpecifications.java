package cz.zcu.kiv.caretracker.specification;

import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import org.springframework.data.jpa.domain.Specification;
import java.util.List;

/**
 * JPA Specifications for dynamic filtering of {@link Employee} entities.
 */
public class EmployeeSpecifications extends BaseSpecifications<Employee> {

    /**
     * Filters employees by organization ID.
     *
     * @param organizationId the organization ID; {@code null} means no filter
     * @return the specification
     */
    public static Specification<Employee> hasOrganization(Long organizationId) {
        return filterByOrganization("organization", organizationId);
    }

    /**
     * Filters employees by department IDs.
     *
     * @param departmentIds the department IDs; {@code null} or empty means no filter
     * @return the specification
     */
    public static Specification<Employee> hasDepartments(List<Long> departmentIds) {
        return filterByDepartments("department", departmentIds);
    }

    /**
     * Filters employees by active/inactive status.
     *
     * @param active the desired status; {@code null} means no filter
     * @return the specification
     */
    public static Specification<Employee> hasStatus(Boolean active) {
        return filterByStatus("active", active);
    }

    /**
     * Filters employees by their role.
     *
     * @param role the employee role; {@code null} means no filter
     * @return the specification
     */
    public static Specification<Employee> hasRole(EmployeeRole role) {
        return (root, query, criteriaBuilder) -> {
            if (role == null) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(root.get("role"), role);
        };
    }

    /**
     * Combines all individual filters into a single AND-composed specification.
     *
     * @param organizationId optional organization filter
     * @param departmentIds optional department filter
     * @param active optional status filter
     * @return the combined specification
     */
    public static Specification<Employee> withFilters(
            Long organizationId,
            List<Long> departmentIds,
            Boolean active
    ) {
        return hasOrganization(organizationId)
                .and(hasDepartments(departmentIds))
                .and(hasStatus(active));
    }
}
