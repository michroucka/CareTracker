package cz.zcu.kiv.caretracker.specification;

import cz.zcu.kiv.caretracker.entity.PerformedTask;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

/**
 * Třída poskytující JPA Specifications pro dynamické filtrování PerformedTask entit.
 * Dědí z BaseSpecifications pro sdílení společné logiky.
 */
public class PerformedTaskSpecifications extends BaseSpecifications<PerformedTask> {

    /**
     * Vytvoří specification pro filtrování podle organizace.
     *
     * @param organizationId ID organizace (může být null - pak nefiltruje)
     * @return Specification pro filtrování podle organizace
     */
    public static Specification<PerformedTask> hasOrganization(Long organizationId) {
        return filterByOrganization("organization", organizationId);
    }

    /**
     * Vytvoří specification pro filtrování podle seznamu oddělení.
     *
     * @param departmentIds Seznam ID oddělení (může být null nebo prázdný - pak nefiltruje)
     * @return Specification pro filtrování podle oddělení
     */
    public static Specification<PerformedTask> hasDepartments(List<Long> departmentIds) {
        return filterByDepartments("department", departmentIds);
    }

    /**
     * Vytvoří specification pro filtrování podle klienta.
     *
     * @param clientId ID klienta (může být null - pak nefiltruje)
     * @return Specification pro filtrování podle klienta
     */
    public static Specification<PerformedTask> hasClient(Long clientId) {
        return filterByClient("client", clientId);
    }

    /**
     * Vytvoří specification pro filtrování podle seznamu caregiverů.
     * Používá ManyToMany vztah, takže hledá PerformedTask, které obsahují alespoň jednoho z caregiverů.
     *
     * @param caregiverIds Seznam ID caregiverů (může být null nebo prázdný - pak nefiltruje)
     * @return Specification pro filtrování podle caregiverů
     */
    public static Specification<PerformedTask> hasCaregivers(List<Long> caregiverIds) {
        return (root, query, criteriaBuilder) -> {
            if (caregiverIds == null || caregiverIds.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            // Pro ManyToMany musíme použít join
            return root.join("caregivers").get("id").in(caregiverIds);
        };
    }

    /**
     * Kombinuje všechny filtry do jedné specification pomocí AND.
     *
     * @param organizationId ID organizace (může být null)
     * @param departmentIds Seznam ID oddělení (může být null nebo prázdný)
     * @param caregiverIds Seznam ID caregiverů (může být null nebo prázdný)
     * @return Kombinovaná specification se všemi filtry
     */
    public static Specification<PerformedTask> withFilters(
            Long organizationId,
            List<Long> departmentIds,
            List<Long> caregiverIds
    ) {
        return hasOrganization(organizationId)
                .and(hasDepartments(departmentIds))
                .and(hasCaregivers(caregiverIds));
    }
}
