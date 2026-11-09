package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Account maintenance outside the public token flows: an admin resending the activation e-mail, the signed-in
 * user's own password reset e-mail and the parts of own account editing not covered by {@code OwnAccountIT}.
 */
class UserAccountIT extends AbstractIntegrationTest {

    private static final LocalDateTime CREATED = LocalDateTime.of(2026, 11, 1, 8, 0);
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 9, 10, 0);

    @Autowired
    private UserRepository userRepository;

    private Department department;
    private Employee admin;

    @BeforeEach
    void createDepartment() {
        department = testData.department(testData.organization());
        admin = testData.employee(department, EmployeeRole.MANAGER);
    }

    @Test
    void resendIssuesFreshTokenForSevenDaysAndInvalidatesTheOld() throws Exception {
        clock.fixAt(CREATED);
        Employee employee = testData.withPendingAccount(testData.employee(department, EmployeeRole.CAREGIVER));
        String expiredToken = employee.getUser().getActivationToken();
        clock.fixAt(NOW);

        resend(employee)
                .andExpect(status().isOk());

        User account = userRepository.findById(employee.getUser().getId()).orElseThrow();
        assertThat(account.getActivationToken()).isNotEqualTo(expiredToken);
        assertThat(account.getTokenExpiry()).isEqualTo(NOW.plusDays(7));
        validateActivation(expiredToken)
                .andExpect(status().isBadRequest());
        validateActivation(account.getActivationToken())
                .andExpect(status().isOk());

        List<MimeMessage> mails = sentMails();
        assertThat(mails).hasSize(1);
        assertThat(recipientOf(mails.getFirst())).isEqualTo(account.getEmail());
        assertThat(mailText(mails.getFirst()))
                .contains("/activate?token=" + account.getActivationToken())
                .contains(employee.getFullName());
    }

    @Test
    void resendForActivatedAccountIsRejectedWithoutMail() throws Exception {
        Employee employee = testData.employee(department, EmployeeRole.CAREGIVER);

        resend(employee)
                .andExpect(status().isBadRequest());

        assertThat(userRepository.findById(employee.getUser().getId()).orElseThrow().getActivationToken()).isNull();
        assertThat(sentMails()).isEmpty();
    }

    @Test
    void ownResetMailGoesToOwnAddressWithLinkValidForTwentyFourHours() throws Exception {
        clock.fixAt(NOW);
        User account = testData.employee(department, EmployeeRole.CAREGIVER).getUser();

        mockMvc.perform(post("/api/user/forgot-password").with(loggedInAs(account)))
                .andExpect(status().isOk());

        User withToken = userRepository.findById(account.getId()).orElseThrow();
        assertThat(withToken.getTokenExpiry()).isEqualTo(NOW.plusHours(24));
        List<MimeMessage> mails = sentMails();
        assertThat(mails).hasSize(1);
        assertThat(recipientOf(mails.getFirst())).isEqualTo(account.getEmail());
        assertThat(mailText(mails.getFirst())).contains("/reset-password?token=" + withToken.getActivationToken());
    }

    @Test
    void cannotTakeEmailOfAnotherAccountInDifferentCase() throws Exception {
        User account = testData.employee(department, EmployeeRole.CAREGIVER).getUser();

        updateOwnAccount(account, account.getUsername(), admin.getUser().getEmail().toUpperCase())
                .andExpect(status().isBadRequest());

        assertThat(userRepository.findById(account.getId()).orElseThrow().getEmail()).isEqualTo(account.getEmail());
    }

    @Test
    void cannotClearOwnEmail() throws Exception {
        User account = testData.employee(department, EmployeeRole.CAREGIVER).getUser();

        mockMvc.perform(put("/api/user/me").with(loggedInAs(account)).contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("username", account.getUsername()))))
                .andExpect(status().isBadRequest());

        assertThat(userRepository.findById(account.getId()).orElseThrow().getEmail()).isEqualTo(account.getEmail());
    }

    @Test
    void ownAccountUpdateIgnoresRolePasswordAndActiveFlag() throws Exception {
        User account = testData.employee(department, EmployeeRole.CAREGIVER).getUser();

        mockMvc.perform(put("/api/user/me").with(loggedInAs(account)).contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("username", "novy.login", "email", account.getEmail(),
                                "role", "SUPERADMIN", "password", "Utocnik1!", "active", false))))
                .andExpect(status().isOk());

        User updated = userRepository.findById(account.getId()).orElseThrow();
        assertThat(updated.getUsername()).isEqualTo("novy.login");
        assertThat(updated.getRole()).isEqualTo(account.getRole());
        assertThat(updated.getPassword()).isEqualTo(account.getPassword());
        assertThat(updated.getActive()).isTrue();
    }

    private ResultActions resend(Employee employee) throws Exception {
        return mockMvc.perform(post("/api/employees/{id}/resend", employee.getId()).with(loggedInAs(admin)));
    }

    private ResultActions validateActivation(String token) throws Exception {
        return mockMvc.perform(get("/api/activation/validate").param("token", token));
    }

    private ResultActions updateOwnAccount(User account, String username, String email) throws Exception {
        return mockMvc.perform(put("/api/user/me").with(loggedInAs(account)).contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("username", username, "email", email))));
    }
}
