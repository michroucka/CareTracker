package cz.zcu.kiv.caretracker.support;

import cz.zcu.kiv.caretracker.entity.*;
import cz.zcu.kiv.caretracker.enums.BenefitLevel;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.enums.Gender;
import cz.zcu.kiv.caretracker.enums.UnitType;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.repository.*;
import org.springframework.boot.test.context.TestComponent;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Creates and saves valid entities for integration tests. Every method fills required fields
 * with unique defaults; the test then changes only what matters for it.
 * Add methods here (task, performed task...) as tests need them.
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
    private final IndividualPlanRepository individualPlanRepository;
    private final DailyRecordRepository dailyRecordRepository;
    private final TaskRepository taskRepository;
    private final PerformedTaskRepository performedTaskRepository;
    private final PasswordEncoder passwordEncoder;

    // BCrypt is deliberately slow; hashing once keeps tests that create many accounts fast
    private String encodedPassword;

    public TestData(OrganizationRepository organizationRepository,
                    DepartmentRepository departmentRepository,
                    EmployeeRepository employeeRepository,
                    UserRepository userRepository,
                    ClientRepository clientRepository,
                    IndividualPlanRepository individualPlanRepository,
                    DailyRecordRepository dailyRecordRepository,
                    TaskRepository taskRepository,
                    PerformedTaskRepository performedTaskRepository,
                    PasswordEncoder passwordEncoder) {
        this.organizationRepository = organizationRepository;
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.individualPlanRepository = individualPlanRepository;
        this.dailyRecordRepository = dailyRecordRepository;
        this.taskRepository = taskRepository;
        this.performedTaskRepository = performedTaskRepository;
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

    /** Client in the caregiver's department and organization. */
    public Client client(Employee caregiver) {
        Client client = new Client();
        client.setFirstName("Petr");
        client.setLastName("Test " + next());
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
        return clientRepository.save(client);
    }

    /** Active login account of the client itself (role CLIENT). */
    public User clientAccount(Client client) {
        User user = account(UserRole.CLIENT);
        user.setClient(client);
        return userRepository.save(user);
    }

    /** Sets a small JPEG profile picture (both sizes already generated). */
    public Client withPicture(Client client) {
        client.setPicture(picture());
        return clientRepository.save(client);
    }

    /** Sets a small JPEG profile picture (both sizes already generated). */
    public Employee withPicture(Employee employee) {
        employee.setPicture(picture());
        return employeeRepository.save(employee);
    }

    /** Turns the employee's account back into one waiting for activation (no username yet). */
    public Employee withPendingAccount(Employee employee) {
        User user = employee.getUser();
        user.setUsername(null);
        user.setActivationToken("token-" + next());
        user.setTokenExpiry(LocalDateTime.now().plusDays(7));
        employee.setUser(userRepository.save(user));
        return employee;
    }

    /** Individual plan with one content version (version 1). */
    public IndividualPlan individualPlan(Client client) {
        IndividualPlan plan = new IndividualPlan();
        plan.setClient(client);
        plan.setOrganization(client.getOrganization());

        IndividualPlanContent firstVersion = new IndividualPlanContent();
        firstVersion.setIndividualPlan(plan);
        firstVersion.setVersionNumber(1);
        firstVersion.setProcessedDate(LocalDate.of(2026, 1, 15));
        firstVersion.setPlannedUpdateDate(LocalDate.of(2026, 12, 31));

        plan.setCurrentContent(firstVersion);
        plan.setContentVersions(new ArrayList<>(List.of(firstVersion)));
        plan.setDailyRecords(new ArrayList<>());
        return individualPlanRepository.save(plan);
    }

    public DailyRecord dailyRecord(IndividualPlan plan, Employee author) {
        DailyRecord dailyRecord = new DailyRecord();
        dailyRecord.setIndividualPlan(plan);
        dailyRecord.setCreatedBy(author);
        dailyRecord.setDate(LocalDate.of(2026, 11, 2));
        dailyRecord.setContent("Záznam " + next());
        return dailyRecordRepository.save(dailyRecord);
    }

    /** Active catalog entry of the organization, priced per hour. */
    public Task task(Organization organization) {
        Task task = new Task();
        task.setName("Úkon " + next());
        task.setUnitPrice(150);
        task.setUnitType(UnitType.HOUR);
        task.setDoubleMeeting(false);
        task.setActive(true);
        task.setOrganization(organization);
        return taskRepository.save(task);
    }

    public User superadmin() {
        return userRepository.save(account(UserRole.SUPERADMIN));
    }

    /** One hour of the task for the client on 2 November 2026, performed by the caregiver. */
    public PerformedTask performedTask(Client client, Task task, Employee caregiver) {
        PerformedTask performedTask = new PerformedTask();
        performedTask.setClient(client);
        performedTask.setTask(task);
        performedTask.setDepartment(client.getDepartment());
        performedTask.setOrganization(client.getOrganization());
        performedTask.setDate(LocalDateTime.of(2026, 11, 2, 9, 0));
        performedTask.setUnitCount(60.0);
        performedTask.setCaregivers(new ArrayList<>());
        performedTask = performedTaskRepository.save(performedTask);

        // caregivers cascade PERSIST, which rejects the detached employee; the second save merges instead
        performedTask.getCaregivers().add(caregiver);
        return performedTaskRepository.save(performedTask);
    }

    private Picture picture() {
        byte[] image = TestImages.jpeg(16, 16);
        Picture picture = new Picture();
        picture.setData(image);
        picture.setThumbnail(image);
        picture.setContentType("image/jpeg");
        picture.setSize((long) image.length);
        picture.setUploadedAt(LocalDateTime.now());
        return picture;
    }

    private User account(UserRole role) {
        String username = role.name().toLowerCase() + next() + "@caretracker.test";
        User user = new User();
        user.setUsername(username);
        user.setEmail(username);
        user.setPassword(encodedPassword());
        user.setRole(role);
        return user;
    }

    private String encodedPassword() {
        if (encodedPassword == null) {
            encodedPassword = passwordEncoder.encode(PASSWORD);
        }
        return encodedPassword;
    }

    private int next() {
        return sequence.incrementAndGet();
    }
}
