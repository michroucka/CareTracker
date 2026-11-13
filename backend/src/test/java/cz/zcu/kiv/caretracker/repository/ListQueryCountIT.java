package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** List endpoints send the same number of SQL statements however many rows they return (no N+1). */
class ListQueryCountIT extends AbstractIntegrationTest {

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    private Department department;
    private Employee coordinator;

    @BeforeEach
    void createDepartment() {
        department = testData.department(testData.organization());
        coordinator = testData.employee(department, EmployeeRole.COORDINATOR);
    }

    @Test
    void clientListDoesNotQueryPerClient() throws Exception {
        addClientsWithAccounts(2);
        long fewClients = statementsFor("/api/clients");

        addClientsWithAccounts(6);
        long moreClients = statementsFor("/api/clients");

        assertThat(moreClients).isEqualTo(fewClients);
    }

    @Test
    void employeeListDoesNotQueryPerEmployee() throws Exception {
        testData.employee(department, EmployeeRole.CAREGIVER);
        long fewEmployees = statementsFor("/api/employees");

        for (int i = 0; i < 6; i++) {
            testData.employee(department, EmployeeRole.CAREGIVER);
        }
        long moreEmployees = statementsFor("/api/employees");

        assertThat(moreEmployees).isEqualTo(fewEmployees);
    }

    /** Each client gets its own caregiver, so neither the clients' nor the caregivers' accounts repeat. */
    private void addClientsWithAccounts(int count) {
        for (int i = 0; i < count; i++) {
            testData.clientAccount(testData.client(testData.employee(department, EmployeeRole.CAREGIVER)));
        }
    }

    private long statementsFor(String url) throws Exception {
        Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        var request = get(url).with(loggedInAs(coordinator));
        statistics.clear();
        mockMvc.perform(request).andExpect(status().isOk());
        return statistics.getPrepareStatementCount();
    }
}
