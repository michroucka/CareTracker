package cz.zcu.kiv.caretracker.support;

import cz.zcu.kiv.caretracker.entity.*;
import cz.zcu.kiv.caretracker.enums.BenefitLevel;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.enums.Gender;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.repository.*;
import org.springframework.boot.test.context.TestComponent;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Creates and saves valid entities for integration tests. Every method fills required fields
 * with unique defaults; the test then changes only what matters for it.
 * Add methods here (client, task, performed task...) as tests need them.
 */
@TestComponent
public class TestData {

    public static final String PASSWORD = "Heslo123!";

    private final AtomicInteger sequence = new AtomicInteger();

    private final OrganizationRepository organizationRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final PasswordEncoder passwordEncoder;

    public TestData(OrganizationRepository organizationRepository,
                    DepartmentRepository departmentRepository,
                    EmployeeRepository employeeRepository,
                    UserRepository userRepository,
                    ClientRepository clientRepository,
                    PasswordEncoder passwordEncoder) {
        this.organizationRepository = organizationRepository;
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Organization organization() {
        Organization organization = new Organization();
        organization.setName("Organizace " + next());
        return organizationRepository.save(organization);
    }

    public Department department(Organization organization) {
        Department department = new Department();
        department.setOrganization(organization);
        department.setStreet("Testovací " + next());
        department.setCity("Plzeň");
        department.setPostalCode("301 00");
        return departmentRepository.save(department);
    }

    /** Employee in the department together with an active login account whose role follows the employee role. */
    public Employee employee(Department department, EmployeeRole role) {
        Employee employee = new Employee();
        employee.setFirstName("Jana");
        employee.setLastName("Testová " + next());
        employee.setRole(role);
        employee.setDepartment(department);
        employee.setOrganization(department.getOrganization());
        employee = employeeRepository.save(employee);

        User user = account(role.toUserRole());
        user.setEmployee(employee);
        employee.setUser(userRepository.save(user));
        return employee;
    }

    public Client client(Employee caregiver) {
        Client client = new Client();
        client.setFirstName("Petr");
        client.setLastName("Test " +  next());
        client.setGender(Gender.MALE);
        client.setDateOfBirth(LocalDate.of(1950, 6, 24));
        client.setStreet("Testovací");
        client.setCity("Testov");
        client.setPostalCode("301 23");
        client.setLegallyCompetent(true);
        client.setBenefits(BenefitLevel.TWO);
        client.setDepartment(caregiver.getDepartment());
        client.setOrganization(caregiver.getOrganization());
        client.setCaregiver(caregiver);

        client = clientRepository.save(client);
        return client;
    }

    public User superadmin() {
        return userRepository.save(account(UserRole.SUPERADMIN));
    }

    private User account(UserRole role) {
        String username = role.name().toLowerCase() + next() + "@caretracker.test";
        User user = new User();
        user.setUsername(username);
        user.setEmail(username);
        user.setPassword(passwordEncoder.encode(PASSWORD));
        user.setRole(role);
        return user;
    }

    private int next() {
        return sequence.incrementAndGet();
    }
}
