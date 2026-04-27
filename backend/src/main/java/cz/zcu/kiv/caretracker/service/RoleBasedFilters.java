package cz.zcu.kiv.caretracker.service;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

/**
 * Value object holding the organization and department filter IDs computed from the current user's role.
 * Passed to JPA Specifications or repository queries by service methods.
 */
@Getter
@Setter
public class RoleBasedFilters {
    /** Organization ID to filter by, or {@code null} for no organization filter. */
    private Long organizationId;

    /** Department IDs to filter by, or {@code null}/empty for no department filter. */
    private List<Long> departmentIds;

    /**
     * When {@code true}, the user has no access to any data for the requested filters.
     * Services should return an empty list immediately without issuing a database query.
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
     * Factory method for the no-access sentinel.
     * Use when the user requests data outside their allowed scope (e.g. a COORDINATOR requesting a
     * different department's data). Services should return an empty list without querying the database.
     */
    public static RoleBasedFilters noAccess() {
        return new RoleBasedFilters(null, null, true);
    }
}
