package cz.zcu.kiv.caretracker.service;

import com.jayway.jsonpath.JsonPath;
import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.entity.PerformedTask;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.repository.DepartmentRepository;
import cz.zcu.kiv.caretracker.repository.EmployeeRepository;
import cz.zcu.kiv.caretracker.repository.PerformedTaskRepository;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import jakarta.mail.Message;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mail.MailSendException;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Employee lifecycle and its effect on the employee's login account: an e-mail creates an account waiting for
 * activation and sends the activation link, termination blocks the account and activation unblocks it.
 * An employee can be terminated only after their active clients get another caregiver; a terminated
 * coordinator leaves the department without a coordinator.
 */
class EmployeeLifecycleIT extends AbstractIntegrationTest {

    private static final String EMAIL = "nova.pecovatelka@caretracker.test";

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private PerformedTaskRepository performedTaskRepository;

    private Organization organization;
    private Department department;
    private Employee admin;

    @BeforeEach
    void createOrganization() {
        organization = testData.organization();
        department = testData.department(organization);
        admin = testData.employee(department, EmployeeRole.MANAGER);
    }

    @Test
    void employeeWithEmailGetsAccountWaitingForActivation() throws Exception {
        long id = createdId(perform(post("/api/employees"), employeeRequest("CAREGIVER", department, EMAIL))
                .andExpect(status().isOk()));

        Employee employee = employeeRepository.findById(id).orElseThrow();
        assertThat(employee.getActive()).isTrue();
        assertThat(employee.getOrganization().getId()).isEqualTo(organization.getId());

        User account = employee.getUser();
        assertThat(account.getEmail()).isEqualTo(EMAIL);
        assertThat(account.getRole()).isEqualTo(UserRole.CAREGIVER);
        assertThat(account.getActive()).isTrue();
        assertThat(account.getUsername()).isNull();
        assertThat(account.getPassword()).isNull();
        assertThat(account.getActivationToken()).isNotBlank();
        assertThat(account.getTokenExpiry()).isCloseTo(LocalDateTime.now().plusDays(7), within(1, ChronoUnit.MINUTES));
    }

    @Test
    void activationMailCarriesTokenOfNewAccount() throws Exception {
        perform(post("/api/employees"), employeeRequest("CAREGIVER", department, EMAIL)).andExpect(status().isOk());

        String token = userRepository.findByEmail(EMAIL).orElseThrow().getActivationToken();
        MimeMessage mail = sentMail();
        assertThat(mail.getRecipients(Message.RecipientType.TO)).containsExactly(new InternetAddress(EMAIL));
        assertThat(mail.getSubject()).startsWith("Aktivace účtu");
        assertThat(textOf(mail)).contains("/activate?token=" + token);
    }

    @ParameterizedTest
    @CsvSource({"CAREGIVER, false, CAREGIVER", "COORDINATOR, false, COORDINATOR", "MANAGER, false, ADMIN", "CAREGIVER, true, ADMIN"})
    void accountRoleFollowsEmployeeRoleAndAdminFlag(String employeeRole, boolean isAdmin, UserRole accountRole) throws Exception {
        Map<String, Object> request = employeeRequest(employeeRole, department, EMAIL);
        request.put("isAdmin", isAdmin);

        perform(post("/api/employees"), request).andExpect(status().isOk());

        assertThat(userRepository.findByEmail(EMAIL)).get()
                .extracting(User::getRole)
                .isEqualTo(accountRole);
    }

