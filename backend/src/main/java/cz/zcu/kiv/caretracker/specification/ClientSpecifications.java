package cz.zcu.kiv.caretracker.specification;

import cz.zcu.kiv.caretracker.entity.Client;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Třída poskytující JPA Specifications pro dynamické filtrování Client entit.
 * Používá se pro sestavení flexibilních dotazů s různými kombinacemi filtrů.
 */
public class ClientSpecifications {

    /**
     * Vytvoří specification pro filtrování podle organizace.
     *
     * @param organizationId ID organizace (může být null - pak nefiltruje)
     * @return Specification pro filtrování podle organizace
     */
    public static Specification<Client> hasOrganization(Long organizationId) {
        return (root, query, criteriaBuilder) -> {
            if (organizationId == null) {
                return criteriaBuilder.conjunction(); // Vždy pravda (nefiltruje)
            }
            return criteriaBuilder.equal(root.get("organization").get("id"), organizationId);
        };
    }

    /**
     * Vytvoří specification pro filtrování podle statusu (aktivní/neaktivní).
     *
     * @param active Status klienta (může být null - pak nefiltruje)
     * @return Specification pro filtrování podle statusu
     */
    public static Specification<Client> hasStatus(Boolean active) {
        return (root, query, criteriaBuilder) -> {
            if (active == null) {
                return criteriaBuilder.conjunction(); // Vždy pravda (nefiltruje)
            }
            return criteriaBuilder.equal(root.get("active"), active);
        };
    }

    /**
     * Vytvoří specification pro filtrování podle seznamu oddělení.
     *
     * @param departmentIds Seznam ID oddělení (může být null nebo prázdný - pak nefiltruje)
     * @return Specification pro filtrování podle oddělení
     */
    public static Specification<Client> hasDepartments(List<Long> departmentIds) {
        return (root, query, criteriaBuilder) -> {
            if (departmentIds == null || departmentIds.isEmpty()) {
                return criteriaBuilder.conjunction(); // Vždy pravda (nefiltruje)
            }
            return root.get("department").get("id").in(departmentIds);
        };
    }

    /**
     * Vytvoří specification pro filtrování podle seznamu caregiverů.
     *
     * @param caregiverIds Seznam ID caregiverů (může být null nebo prázdný - pak nefiltruje)
     * @return Specification pro filtrování podle caregiverů
     */
    public static Specification<Client> hasCaregivers(List<Long> caregiverIds) {
        return (root, query, criteriaBuilder) -> {
            if (caregiverIds == null || caregiverIds.isEmpty()) {
                return criteriaBuilder.conjunction(); // Vždy pravda (nefiltruje)
            }
            return root.get("caregiver").get("id").in(caregiverIds);
        };
    }

    /**
     * Kombinuje všechny filtry do jedné specification pomocí AND.
     * Umožňuje jednoduché přidávání nových filtrů v budoucnu.
     *
     * @param organizationId ID organizace (může být null)
     * @param active Status klienta (může být null)
     * @param departmentIds Seznam ID oddělení (může být null nebo prázdný)
     * @param caregiverIds Seznam ID caregiverů (může být null nebo prázdný)
     * @return Kombinovaná specification se všemi filtry
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
