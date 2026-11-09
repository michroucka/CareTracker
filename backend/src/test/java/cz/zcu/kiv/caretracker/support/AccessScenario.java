package cz.zcu.kiv.caretracker.support;

import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;

import java.util.EnumMap;
import java.util.Map;

/**
 * Standard setup for authorization tests: the organization with two departments, another
 * organization, one user per {@link Actor} and a client in {@link #department} cared for by
 * {@link Actor#CAREGIVER_OF_CLIENT}. Actors are named by their relation to that client.
 */
public class AccessScenario {

    public enum Actor {
        SUPERADMIN,
        ADMIN,
        ADMIN_OTHER_ORG,
        COORDINATOR,
        COORDINATOR_OTHER_DEPT,
        COORDINATOR_OTHER_ORG,
        CAREGIVER_OF_CLIENT,
        CAREGIVER,
        CAREGIVER_OTHER_DEPT,
        CAREGIVER_OTHER_ORG,
        CLIENT_ACCOUNT
    }

    public final Organization organization;
    public final Department department;
    public final Department otherDepartment;
    public final Organization otherOrganization;
    public final Department otherOrganizationDepartment;
    public final Client client;

    private final Map<Actor, User> users = new EnumMap<>(Actor.class);
    private final Map<Actor, Employee> employees = new EnumMap<>(Actor.class);

    public AccessScenario(TestData testData) {
        organization = testData.organization();
        department = testData.department(organization);
        otherDepartment = testData.department(organization);
        otherOrganization = testData.organization();
        otherOrganizationDepartment = testData.department(otherOrganization);

        addEmployee(testData, Actor.ADMIN, department, EmployeeRole.MANAGER);
        addEmployee(testData, Actor.ADMIN_OTHER_ORG, otherOrganizationDepartment, EmployeeRole.MANAGER);
        addEmployee(testData, Actor.COORDINATOR, department, EmployeeRole.COORDINATOR);
        addEmployee(testData, Actor.COORDINATOR_OTHER_DEPT, otherDepartment, EmployeeRole.COORDINATOR);
        addEmployee(testData, Actor.COORDINATOR_OTHER_ORG, otherOrganizationDepartment, EmployeeRole.COORDINATOR);
        addEmployee(testData, Actor.CAREGIVER_OF_CLIENT, department, EmployeeRole.CAREGIVER);
        addEmployee(testData, Actor.CAREGIVER, department, EmployeeRole.CAREGIVER);
        addEmployee(testData, Actor.CAREGIVER_OTHER_DEPT, otherDepartment, EmployeeRole.CAREGIVER);
        addEmployee(testData, Actor.CAREGIVER_OTHER_ORG, otherOrganizationDepartment, EmployeeRole.CAREGIVER);
        users.put(Actor.SUPERADMIN, testData.superadmin());

        client = testData.client(employee(Actor.CAREGIVER_OF_CLIENT));
        users.put(Actor.CLIENT_ACCOUNT, testData.clientAccount(client));
    }

    public User user(Actor actor) {
        return users.get(actor);
    }

    public Employee employee(Actor actor) {
        Employee employee = employees.get(actor);
        if (employee == null) {
            throw new IllegalArgumentException(actor + " is not an employee");
        }
        return employee;
    }

    private void addEmployee(TestData testData, Actor actor, Department department, EmployeeRole role) {
        Employee employee = testData.employee(department, role);
        employees.put(actor, employee);
        users.put(actor, employee.getUser());
    }
}