    @Test
    void employeeWithoutEmailGetsNoAccountAndNoMail() throws Exception {
        long id = createdId(perform(post("/api/employees"), employeeRequest("CAREGIVER", department, null))
                .andExpect(status().isOk()));

        assertThat(employeeRepository.findById(id).orElseThrow().getUser()).isNull();
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void failedActivationMailCancelsWholeCreation() throws Exception {
        doThrow(new MailSendException("SMTP nedostupné")).when(mailSender).send(any(MimeMessage.class));
        long employeesBefore = employeeRepository.count();

        perform(post("/api/employees"), employeeRequest("CAREGIVER", department, EMAIL))
                .andExpect(status().isBadRequest());

        assertThat(employeeRepository.count()).isEqualTo(employeesBefore);
        assertThat(userRepository.findByEmail(EMAIL)).isEmpty();
    }

    @Test
    void emailAddedLaterCreatesAccountAndSendsActivation() throws Exception {
        long id = createdId(perform(post("/api/employees"), employeeRequest("CAREGIVER", department, null))
                .andExpect(status().isOk()));

        perform(put("/api/employees/{id}", id), employeeRequest("CAREGIVER", department, EMAIL)).andExpect(status().isOk());

        assertThat(employeeRepository.findById(id).orElseThrow().getUser())
                .satisfies(account -> {
                    assertThat(account.getEmail()).isEqualTo(EMAIL);
                    assertThat(account.getActivationToken()).isNotBlank();
                });
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void updateChangesEmailAndRoleOfExistingAccountWithoutNewActivation() throws Exception {
        Employee caregiver = testData.employee(department, EmployeeRole.CAREGIVER);
        String username = caregiver.getUser().getUsername();

        perform(put("/api/employees/{id}", caregiver.getId()), employeeRequest("COORDINATOR", department, EMAIL))
                .andExpect(status().isOk());

        Employee saved = employeeRepository.findById(caregiver.getId()).orElseThrow();
        assertThat(saved.getRole()).isEqualTo(EmployeeRole.COORDINATOR);
        assertThat(saved.getUser().getId()).isEqualTo(caregiver.getUser().getId());
        assertThat(saved.getUser().getEmail()).isEqualTo(EMAIL);
        assertThat(saved.getUser().getRole()).isEqualTo(UserRole.COORDINATOR);
        assertThat(saved.getUser().getUsername()).isEqualTo(username);
        assertThat(saved.getUser().getActivationToken()).isNull();
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void employeeMovedToOtherDepartmentStaysInOrganization() throws Exception {
        Employee caregiver = testData.employee(department, EmployeeRole.CAREGIVER);
        Department otherDepartment = testData.department(organization);

        perform(put("/api/employees/{id}", caregiver.getId()), employeeRequest("CAREGIVER", otherDepartment, caregiver.getUser().getEmail()))
                .andExpect(status().isOk());

        Employee saved = employeeRepository.findById(caregiver.getId()).orElseThrow();
        assertThat(saved.getDepartment().getId()).isEqualTo(otherDepartment.getId());
        assertThat(saved.getOrganization().getId()).isEqualTo(organization.getId());
    }

    @Test
    void terminationBlocksAccount() throws Exception {
        Employee caregiver = testData.employee(department, EmployeeRole.CAREGIVER);

        perform(put("/api/employees/{id}/terminate", caregiver.getId())).andExpect(status().isOk());

        Employee saved = employeeRepository.findById(caregiver.getId()).orElseThrow();
        assertThat(saved.getActive()).isFalse();
        assertThat(saved.getUser().getActive()).isFalse();
    }

    @Test
    void activationUnblocksAccount() throws Exception {
        Employee caregiver = testData.employee(department, EmployeeRole.CAREGIVER);
        perform(put("/api/employees/{id}/terminate", caregiver.getId())).andExpect(status().isOk());

        perform(put("/api/employees/{id}/activate", caregiver.getId())).andExpect(status().isOk());

        Employee saved = employeeRepository.findById(caregiver.getId()).orElseThrow();
        assertThat(saved.getActive()).isTrue();
        assertThat(saved.getUser().getActive()).isTrue();
    }

    @Test
    void employeeWithoutAccountCanBeTerminatedAndActivated() throws Exception {
        long id = createdId(perform(post("/api/employees"), employeeRequest("CAREGIVER", department, null))
                .andExpect(status().isOk()));

        perform(put("/api/employees/{id}/terminate", id)).andExpect(status().isOk());
        assertThat(employeeRepository.findById(id).orElseThrow().getActive()).isFalse();

        perform(put("/api/employees/{id}/activate", id)).andExpect(status().isOk());
        assertThat(employeeRepository.findById(id).orElseThrow().getActive()).isTrue();
    }

    @Test
    void terminationKeepsPendingActivationOfAccount() throws Exception {
        Employee pending = testData.withPendingAccount(testData.employee(department, EmployeeRole.CAREGIVER));
        String token = pending.getUser().getActivationToken();

        perform(put("/api/employees/{id}/terminate", pending.getId())).andExpect(status().isOk());

        assertThat(employeeRepository.findById(pending.getId()).orElseThrow().getUser())
                .satisfies(account -> {
                    assertThat(account.getActive()).isFalse();
                    assertThat(account.getActivationToken()).isEqualTo(token);
                });
    }

    @Test
    void employeeCannotBeCreatedInTerminatedDepartment() throws Exception {
        Department terminated = testData.department(organization);
        terminated.setActive(false);
        departmentRepository.save(terminated);
        long employeesBefore = employeeRepository.count();

        perform(post("/api/employees"), employeeRequest("CAREGIVER", terminated, null)).andExpect(status().isBadRequest());

        assertThat(employeeRepository.count()).isEqualTo(employeesBefore);
    }

    @Test
    void employeeCannotBeMovedToTerminatedDepartment() throws Exception {
        Employee caregiver = testData.employee(department, EmployeeRole.CAREGIVER);
        Department terminated = testData.department(organization);
        terminated.setActive(false);
        departmentRepository.save(terminated);

        perform(put("/api/employees/{id}", caregiver.getId()), employeeRequest("CAREGIVER", terminated, caregiver.getUser().getEmail()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Středisko je ukončené, vyberte aktivní středisko"));

        assertThat(employeeRepository.findById(caregiver.getId()).orElseThrow().getDepartment().getId()).isEqualTo(department.getId());
    }

    @Test
    void formerEmployeeOfTerminatedDepartmentCanStillBeEdited() throws Exception {
        Department terminated = testData.department(organization);
        Employee former = testData.employee(terminated, EmployeeRole.CAREGIVER);
        former.setActive(false);
        employeeRepository.save(former);
        terminated.setActive(false);
        departmentRepository.save(terminated);

        perform(put("/api/employees/{id}", former.getId()), employeeRequest("CAREGIVER", terminated, former.getUser().getEmail()))
                .andExpect(status().isOk());

        assertThat(employeeRepository.findById(former.getId()).orElseThrow().getLastName()).isEqualTo("Pečovatelka");
    }

    @Test
    void caregiverOfActiveClientsCannotBeTerminated() throws Exception {
        Employee caregiver = testData.employee(department, EmployeeRole.CAREGIVER);
        testData.client(caregiver);
        testData.client(caregiver);

        perform(put("/api/employees/{id}/terminate", caregiver.getId()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value("Zaměstnanec je pečovatelem 2 aktivních klientů, nejdřív jim přidělte jiného pečovatele"));

        Employee saved = employeeRepository.findById(caregiver.getId()).orElseThrow();
        assertThat(saved.getActive()).isTrue();
        assertThat(saved.getUser().getActive()).isTrue();
    }

    @Test
    void caregiverOfSingleActiveClientGetsSingularMessage() throws Exception {
        Employee caregiver = testData.employee(department, EmployeeRole.CAREGIVER);
        testData.client(caregiver);

        perform(put("/api/employees/{id}/terminate", caregiver.getId()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value("Zaměstnanec je pečovatelem 1 aktivního klienta, nejdřív klientovi přidělte jiného pečovatele"));
    }

    @Test
    void caregiverOfTerminatedClientsOnlyCanBeTerminatedAndKeepsRecordedTasks() throws Exception {
        Employee caregiver = testData.employee(department, EmployeeRole.CAREGIVER);
        Client formerClient = testData.client(caregiver);
        PerformedTask recorded = testData.performedTask(formerClient, testData.task(organization), caregiver);
        formerClient.setActive(false);
        clientRepository.save(formerClient);

        perform(put("/api/employees/{id}/terminate", caregiver.getId())).andExpect(status().isOk());

        assertThat(employeeRepository.findById(caregiver.getId()).orElseThrow().getActive()).isFalse();
        assertThat(performedTaskRepository.findTop5ByCaregivers_IdOrderByDateDesc(caregiver.getId()))
                .extracting(PerformedTask::getId)
                .containsExactly(recorded.getId());
    }

    @Test
    void terminatedCoordinatorLeavesDepartmentWithoutCoordinator() throws Exception {
        Employee coordinator = testData.employee(department, EmployeeRole.COORDINATOR);
        department.setCoordinator(coordinator);
        departmentRepository.save(department);

        perform(put("/api/employees/{id}/terminate", coordinator.getId())).andExpect(status().isOk());

        Department saved = departmentRepository.findById(department.getId()).orElseThrow();
        assertThat(saved.getActive()).isTrue();
        assertThat(saved.getCoordinator()).isNull();
        Employee terminated = employeeRepository.findById(coordinator.getId()).orElseThrow();
        assertThat(terminated.getRole()).isEqualTo(EmployeeRole.CAREGIVER);
        assertThat(terminated.getUser().getRole()).isEqualTo(UserRole.CAREGIVER);
        assertThat(terminated.getUser().getActive()).isFalse();
    }

    private MimeMessage sentMail() {
        ArgumentCaptor<MimeMessage> mail = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(mail.capture());
        return mail.getValue();
    }

    private static String textOf(Part part) throws Exception {
        Object content = part.getContent();
        if (content instanceof Multipart multipart) {
            StringBuilder text = new StringBuilder();
            for (int i = 0; i < multipart.getCount(); i++) {
                text.append(textOf(multipart.getBodyPart(i)));
            }
            return text.toString();
        }
        // the helper sets only the text part, which is the HTML body; content types are filled in on saveChanges()
        return content instanceof String text ? text : "";
    }

    private long createdId(ResultActions result) throws Exception {
        Number id = JsonPath.read(result.andReturn().getResponse().getContentAsString(), "$.id");
        return id.longValue();
    }

    private ResultActions perform(MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(loggedInAs(admin)));
    }

    private ResultActions perform(MockHttpServletRequestBuilder request, Map<String, Object> body) throws Exception {
        return perform(request.contentType(MediaType.APPLICATION_JSON).content(json(body)));
    }

    private static Map<String, Object> employeeRequest(String role, Department department, String email) {
        Map<String, Object> request = new HashMap<>();
        request.put("firstName", "Nová");
        request.put("lastName", "Pečovatelka");
        request.put("role", role);
        request.put("departmentId", department.getId());
        if (email != null) {
            request.put("email", email);
            request.put("isAdmin", false);
        }
        return request;
    }
}
