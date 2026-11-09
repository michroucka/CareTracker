package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.individualPlan.DailyRecordDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.DailyRecordRequestDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanContentDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanContentRequestDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanVersionSummaryDTO;
import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.DailyRecord;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.IndividualPlan;
import cz.zcu.kiv.caretracker.entity.IndividualPlanContent;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.exception.ResourceNotFoundException;
import cz.zcu.kiv.caretracker.exception.ValidationException;
import cz.zcu.kiv.caretracker.repository.DailyRecordRepository;
import cz.zcu.kiv.caretracker.repository.IndividualPlanContentRepository;
import cz.zcu.kiv.caretracker.repository.IndividualPlanRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Individual plan of a client: one plan per client, every change is a new content version, versions stay
 * readable, daily records belong to the plan (not to a version). Who may do what is covered by
 * ClientAccessIT, a terminated client's plan by InactiveClientPlanIT. The clock stands on 9 November 2026.
 */
class IndividualPlanIT extends AbstractIntegrationTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 9, 10, 0);
    private static final LocalDate TODAY = NOW.toLocalDate();

    @Autowired
    private ClientService clientService;

    @Autowired
    private IndividualPlanRepository individualPlanRepository;

    @Autowired
    private IndividualPlanContentRepository individualPlanContentRepository;

    @Autowired
    private DailyRecordRepository dailyRecordRepository;

    private Employee caregiver;
    private Employee colleague;
    private Client client;

    @BeforeEach
    void createClient() {
        clock.fixAt(NOW);
        Department department = testData.department(testData.organization());
        caregiver = testData.employee(department, EmployeeRole.CAREGIVER);
        colleague = testData.employee(department, EmployeeRole.CAREGIVER);
        client = testData.client(caregiver);
        signInAs(caregiver);
    }

    @Test
    void createdPlanHasFirstVersionAsCurrentContent() {
        IndividualPlanDTO plan = clientService.createIndividualPlan(client.getId(), content(TODAY, "Procházky v parku"));

        assertThat(plan.getClientId()).isEqualTo(client.getId());
        assertThat(plan.getCurrentContent().getVersionNumber()).isEqualTo(1);
        assertThat(plan.getCurrentContent().getLikes()).isEqualTo("Procházky v parku");
        assertThat(plan.getCurrentContent().getProcessedDate()).isEqualTo(TODAY);
        assertThat(plan.getDailyRecords()).isNotNull().isEmpty();
        assertThat(storedVersions(plan.getId())).extracting(IndividualPlanContent::getVersionNumber).containsExactly(1);
    }

    @Test
    void clientWithoutPlanHasNone() {
        assertThat(clientService.getClientIndividualPlan(client.getId())).isEmpty();
    }

    @Test
    void secondPlanForSameClientIsRejectedAndFirstStaysUntouched() {
        IndividualPlanDTO first = clientService.createIndividualPlan(client.getId(), content(TODAY, "Procházky v parku"));

        assertThatThrownBy(() -> clientService.createIndividualPlan(client.getId(), content(TODAY, "Něco jiného")))
                .isInstanceOf(ValidationException.class)
                .hasMessage("Individuální plán pro tohoto klienta již existuje");

        assertThat(individualPlanRepository.count()).isEqualTo(1);
        assertThat(storedVersions(first.getId())).singleElement()
                .extracting(IndividualPlanContent::getLikes).isEqualTo("Procházky v parku");
    }

    @Test
    void updateAddsNewVersionAndKeepsPreviousOneReadable() {
        clientService.createIndividualPlan(client.getId(), content(LocalDate.of(2026, 5, 1), "Procházky v parku"));

        IndividualPlanDTO updated = clientService.updateIndividualPlan(client.getId(), content(TODAY, "Čtení novin"));

        assertThat(updated.getCurrentContent().getVersionNumber()).isEqualTo(2);
        assertThat(updated.getCurrentContent().getLikes()).isEqualTo("Čtení novin");
        assertThat(storedVersions(updated.getId())).extracting(IndividualPlanContent::getVersionNumber).containsExactly(2, 1);

        IndividualPlanContentDTO firstVersion = clientService.getClientIndividualPlanVersion(client.getId(), 1);
        assertThat(firstVersion.getLikes()).isEqualTo("Procházky v parku");
        assertThat(firstVersion.getProcessedDate()).isEqualTo(LocalDate.of(2026, 5, 1));
        assertThat(clientService.getClientIndividualPlan(client.getId()).orElseThrow().getCurrentContent().getVersionNumber())
                .isEqualTo(2);
    }

    @Test
    void historyListsAllVersionsNewestFirst() {
        clientService.createIndividualPlan(client.getId(), content(LocalDate.of(2025, 11, 1), "A"));
        clientService.updateIndividualPlan(client.getId(), content(LocalDate.of(2026, 5, 1), "B"));
        clientService.updateIndividualPlan(client.getId(), content(TODAY, "C"));

        List<IndividualPlanVersionSummaryDTO> history = clientService.getClientIndividualPlanHistory(client.getId());

        assertThat(history).extracting(IndividualPlanVersionSummaryDTO::getVersionNumber).containsExactly(3, 2, 1);
        assertThat(history).extracting(IndividualPlanVersionSummaryDTO::getProcessedDate)
                .containsExactly(TODAY, LocalDate.of(2026, 5, 1), LocalDate.of(2025, 11, 1));
    }

    @Test
    void historyContainsPlannedUpdateDateOfEachVersion() {
        clientService.createIndividualPlan(client.getId(), content(TODAY, "A"));

        assertThat(clientService.getClientIndividualPlanHistory(client.getId()))
                .extracting(IndividualPlanVersionSummaryDTO::getPlannedUpdateDate)
                .containsExactly(TODAY.plusMonths(6));
    }

    @Test
    void unknownVersionIsNotFound() {
        clientService.createIndividualPlan(client.getId(), content(TODAY, "A"));

        assertThatThrownBy(() -> clientService.getClientIndividualPlanVersion(client.getId(), 2))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Verze 2 nebyla nalezena");
    }

    @Test
    void planMustExistBeforeUpdateOrHistory() {
        assertThatThrownBy(() -> clientService.updateIndividualPlan(client.getId(), content(TODAY, "A")))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> clientService.getClientIndividualPlanHistory(client.getId()))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThat(individualPlanRepository.count()).isZero();
    }

    @Test
    void colleagueCannotAddVersionToPlanOfAnotherCaregiversClient() {
        IndividualPlan plan = testData.individualPlan(client);
        signInAs(colleague);

        assertThatThrownBy(() -> clientService.updateIndividualPlan(client.getId(), content(TODAY, "A")))
                .isInstanceOf(SecurityException.class);

        assertThat(storedVersions(plan.getId())).hasSize(1);
    }

    @Test
    void plannedUpdateMustFollowProcessedDate() {
        IndividualPlanContentRequestDTO updateBeforeProcessing = content(TODAY, "A");
        updateBeforeProcessing.setPlannedUpdateDate(TODAY.minusDays(1));

        assertThatThrownBy(() -> clientService.createIndividualPlan(client.getId(), updateBeforeProcessing))
                .isInstanceOf(ValidationException.class);
        assertThat(individualPlanRepository.count()).isZero();
    }

    @Test
    void dailyRecordIsAuthoredBySignedInEmployee() {
        IndividualPlan plan = testData.individualPlan(client);

        IndividualPlanDTO updated = clientService.addDailyRecordToIndividualPlan(client.getId(), dailyRecord(TODAY, "Nákup a úklid"));

        DailyRecordDTO record = updated.getDailyRecords().getFirst();
        assertThat(record.getContent()).isEqualTo("Nákup a úklid");
        assertThat(record.getDate()).isEqualTo(TODAY);
        assertThat(record.getCreatedBy().getId()).isEqualTo(caregiver.getId());

        DailyRecord stored = dailyRecordRepository.findById(record.getId()).orElseThrow();
        assertThat(stored.getIndividualPlan().getId()).isEqualTo(plan.getId());
        assertThat(stored.getCreatedBy().getId()).isEqualTo(caregiver.getId());
    }

    @Test
    void colleagueFromSameDepartmentMayAddDailyRecord() {
        testData.individualPlan(client);
        signInAs(colleague);

        IndividualPlanDTO updated = clientService.addDailyRecordToIndividualPlan(client.getId(), dailyRecord(TODAY, "Zástup"));

        assertThat(updated.getDailyRecords()).singleElement()
                .satisfies(record -> assertThat(record.getCreatedBy().getId()).isEqualTo(colleague.getId()));
    }

    @Test
    void dailyRecordsAreSharedByAllVersionsAndListedNewestFirst() {
        testData.individualPlan(client);
        clientService.addDailyRecordToIndividualPlan(client.getId(), dailyRecord(LocalDate.of(2026, 11, 2), "Starší"));
        clientService.addDailyRecordToIndividualPlan(client.getId(), dailyRecord(LocalDate.of(2026, 11, 6), "Novější"));

        clientService.updateIndividualPlan(client.getId(), content(TODAY, "Nová verze"));

        IndividualPlanDTO plan = clientService.getClientIndividualPlan(client.getId()).orElseThrow();
        assertThat(plan.getCurrentContent().getVersionNumber()).isEqualTo(2);
        assertThat(plan.getDailyRecords()).extracting(DailyRecordDTO::getContent).containsExactly("Novější", "Starší");
    }

    @Test
    void removedDailyRecordIsDeletedFromDatabase() {
        IndividualPlan plan = testData.individualPlan(client);
        DailyRecord removed = testData.dailyRecord(plan, caregiver);
        DailyRecord kept = testData.dailyRecord(plan, colleague);

        IndividualPlanDTO updated = clientService.removeDailyRecordFromIndividualPlan(client.getId(), removed.getId());

        assertThat(updated.getDailyRecords()).extracting(DailyRecordDTO::getId).containsExactly(kept.getId());
        assertThat(dailyRecordRepository.existsById(removed.getId())).isFalse();
        assertThat(dailyRecordRepository.existsById(kept.getId())).isTrue();
    }

    @Test
    void clientsOwnCaregiverCannotRemoveColleaguesDailyRecord() {
        IndividualPlan plan = testData.individualPlan(client);
        DailyRecord colleaguesRecord = testData.dailyRecord(plan, colleague);

        assertThatThrownBy(() -> clientService.removeDailyRecordFromIndividualPlan(client.getId(), colleaguesRecord.getId()))
                .isInstanceOf(SecurityException.class)
                .hasMessage("Denní záznam může smazat jen jeho autor nebo administrátor");

        assertThat(dailyRecordRepository.existsById(colleaguesRecord.getId())).isTrue();
    }

    @Test
    void dailyRecordOfAnotherClientCannotBeRemovedThroughThisClient() {
        testData.individualPlan(client);
        Client otherClient = testData.client(caregiver);
        DailyRecord otherClientsRecord = testData.dailyRecord(testData.individualPlan(otherClient), caregiver);

        assertThatThrownBy(() -> clientService.removeDailyRecordFromIndividualPlan(client.getId(), otherClientsRecord.getId()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Denní záznam nebyl nalezen");

        assertThat(dailyRecordRepository.existsById(otherClientsRecord.getId())).isTrue();
    }

    @Test
    void dailyRecordDateInFutureIsRejected() {
        testData.individualPlan(client);

        assertThatThrownBy(() -> clientService.addDailyRecordToIndividualPlan(client.getId(), dailyRecord(TODAY.plusDays(1), "Zítra")))
                .isInstanceOf(ValidationException.class);
        assertThat(dailyRecordRepository.count()).isZero();
    }

    @Test
    void blankDailyRecordIsRejected() {
        testData.individualPlan(client);

        assertThatThrownBy(() -> clientService.addDailyRecordToIndividualPlan(client.getId(), dailyRecord(TODAY, "   ")))
                .isInstanceOf(ValidationException.class);
        assertThat(dailyRecordRepository.count()).isZero();
    }

    private List<IndividualPlanContent> storedVersions(Long planId) {
        return individualPlanContentRepository.findByIndividualPlanIdOrderByVersionNumberDesc(planId);
    }

    /** Plan content processed on the given date, due for an update six months later. */
    private static IndividualPlanContentRequestDTO content(LocalDate processedDate, String likes) {
        IndividualPlanContentRequestDTO content = new IndividualPlanContentRequestDTO();
        content.setProcessedDate(processedDate);
        content.setPlannedUpdateDate(processedDate.plusMonths(6));
        content.setLikes(likes);
        return content;
    }

    private static DailyRecordRequestDTO dailyRecord(LocalDate date, String content) {
        return new DailyRecordRequestDTO(date, content);
    }
}
