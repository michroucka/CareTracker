package cz.zcu.kiv.caretracker.specification;

import org.springframework.data.jpa.domain.Specification;
import java.util.List;

/**
 * Abstract base class providing generic JPA Specification factory methods shared by all domain-specific
 * specification classes. Each concrete class exposes only the methods relevant to its entity type.
 *
 * @param <T> entity type
 */
public abstract class BaseSpecifications<T> {

    /**
     * Creates a specification that filters by organization ID.
     *
     * @param fieldName the entity field referencing the organization (e.g. {@code "organization"})
     * @param organizationId the organization ID; {@code null} means no filter (always true)
     * @return the specification
     */
    protected static <T> Specification<T> filterByOrganization(String fieldName, Long organizationId) {
        return (root, query, criteriaBuilder) -> {
            if (organizationId == null) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(root.get(fieldName).get("id"), organizationId);
        };
    }

    /**
     * Creates a specification that filters by a single department ID.
     *
     * @param fieldName the entity field referencing the department (e.g. {@code "department"})
     * @param departmentId the department ID; {@code null} means no filter
     * @return the specification
     */
    protected static <T> Specification<T> filterByDepartment(String fieldName, Long departmentId) {
        return (root, query, criteriaBuilder) -> {
            if (departmentId == null) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(root.get(fieldName).get("id"), departmentId);
        };
    }

    /**
     * Creates a specification that filters by a list of department IDs (IN clause).
     *
     * @param fieldName the entity field referencing the department
     * @param departmentIds the department IDs; {@code null} or empty means no filter
     * @return the specification
     */
    protected static <T> Specification<T> filterByDepartments(String fieldName, List<Long> departmentIds) {
        return (root, query, criteriaBuilder) -> {
            if (departmentIds == null || departmentIds.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            return root.get(fieldName).get("id").in(departmentIds);
        };
    }

    /**
     * Creates a specification that filters by active/inactive status.
     *
     * @param fieldName the boolean field name (e.g. {@code "active"})
     * @param active the desired value; {@code null} means no filter
     * @return the specification
     */
    protected static <T> Specification<T> filterByStatus(String fieldName, Boolean active) {
        return (root, query, criteriaBuilder) -> {
            if (active == null) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(root.get(fieldName), active);
        };
    }

    /**
     * Creates a specification that filters by a single caregiver ID.
     *
     * @param fieldName the entity field referencing the caregiver
     * @param caregiverId the caregiver ID; {@code null} means no filter
     * @return the specification
     */
    protected static <T> Specification<T> filterByCaregiver(String fieldName, Long caregiverId) {
        return (root, query, criteriaBuilder) -> {
            if (caregiverId == null) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(root.get(fieldName).get("id"), caregiverId);
        };
    }

    /**
     * Creates a specification that filters by a list of caregiver IDs (IN clause).
     *
     * @param fieldName the entity field referencing the caregiver
     * @param caregiverIds the caregiver IDs; {@code null} or empty means no filter
     * @return the specification
     */
    protected static <T> Specification<T> filterByCaregivers(String fieldName, List<Long> caregiverIds) {
        return (root, query, criteriaBuilder) -> {
            if (caregiverIds == null || caregiverIds.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            return root.get(fieldName).get("id").in(caregiverIds);
        };
    }

    /**
     * Creates a specification that filters by a single client ID.
     *
     * @param fieldName the entity field referencing the client
     * @param clientId the client ID; {@code null} means no filter
     * @return the specification
     */
    protected static <T> Specification<T> filterByClient(String fieldName, Long clientId) {
        return (root, query, criteriaBuilder) -> {
            if (clientId == null) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(root.get(fieldName).get("id"), clientId);
        };
    }

    /**
     * Creates a specification that filters by a list of client IDs (IN clause).
     *
     * @param fieldName the entity field referencing the client
     * @param clientIds the client IDs; {@code null} or empty means no filter
     * @return the specification
     */
    protected static <T> Specification<T> filterByClients(String fieldName, List<Long> clientIds) {
        return (root, query, criteriaBuilder) -> {
            if (clientIds == null || clientIds.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            return root.get(fieldName).get("id").in(clientIds);
        };
    }
}
