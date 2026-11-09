package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.entity.Task;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.repository.OrganizationRepository;
import cz.zcu.kiv.caretracker.service.PaymentQrClient.PaymentAccount;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import cz.zcu.kiv.caretracker.support.TestImages;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Receipts for a month (one client, or every client of a department) and the client's payment QR code.
 * The QR image comes from an external API, mocked here; the test checks it is asked for the month's total
 * and the variable symbol, and that a receipt is produced even without a QR code.
 * Every record in these tests is one hour of a task priced 150 Kč per hour.
 */
class ReceiptIT extends AbstractIntegrationTest {

    private static final PaymentAccount ACCOUNT = new PaymentAccount("19", "123456789", "0100");
    private static final LocalDateTime NOVEMBER_FIRST_MORNING = LocalDateTime.of(2026, 11, 1, 0, 0);
    private static final LocalDateTime NOVEMBER_LAST_EVENING = LocalDateTime.of(2026, 11, 30, 23, 30);
    private static final LocalDateTime OCTOBER_LAST_EVENING = LocalDateTime.of(2026, 10, 31, 23, 30);
    private static final LocalDateTime DECEMBER_FIRST_MORNING = LocalDateTime.of(2026, 12, 1, 0, 0);

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private ClientRepository clientRepository;

    private Department department;
    private Employee coordinator;
    private Employee caregiver;
    private Task task;

    @BeforeEach
    void setUp() {
        Organization organization = testData.organization();
        organization.setAccountPrefix(ACCOUNT.prefix());
        organization.setAccountNumber(ACCOUNT.number());
        organization.setBankCode(ACCOUNT.bankCode());
        organizationRepository.save(organization);

        department = testData.department(organization);
        coordinator = testData.employee(department, EmployeeRole.COORDINATOR);
        caregiver = testData.employee(department, EmployeeRole.CAREGIVER);
        task = testData.task(organization);
    }

    private Client client(String lastName, long personalNumber) {
        Client client = testData.client(caregiver);
        client.setLastName(lastName);
        client.setPersonalNumber(personalNumber);
        return clientRepository.save(client);
    }

    private void records(Client client, LocalDateTime... dates) {
        for (LocalDateTime date : dates) {
            testData.performedTask(client, task, date);
        }
    }

    @Test
    void clientReceiptAsksForQrCodeWithTotalOfTheMonthOnly() throws Exception {
        Client client = client("Novák", 123);
        records(client, NOVEMBER_FIRST_MORNING, NOVEMBER_LAST_EVENING, OCTOBER_LAST_EVENING, DECEMBER_FIRST_MORNING);
        when(paymentQrClient.fetchPng(ACCOUNT, 300, "2611000123")).thenReturn(TestImages.jpeg(16, 16));

        byte[] pdf = mockMvc.perform(get("/api/performed-tasks/receipt")
                        .param("clientId", client.getId().toString())
                        .param("month", "11")
                        .param("year", "2026")
                        .with(loggedInAs(caregiver)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andReturn().getResponse().getContentAsByteArray();

        assertThat(pdf).startsWith("%PDF".getBytes());
        verify(paymentQrClient).fetchPng(ACCOUNT, 300, "2611000123");
    }

    @Test
    void clientReceiptIsProducedWithoutQrCode() throws Exception {
        Client client = client("Novák", 123);
        records(client, NOVEMBER_FIRST_MORNING);
        when(paymentQrClient.fetchPng(any(), anyInt(), anyString())).thenReturn(null);

        mockMvc.perform(get("/api/performed-tasks/receipt")
                        .param("clientId", client.getId().toString())
                        .param("month", "11")
                        .param("year", "2026")
                        .with(loggedInAs(caregiver)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF));
    }

    @Test
    void clientReceiptForMonthWithoutRecordsAsksForZeroAmount() throws Exception {
        Client client = client("Novák", 123);

        mockMvc.perform(get("/api/performed-tasks/receipt")
                        .param("clientId", client.getId().toString())
                        .param("month", "11")
                        .param("year", "2026")
                        .with(loggedInAs(caregiver)))
                .andExpect(status().isOk());

        verify(paymentQrClient).fetchPng(ACCOUNT, 0, "2611000123");
    }

    @Test
    void receiptForInvalidMonthIsRejected() throws Exception {
        Client client = client("Novák", 123);

        mockMvc.perform(get("/api/performed-tasks/receipt")
                        .param("clientId", client.getId().toString())
                        .param("month", "13")
                        .param("year", "2026")
                        .with(loggedInAs(caregiver)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Měsíc musí být mezi 1 a 12"));
    }

    @Test
    void departmentReceiptsAskForOneQrCodePerClientWithRecordsInTheMonth() throws Exception {
        Client novak = client("Novák", 101);
        Client dvorak = client("Dvořák", 102);
        Client withoutNovemberRecord = client("Zeman", 103);
        records(novak, NOVEMBER_FIRST_MORNING);
        records(dvorak, NOVEMBER_FIRST_MORNING, NOVEMBER_LAST_EVENING, NOVEMBER_LAST_EVENING);
        records(withoutNovemberRecord, OCTOBER_LAST_EVENING);

        byte[] pdf = mockMvc.perform(get("/api/performed-tasks/receipts")
                        .param("departmentId", department.getId().toString())
                        .param("month", "11")
                        .param("year", "2026")
                        .with(loggedInAs(coordinator)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andReturn().getResponse().getContentAsByteArray();

        assertThat(pdf).startsWith("%PDF".getBytes());
        verify(paymentQrClient).fetchPng(ACCOUNT, 150, "2611000101");
        verify(paymentQrClient).fetchPng(ACCOUNT, 450, "2611000102");
        verifyNoMoreInteractions(paymentQrClient);
    }

    @Test
    void departmentReceiptsForMonthWithoutRecordsAreNotFound() throws Exception {
        records(client("Novák", 101), OCTOBER_LAST_EVENING);

        mockMvc.perform(get("/api/performed-tasks/receipts")
                        .param("departmentId", department.getId().toString())
                        .param("month", "11")
                        .param("year", "2026")
                        .with(loggedInAs(coordinator)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Ve zvoleném měsíci nemá žádný klient střediska záznam"));

        verify(paymentQrClient, never()).fetchPng(any(), anyInt(), anyString());
    }

    @Test
    void clientGetsPaymentQrCodeForTheMonthTotal() throws Exception {
        Client client = client("Novák", 123);
        User account = testData.clientAccount(client);
        records(client, NOVEMBER_FIRST_MORNING, NOVEMBER_LAST_EVENING, DECEMBER_FIRST_MORNING);
        byte[] image = TestImages.jpeg(16, 16);
        when(paymentQrClient.fetchPng(ACCOUNT, 300, "2611000123")).thenReturn(image);

        mockMvc.perform(get("/api/performed-tasks/payment-qr")
                        .param("clientId", client.getId().toString())
                        .param("month", "11")
                        .param("year", "2026")
                        .with(loggedInAs(account)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG))
                .andExpect(content().bytes(image));
    }

    @Test
    void paymentQrCodeIsNoContentWhenUnavailable() throws Exception {
        Client client = client("Novák", 123);
        User account = testData.clientAccount(client);
        records(client, NOVEMBER_FIRST_MORNING);
        when(paymentQrClient.fetchPng(any(), anyInt(), anyString())).thenReturn(null);

        mockMvc.perform(get("/api/performed-tasks/payment-qr")
                        .param("clientId", client.getId().toString())
                        .param("month", "11")
                        .param("year", "2026")
                        .with(loggedInAs(account)))
                .andExpect(status().isNoContent());
    }
}
