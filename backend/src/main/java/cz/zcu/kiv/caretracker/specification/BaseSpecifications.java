package cz.zcu.kiv.caretracker.specification;

import org.springframework.data.jpa.domain.Specification;

import java.util.List;

/**
 * Abstraktní base třída poskytující generické protected metody pro JPA Specifications.
 * Konkrétní specification třídy dědí z této třídy a vystavují pouze ty metody,
 * které pro danou entitu dávají smysl.
 *
 * @param <T> Typ entity
 */
public abstract class BaseSpecifications<T> {

    /**
     * Vytvoří specification pro filtrování podle organizace.
     *
     * @param fieldName Název pole odkazujícího na organizaci (např. "organization")
     * @param organizationId ID organizace (může být null - pak nefiltruje)
     * @return Specification pro filtrování podle organizace
     */
    protected static <T> Specification<T> filterByOrganization(String fieldName, Long organizationId) {
        return (root, query, criteriaBuilder) -> {
            if (organizationId == null) {
                return criteriaBuilder.conjunction(); // Vždy pravda (nefiltruje)
            }
            return criteriaBuilder.equal(root.get(fieldName).get("id"), organizationId);
        };
    }

    /**
     * Vytvoří specification pro filtrování podle jednoho oddělení.
     *
     * @param fieldName Název pole odkazujícího na department (např. "department")
     * @param departmentId ID oddělení (může být null - pak nefiltruje)
     * @return Specification pro filtrování podle oddělení
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
     * Vytvoří specification pro filtrování podle seznamu oddělení.
     *
     * @param fieldName Název pole odkazujícího na department (např. "department")
     * @param departmentIds Seznam ID oddělení (může být null nebo prázdný - pak nefiltruje)
     * @return Specification pro filtrování podle oddělení
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
     * Vytvoří specification pro filtrování podle statusu (aktivní/neaktivní).
     *
     * @param fieldName Název pole obsahujícího status (např. "active")
     * @param active Status (může být null - pak nefiltruje)
     * @return Specification pro filtrování podle statusu
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
     * Vytvoří specification pro filtrování podle jednoho caregiver.
     *
     * @param fieldName Název pole odkazujícího na caregiver (např. "caregiver")
     * @param caregiverId ID caregiver (může být null - pak nefiltruje)
     * @return Specification pro filtrování podle caregiver
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
     * Vytvoří specification pro filtrování podle seznamu caregiverů.
     *
     * @param fieldName Název pole odkazujícího na caregiver (např. "caregiver")
     * @param caregiverIds Seznam ID caregiverů (může být null nebo prázdný - pak nefiltruje)
     * @return Specification pro filtrování podle caregiverů
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
     * Vytvoří specification pro filtrování podle jednoho klienta.
     *
     * @param fieldName Název pole odkazujícího na klienta (např. "client")
     * @param clientId ID klienta (může být null - pak nefiltruje)
     * @return Specification pro filtrování podle klienta
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
     * Vytvoří specification pro filtrování podle seznamu klientů.
     *
     * @param fieldName Název pole odkazujícího na klienta (např. "client")
     * @param clientIds Seznam ID klientů (může být null nebo prázdný - pak nefiltruje)
     * @return Specification pro filtrování podle klientů
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
