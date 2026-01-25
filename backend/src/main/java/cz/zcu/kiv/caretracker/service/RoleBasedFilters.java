package cz.zcu.kiv.caretracker.service;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * DTO pro držení filtrů vypočítaných podle role uživatele.
 * Používá se pro předání filtrů do Specifications nebo repository queries.
 */
@Getter
@Setter
public class RoleBasedFilters {
    /**
     * ID organizace pro filtrování (null = žádný filtr)
     */
    private Long organizationId;

    /**
     * Seznam ID oddělení pro filtrování (null nebo empty = žádný filtr)
     */
    private List<Long> departmentIds;

    /**
     * Indikuje, zda uživatel nemá přístup k žádným datům.
     * Pokud je true, service by měla vrátit prázdný seznam bez dotazu do DB.
     */
    private boolean noAccess;

    public RoleBasedFilters(Long organizationId, List<Long> departmentIds) {
        this.organizationId = organizationId;
        this.departmentIds = departmentIds;
        this.noAccess = false;
    }

    public RoleBasedFilters(Long organizationId, List<Long> departmentIds, boolean noAccess) {
        this.organizationId = organizationId;
        this.departmentIds = departmentIds;
        this.noAccess = noAccess;
    }

    /**
     * Factory metoda pro vytvoření instance s noAccess = true.
     * Použij když uživatel požaduje data, ke kterým nemá přístup.
     */
    public static RoleBasedFilters noAccess() {
        return new RoleBasedFilters(null, null, true);
    }
}
