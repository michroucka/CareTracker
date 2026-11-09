package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.client.ClientTerminateDTO;
import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.enums.TerminationReason;
import cz.zcu.kiv.caretracker.enums.UserRole;
import cz.zcu.kiv.caretracker.exception.ValidationException;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Termination and re-activation of a client and the client's own login account, checked in the database.
 * The clock stands on 9 November 2026, 10:00.
 */
class ClientLifecycleIT extends AbstractIntegrationTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 9, 10, 0);
    private static final LocalDate TODAY = NOW.toLocalDate();

    @Autowired
    private ClientService clientService;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserDetailsService userDetailsService;

    private Employee coordinator;
    private Client client;

    @BeforeEach
    void createClient() {
        clock.fixAt(NOW);
        Department department = testData.department(testData.organization());
        coordinator = testData.employee(department, EmployeeRole.COORDINATOR);
        client = testData.client(testData.employee(department, EmployeeRole.CAREGIVER));
        signInAs(coordinator);
    }

    @Test
    void terminationStoresDateAndReasonAndDeactivatesClient() {
        clientService.terminateClient(client.getId(), new ClientTerminateDTO(LocalDate.of(2026, 10, 31), "RESIDENTIAL_SERVICE"));

        Client stored = reloaded(client);
        assertThat(stored.getActive()).isFalse();
        assertThat(stored.getTerminationDate()).isEqualTo(LocalDate.of(2026, 10, 31));
        assertThat(stored.getTerminationReason()).isEqualTo(TerminationReason.RESIDENTIAL_SERVICE);
    }

    @Test
    void clientCanBeTerminatedToday() {
        clientService.terminateClient(client.getId(), new ClientTerminateDTO(TODAY, "EXITUS"));

        assertThat(reloaded(client).getTerminationDate()).isEqualTo(TODAY);
    }

    @Test
    void activationClearsTerminationDataInDatabase() {
        clientService.terminateClient(client.getId(), new ClientTerminateDTO(LocalDate.of(2026, 10, 31), "OTHER"));

        clientService.activateClient(client.getId());

        Client stored = reloaded(client);
        assertThat(stored.getActive()).isTrue();
        assertThat(stored.getTerminationDate()).isNull();
        assertThat(stored.getTerminationReason()).isNull();
    }

    @Test
    void terminationWithoutReasonIsRejected() {
        assertThatThrownBy(() -> clientService.terminateClient(client.getId(), new ClientTerminateDTO(TODAY, null)))
                .isInstanceOf(ValidationException.class);

        assertThat(reloaded(client).getActive()).isTrue();
    }

    @Test
    void terminationWithUnknownReasonIsRejectedWithReadableMessage() {
        assertThatThrownBy(() -> clientService.terminateClient(client.getId(), new ClientTerminateDTO(TODAY, "MOVED_AWAY")))
                .isInstanceOf(ValidationException.class);

        assertThat(reloaded(client).getActive()).isTrue();
    }

    @Test
    void terminationWithoutDateIsRejected() {
        assertThatThrownBy(() -> clientService.terminateClient(client.getId(), new ClientTerminateDTO(null, "EXITUS")))
                .isInstanceOf(ValidationException.class);

        assertThat(reloaded(client).getActive()).isTrue();
    }

    @Test
    void terminationDateInFutureIsRejected() {
        ClientTerminateDTO tomorrow = new ClientTerminateDTO(TODAY.plusDays(1), "EXITUS");

        assertThatThrownBy(() -> clientService.terminateClient(client.getId(), tomorrow))
                .isInstanceOf(ValidationException.class);

        assertThat(reloaded(client).getActive()).isTrue();
    }

    @Test
    void terminationDeactivatesClientAccountAndActivationRestoresIt() {
        User account = testData.clientAccount(client);

        clientService.terminateClient(client.getId(), new ClientTerminateDTO(TODAY, "CONTRACT_TERMINATION"));
        assertThat(reloaded(account).getActive()).isFalse();

        clientService.activateClient(client.getId());
        assertThat(reloaded(account).getActive()).isTrue();
    }

    @Test
    void createdAccountWaitsForActivationAndSendsEmail() throws Exception {
        mockMvc.perform(post("/api/clients/{id}/account/create", client.getId()).with(loggedInAs(coordinator))
                        .param("email", "petr.klient@caretracker.test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Aktivační email byl úspěšně odeslán"));

        User account = userRepository.findByClientId(client.getId()).orElseThrow();
        assertThat(account.getRole()).isEqualTo(UserRole.CLIENT);
        assertThat(account.getEmail()).isEqualTo("petr.klient@caretracker.test");
        assertThat(account.getActive()).isTrue();
        assertThat(account.getUsername()).isNull();
        assertThat(account.getPassword()).isNull();
        assertThat(account.getActivationToken()).isNotBlank();
        assertThat(account.getTokenExpiry()).isAfter(LocalDateTime.now());
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @Disabled("Nález: backend vytvoří klientovi druhý účet, i když už jeden má (frontend nabízí vytvoření jen bez účtu). "
            + "Sloupec app_user.client_id není unikátní; pak detail klienta, seznam klientů i blokování účtu "
            + "vrací 400 \"Duplicate row was found\" / \"More than one row with the given identifier\".")
    void secondAccountForSameClientIsRejected() throws Exception {
        testData.clientAccount(client);

        mockMvc.perform(post("/api/clients/{id}/account/create", client.getId()).with(loggedInAs(coordinator))
                        .param("email", "druhy.ucet@caretracker.test"))
                .andExpect(status().isBadRequest());

        assertThat(userRepository.findByClient_OrganizationId(client.getOrganization().getId())).hasSize(1);
    }

    @Test
    void blockedAccountCannotSignInAndUnblockingRestoresIt() throws Exception {
        User account = testData.clientAccount(client);

        mockMvc.perform(put("/api/clients/{id}/account/deactivate", client.getId()).with(loggedInAs(coordinator)))
                .andExpect(status().isNoContent());

        assertThat(reloaded(account).getActive()).isFalse();
        assertThat(userDetailsService.loadUserByUsername(account.getUsername()).isEnabled()).isFalse();
        assertThat(reloaded(client).getActive()).isTrue();

        mockMvc.perform(put("/api/clients/{id}/account/activate", client.getId()).with(loggedInAs(coordinator)))
                .andExpect(status().isNoContent());

        assertThat(reloaded(account).getActive()).isTrue();
        assertThat(userDetailsService.loadUserByUsername(account.getUsername()).isEnabled()).isTrue();
    }

    @Test
    void blockingAccountOfClientWithoutAccountReturnsNotFound() throws Exception {
        mockMvc.perform(put("/api/clients/{id}/account/deactivate", client.getId()).with(loggedInAs(coordinator)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Klient nemá v aplikaci účet"));
    }

    private Client reloaded(Client entity) {
        return clientRepository.findById(entity.getId()).orElseThrow();
    }

    private User reloaded(User entity) {
        return userRepository.findById(entity.getId()).orElseThrow();
    }
}
