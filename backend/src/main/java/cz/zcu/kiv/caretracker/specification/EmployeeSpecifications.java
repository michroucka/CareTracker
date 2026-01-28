package cz.zcu.kiv.caretracker.specification;

import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

/**
 * Třída poskytující JPA Specifications pro dynamické filtrování Employee entit.
 * Dědí z BaseSpecifications pro sdílení společné logiky.
 */
public class EmployeeSpecifications extends BaseSpecifications<Employee> {

    /**
     * Vytvoří specification pro filtrování podle organizace.
     *
     * @param organizationId ID organizace (může být null - pak nefiltruje)
     * @return Specification pro filtrování podle organizace
     */
    public static Specification<Employee> hasOrganization(Long organizationId) {
        return filterByOrganization("organization", organizationId);
    }

    /**
     * Vytvoří specification pro filtrování podle seznamu oddělení.
     *
     * @param departmentIds Seznam ID oddělení (může být null nebo prázdný - pak nefiltruje)
     * @return Specification pro filtrování podle oddělení
     */
    public static Specification<Employee> hasDepartments(List<Long> departmentIds) {
        return filterByDepartments("department", departmentIds);
    }

    /**
     * Vytvoří specification pro filtrování podle statusu (aktivní/neaktivní).
     *
     * @param active Status zaměstnance (může být null - pak nefiltruje)
     * @return Specification pro filtrování podle statusu
     */
    public static Specification<Employee> hasStatus(Boolean active) {
        return filterByStatus("active", active);
    }

    /**
     * Vytvoří specification pro filtrování podle role zaměstnance.
     *
     * @param role Role zaměstnance (může být null - pak nefiltruje)
     * @return Specification pro filtrování podle role
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
     * Kombinuje všechny filtry do jedné specification pomocí AND.
     *
     * @param organizationId ID organizace (může být null)
     * @param departmentIds Seznam ID oddělení (může být null nebo prázdný)
     * @param active Status zaměstnance (může být null)
     * @param role Role zaměstnance (může být null)
     * @return Kombinovaná specification se všemi filtry
     */
    public static Specification<Employee> withFilters(
            Long organizationId,
            List<Long> departmentIds,
            Boolean active,
            EmployeeRole role
    ) {
        return hasOrganization(organizationId)
                .and(hasDepartments(departmentIds))
                .and(hasStatus(active))
                .and(hasRole(role));
    }
}
