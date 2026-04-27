package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.exception.ValidationException;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.Supplier;

/**
 * Abstract service base class providing shared role-based data filtering logic.
 * Eliminates duplication across the service layer by centralizing permission checks
 * and role-aware query delegation.
 *
 * @param <T> entity type
 * @param <D> DTO type
 */
public abstract class BaseRoleFilteringService<T, D> {

    @Autowired
    protected UserRepository userRepository;

    /**
     * Returns the currently authenticated user.
     *
     * @return the authenticated user
     * @throws SecurityException if no authenticated user is present
     * @throws UsernameNotFoundException if the user is not found in the database
     */
    protected User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new SecurityException("Uživatel není přihlášen");
        }

        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new UsernameNotFoundException("Uživatel nebyl nalezen"));
    }

    /**
     * Validates that the current user has access to the given entity based on organization membership.
     * SUPERADMIN has unrestricted access; all other roles must belong to the same organization.
     *
     * @param entity the entity to validate access for
     * @param organizationIdGetter extracts the entity's organization ID
     * @throws SecurityException if the user does not have access
     */
    protected <E> void validateOrganizationAccess(E entity, Function<E, Long> organizationIdGetter) {
        if (entity == null) {
            throw new ValidationException("Entita nemůže být null");
        }

        Long entityOrgId = organizationIdGetter.apply(entity);
        if (entityOrgId == null) {
            throw new ValidationException("Entita musí mít přiřazenou organizaci");
        }

        validateOrganizationId(entityOrgId);
    }

    /**
     * Validates that the current user has access to the given organization.
     * SUPERADMIN has unrestricted access; all other roles must belong to the same organization.
     *
     * @param organizationId the organization ID to validate
     * @throws SecurityException if the user does not belong to this organization
     */
    protected void validateOrganizationId(Long organizationId) {
        if (organizationId == null) {
            throw new ValidationException("ID organizace nemůže být null");
        }

        User user = getCurrentUser();
        UserRole role = user.getRole();

        if (role == UserRole.SUPERADMIN) {
            return;
        }

        if (user.getEmployee() == null || user.getEmployee().getOrganization() == null) {
            throw new SecurityException("Zaměstnanec nemá přiřazenou organizaci");
        }

        Long userOrgId = user.getEmployee().getOrganization().getId();

        if (!userOrgId.equals(organizationId)) {
            throw new SecurityException("Přístup odepřen: entita patří do jiné organizace");
        }
    }

    /**
     * Validates that the current user has access to the given entity based on organization and department.
     * SUPERADMIN has unrestricted access; ADMIN must belong to the same organization;
     * COORDINATOR and CAREGIVER must belong to the same department.
     *
     * @param entity the entity to validate access for
     * @param organizationIdGetter extracts the entity's organization ID
     * @param departmentIdGetter extracts the entity's department ID
     * @throws SecurityException if the user does not have access
     */
    protected <E> void validateDepartmentAccess(
            E entity,
            Function<E, Long> organizationIdGetter,
            Function<E, Long> departmentIdGetter
    ) {
        if (entity == null) {
            throw new ValidationException("Entita nemůže být null");
        }

        Long entityOrgId = organizationIdGetter.apply(entity);
        Long entityDeptId = departmentIdGetter.apply(entity);

        if (entityOrgId == null) {
            throw new ValidationException("Entita musí mít přiřazenou organizaci");
        }

        validateDepartmentId(entityDeptId, entityOrgId);
    }

    /**
     * Validates that the current user has access to the given department.
     * SUPERADMIN has unrestricted access; ADMIN must belong to the same organization;
     * COORDINATOR and CAREGIVER must belong to the same department.
     *
     * @param departmentId the department ID to validate (may be null)
     * @param organizationId the organization the department belongs to
     * @throws SecurityException if the user does not have access
     */
    protected void validateDepartmentId(Long departmentId, Long organizationId) {
        if (organizationId == null) {
            throw new ValidationException("ID organizace nemůže být null");
        }

        User user = getCurrentUser();
        UserRole role = user.getRole();

        if (role == UserRole.SUPERADMIN) {
            return;
        }

        if (user.getEmployee() == null || user.getEmployee().getOrganization() == null) {
            throw new SecurityException("Zaměstnanec nemá přiřazenou organizaci");
        }

        Long userOrgId = user.getEmployee().getOrganization().getId();

        if (!userOrgId.equals(organizationId)) {
            throw new SecurityException("Přístup odepřen: entita patří do jiné organizace");
        }

        if (role == UserRole.ADMIN) {
            return;
        }

        if (role == UserRole.COORDINATOR || role == UserRole.CAREGIVER) {
            if (user.getEmployee().getDepartment() == null) {
                throw new SecurityException("Zaměstnanec nemá přiřazené oddělení");
            }

            Long userDeptId = user.getEmployee().getDepartment().getId();

            if (departmentId == null || !userDeptId.equals(departmentId)) {
                throw new SecurityException("Přístup odepřen: entita patří do jiného oddělení");
            }
        }
    }

    /**
     * Validates that the current user is allowed to mutate the given entity.
     * Uses the same department-level access logic as {@link #validateDepartmentAccess}.
     *
     * @param entity the entity to check write access for
     * @param organizationIdGetter extracts the entity's organization ID
     * @param departmentIdGetter extracts the entity's department ID
     * @throws SecurityException if the user does not have write access
     */
    protected <E> void validateUpdateAccess(
            E entity,
            Function<E, Long> organizationIdGetter,
            Function<E, Long> departmentIdGetter
    ) {
        validateDepartmentAccess(entity, organizationIdGetter, departmentIdGetter);
    }

    /**
     * Fetches and maps entities scoped to the current user's role, using organization-level isolation.
     * SUPERADMIN sees all entities; ADMIN, COORDINATOR, and CAREGIVER see only their organization.
     *
     * @param superAdminQuery supplies all entities (e.g. {@code repository::findAll})
     * @param organizationQuery fetches entities by organization ID
     * @param mapper converts the entity list to a DTO list
     * @return role-filtered list of DTOs
     * @throws SecurityException if the user lacks permission or has no assigned organization
     */
    protected List<D> filterEntitiesByRole(
            Supplier<List<T>> superAdminQuery,
            Function<Long, List<T>> organizationQuery,
            Function<List<T>, List<D>> mapper
    ) {
        User user = getCurrentUser();
        List<T> entities;
        UserRole role = user.getRole();

        if (role == UserRole.SUPERADMIN) {
            entities = superAdminQuery.get();
        } else if (user.getEmployee() != null) {
            if (role == UserRole.ADMIN || role == UserRole.COORDINATOR || role == UserRole.CAREGIVER) {
                if (user.getEmployee().getOrganization() == null) {
                    throw new SecurityException("Zaměstnanec nemá přiřazenou organizaci");
                }
                Long organizationId = user.getEmployee().getOrganization().getId();
                entities = organizationQuery.apply(organizationId);
            } else {
                throw new SecurityException("Nepovolená role zaměstnance");
            }
        } else {
            throw new SecurityException("Nemáte oprávnění zobrazit tato data");
        }

        return mapper.apply(entities);
    }

    /**
     * Fetches and maps entities scoped to the current user's role with department-level isolation.
     * SUPERADMIN sees all; ADMIN sees their organization; COORDINATOR and CAREGIVER see only their department.
     * Delegates to the five-parameter overload with {@code requestedOrganizationId = null}.
     *
     * @param superAdminQuery supplies all entities
     * @param organizationQuery fetches entities by organization ID
     * @param departmentQuery fetches entities by department ID
     * @param mapper converts the entity list to a DTO list
     * @return role-filtered list of DTOs
     * @throws SecurityException if the user lacks permission or has no assigned organization/department
     */
    protected List<D> filterEntitiesByRole(
            Supplier<List<T>> superAdminQuery,
            Function<Long, List<T>> organizationQuery,
            Function<Long, List<T>> departmentQuery,
            Function<List<T>, List<D>> mapper
    ) {
        return filterEntitiesByRole(superAdminQuery, organizationQuery, departmentQuery, mapper, null);
    }

    /**
     * Fetches and maps entities scoped to the current user's role, optionally filtered by organization.
     * SUPERADMIN may pass {@code requestedOrganizationId} to narrow results; ADMIN is always scoped to their
     * organization; COORDINATOR and CAREGIVER are always scoped to their department.
     *
     * @param superAdminQuery supplies all entities when no organization filter is applied
     * @param organizationQuery fetches entities by organization ID
     * @param departmentQuery fetches entities by department ID
     * @param mapper converts the entity list to a DTO list
     * @param requestedOrganizationId optional organization filter, honoured only for SUPERADMIN
     * @return role-filtered list of DTOs
     * @throws SecurityException if the user lacks permission or has no assigned organization/department
     */
    protected List<D> filterEntitiesByRole(
            Supplier<List<T>> superAdminQuery,
            Function<Long, List<T>> organizationQuery,
            Function<Long, List<T>> departmentQuery,
            Function<List<T>, List<D>> mapper,
            Long requestedOrganizationId
    ) {
        User user = getCurrentUser();
        List<T> entities;
        UserRole role = user.getRole();

        if (role == UserRole.SUPERADMIN) {
            entities = requestedOrganizationId != null
                    ? organizationQuery.apply(requestedOrganizationId)
                    : superAdminQuery.get();
        } else if (user.getEmployee() != null) {
            if (role == UserRole.ADMIN) {
                if (user.getEmployee().getOrganization() == null) {
                    throw new SecurityException("Administrátor nemá přiřazenou organizaci");
                }
                Long organizationId = user.getEmployee().getOrganization().getId();
                entities = organizationQuery.apply(organizationId);
            } else if (role == UserRole.COORDINATOR || role == UserRole.CAREGIVER) {
                if (user.getEmployee().getDepartment() == null) {
                    throw new SecurityException("Zaměstnanec nemá přiřazené oddělení");
                }
                Long departmentId = user.getEmployee().getDepartment().getId();
                entities = departmentQuery.apply(departmentId);
            } else {
                throw new SecurityException("Nepovolená role zaměstnance");
            }
        }
        else {
            throw new SecurityException("Nemáte oprávnění zobrazit tato data");
        }

        return mapper.apply(entities);
    }

    /**
     * Fetches a single entity by ID and applies organization-level permission check.
     * All employee roles (ADMIN, COORDINATOR, CAREGIVER) may access entities within their organization.
     *
     * @param id the entity ID (unused beyond acting as a type anchor)
     * @param entityFinder supplies the entity lookup (e.g. {@code () -> repository.findById(id)})
     * @param organizationIdGetter extracts the organization ID from the entity
     * @param mapper converts the entity to a DTO
     * @return the DTO wrapped in an Optional, or empty if the entity does not exist
     * @throws SecurityException if the user does not have access to the entity's organization
     */
    protected Optional<D> getEntityByIdWithPermissionCheck(
            Long id,
            Supplier<Optional<T>> entityFinder,
            Function<T, Long> organizationIdGetter,
            Function<T, D> mapper
    ) {
        User user = getCurrentUser();
        Optional<T> entityOpt = entityFinder.get();

        if (entityOpt.isEmpty()) {
            return Optional.empty();
        }

        T entity = entityOpt.get();
        UserRole role = user.getRole();

        if (role == UserRole.SUPERADMIN) {
            return Optional.of(mapper.apply(entity));
        }

        if (user.getEmployee() != null) {
            if (role == UserRole.ADMIN || role == UserRole.COORDINATOR || role == UserRole.CAREGIVER) {
                if (user.getEmployee().getOrganization() == null) {
                    throw new SecurityException("Zaměstnanec nemá přiřazenou organizaci");
                }

                Long userOrgId = user.getEmployee().getOrganization().getId();
                Long entityOrgId = organizationIdGetter.apply(entity);

                if (userOrgId.equals(entityOrgId)) {
                    return Optional.of(mapper.apply(entity));
                } else {
                    throw new SecurityException("Přístup odepřen: entita patří do jiné organizace");
                }
            }
        }

        throw new SecurityException("Nemáte oprávnění zobrazit tuto entitu");
    }

    /**
     * Fetches a single entity by ID and applies department-level permission check.
     * ADMIN may access any entity within their organization; COORDINATOR and CAREGIVER
     * are restricted to entities within their own department.
     *
     * @param id the entity ID (unused beyond acting as a type anchor)
     * @param entityFinder supplies the entity lookup (e.g. {@code () -> repository.findById(id)})
     * @param organizationIdGetter extracts the organization ID from the entity
     * @param departmentIdGetter extracts the department ID from the entity
     * @param mapper converts the entity to a DTO
     * @return the DTO wrapped in an Optional, or empty if the entity does not exist
     * @throws SecurityException if the user does not have access to the entity
     */
    protected Optional<D> getEntityByIdWithPermissionCheck(
            Long id,
            Supplier<Optional<T>> entityFinder,
            Function<T, Long> organizationIdGetter,
            Function<T, Long> departmentIdGetter,
            Function<T, D> mapper
    ) {
        User user = getCurrentUser();
        Optional<T> entityOpt = entityFinder.get();

        if (entityOpt.isEmpty()) {
            return Optional.empty();
        }

        T entity = entityOpt.get();
        UserRole role = user.getRole();

        if (role == UserRole.SUPERADMIN) {
            return Optional.of(mapper.apply(entity));
        }

        if (user.getEmployee() != null) {
            if (role == UserRole.ADMIN) {
                if (user.getEmployee().getOrganization() == null) {
                    throw new SecurityException("Administrátor nemá přiřazenou organizaci");
                }

                Long userOrgId = user.getEmployee().getOrganization().getId();
                Long entityOrgId = organizationIdGetter.apply(entity);

                if (userOrgId.equals(entityOrgId)) {
                    return Optional.of(mapper.apply(entity));
                } else {
                    throw new SecurityException("Přístup odepřen: entita patří do jiné organizace");
                }
            }

            if (role == UserRole.COORDINATOR || role == UserRole.CAREGIVER) {
                if (user.getEmployee().getDepartment() == null) {
                    throw new SecurityException("Zaměstnanec nemá přiřazené oddělení");
                }

                Long userDeptId = user.getEmployee().getDepartment().getId();
                Long entityDeptId = departmentIdGetter.apply(entity);

                if (userDeptId.equals(entityDeptId)) {
                    return Optional.of(mapper.apply(entity));
                } else {
                    throw new SecurityException("Přístup odepřen: entita patří do jiného oddělení");
                }
            }
        }

        throw new SecurityException("Nemáte oprávnění zobrazit tuto entitu");
    }

    /**
     * Computes organization and department filter values based on the current user's role.
     * Intended for use with JPA Specifications or custom repository queries.
     * <p>
     * SUPERADMIN: uses {@code requestedOrganizationId} and {@code requestedDepartmentIds} as-is.<br>
     * ADMIN: always scoped to their own organization; may filter by {@code requestedDepartmentIds}.<br>
     * COORDINATOR/CAREGIVER: always scoped to their own department; if {@code requestedDepartmentIds}
     * is provided and does not include their department, {@link RoleBasedFilters#noAccess()} is returned.
     *
     * @param requestedOrganizationId optional organization ID from the request (may be null)
     * @param requestedDepartmentIds optional department IDs from the request (may be null or empty)
     * @return computed role-based filters
     * @throws SecurityException if the user lacks permission or has no assigned organization/department
     */
    protected RoleBasedFilters calculateRoleBasedFilters(
            Long requestedOrganizationId,
            List<Long> requestedDepartmentIds
    ) {
        User user = getCurrentUser();
        UserRole role = user.getRole();

        if (role == UserRole.SUPERADMIN) {
            return new RoleBasedFilters(requestedOrganizationId, requestedDepartmentIds);

        } else if (role == UserRole.ADMIN) {
            if (user.getEmployee() == null || user.getEmployee().getOrganization() == null) {
                throw new SecurityException("Administrátor nemá přiřazenou organizaci");
            }
            Long userOrgId = user.getEmployee().getOrganization().getId();
            return new RoleBasedFilters(userOrgId, requestedDepartmentIds);

        } else if (role == UserRole.COORDINATOR || role == UserRole.CAREGIVER) {
            if (user.getEmployee() == null || user.getEmployee().getDepartment() == null) {
                throw new SecurityException("Zaměstnanec nemá přiřazené oddělení");
            }

            Long userOrgId = user.getEmployee().getOrganization().getId();
            Long userDeptId = user.getEmployee().getDepartment().getId();

            if (requestedDepartmentIds != null && !requestedDepartmentIds.isEmpty()) {
                if (!requestedDepartmentIds.contains(userDeptId)) {
                    return RoleBasedFilters.noAccess();
                }
            }

            return new RoleBasedFilters(userOrgId, java.util.Collections.singletonList(userDeptId));

        } else {
            throw new SecurityException("Nemáte oprávnění zobrazit tato data");
        }
    }

    /**
     * Computes an organization-only filter based on the current user's role.
     * Department filtering is not applied.
     * SUPERADMIN may use any {@code requestedOrganizationId}; all employee roles are scoped to their own organization.
     *
     * @param requestedOrganizationId optional organization ID from the request (may be null)
     * @return computed role-based filters containing only the organization ID
     * @throws SecurityException if the user lacks permission or has no assigned organization
     */
    protected RoleBasedFilters calculateRoleBasedFiltersOrganizationOnly(Long requestedOrganizationId) {
        User user = getCurrentUser();
        UserRole role = user.getRole();

        if (role == UserRole.SUPERADMIN) {
            return new RoleBasedFilters(requestedOrganizationId, null);

        } else if (role == UserRole.ADMIN || role == UserRole.COORDINATOR || role == UserRole.CAREGIVER) {
            if (user.getEmployee() == null || user.getEmployee().getOrganization() == null) {
                throw new SecurityException("Zaměstnanec nemá přiřazenou organizaci");
            }
            Long userOrgId = user.getEmployee().getOrganization().getId();

            return new RoleBasedFilters(userOrgId, null);

        } else {
            throw new SecurityException("Nemáte oprávnění zobrazit tato data");
        }
    }
}
