package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.dto.client.ClientDTO;
import cz.zcu.kiv.caretracker.dto.client.ClientRequestDTO;
import cz.zcu.kiv.caretracker.dto.client.ClientTerminateDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.DailyRecordRequestDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanContentDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanContentRequestDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanVersionSummaryDTO;
import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.IndividualPlan;
import cz.zcu.kiv.caretracker.mapper.ClientMapper;
import cz.zcu.kiv.caretracker.service.ClientService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
public class ClientController {
    private static final Logger log = LoggerFactory.getLogger(ClientController.class);

    @Autowired
    private ClientMapper clientMapper;
    @Autowired
    private ClientService clientService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<List<ClientDTO>> getAllClients() {
        log.info("Fetching all clients");
        List<ClientDTO> clients = clientService.getAllClients();

        return ResponseEntity.ok(clients);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<ClientDTO> getClientById(@PathVariable Long id) {
        log.info("Fetching client with id: {}", id);
        return clientService.getClientById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/individual-plan")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<IndividualPlanDTO> getClientIndividualPlan(@PathVariable Long id) {
        log.info("Fetching individual plan for client: {}", id);
        return clientService.getClientIndividualPlan(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/individual-plan/history")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<List<IndividualPlanVersionSummaryDTO>> getClientIndividualPlanHistory(@PathVariable Long id) {
        log.info("Fetching individual plan history for client: {}", id);
        List<IndividualPlanVersionSummaryDTO> history = clientService.getClientIndividualPlanHistory(id);

        return ResponseEntity.ok(history);
    }

    @GetMapping("/{id}/individual-plan/{version}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<IndividualPlanContentDTO> getClientIndividualPlanByVersion(@PathVariable Long id, @PathVariable Integer version) {
        log.info("Fetching individual plan version {} for client: {}", version, id);
        IndividualPlanContentDTO content = clientService.getClientIndividualPlanVersion(id, version);

        return ResponseEntity.ok(content);
    }


    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR')")
    public ResponseEntity<ClientDTO> createClient(@RequestBody ClientRequestDTO dto) {
        log.info("Creating new client: {} {}", dto.getFirstName(), dto.getLastName());
        Client savedClient = clientService.createClient(dto);
        return ResponseEntity.ok(clientMapper.toDTO(savedClient));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR')")
    public ResponseEntity<ClientDTO> updateClient(@PathVariable Long id, @RequestBody ClientRequestDTO dto) {
        log.info("Updating client with id: {}", id);
        Client updatedClient = clientService.updateClient(id, dto);
        return ResponseEntity.ok(clientMapper.toDTO(updatedClient));
    }

    @PutMapping("/{id}/terminate")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR')")
    public ResponseEntity<ClientDTO> terminateClient(@PathVariable Long id, @RequestBody ClientTerminateDTO dto) {
        log.info("Terminating client with id: {}", id);
        Client updatedClient = clientService.terminateClient(id, dto);
        return ResponseEntity.ok(clientMapper.toDTO(updatedClient));
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR')")
    public ResponseEntity<ClientDTO> activateClient(@PathVariable Long id) {
        log.info("Activating client with id: {}", id);
        Client updatedClient = clientService.activateClient(id);
        return ResponseEntity.ok(clientMapper.toDTO(updatedClient));
    }

    @PostMapping("/{id}/individual-plan")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<IndividualPlanDTO> createClientIndividualPlan(@PathVariable Long id, @RequestBody IndividualPlanContentRequestDTO dto) {
        log.info("Creating individual plan for client: {}", id);
        IndividualPlanDTO createdPlan = clientService.createIndividualPlan(id, dto);
        return ResponseEntity.ok(createdPlan);
    }

    @PutMapping("/{id}/individual-plan")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<IndividualPlanDTO> updateClientIndividualPlan(@PathVariable Long id, @RequestBody IndividualPlanContentRequestDTO dto) {
        log.info("Updating individual plan for client: {}", id);
        IndividualPlanDTO updatedPlan = clientService.updateIndividualPlan(id, dto);
        return ResponseEntity.ok(updatedPlan);
    }

    @PostMapping("/{id}/individual-plan/daily-records")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<IndividualPlanDTO> addDailyRecordToIndividualPlan(@PathVariable Long id, @RequestBody DailyRecordRequestDTO dto) {
        log.info("Creating and adding daily record to individual plan for client: {}", id);
        IndividualPlanDTO updatedPlan = clientService.addDailyRecordToIndividualPlan(id, dto);
        return ResponseEntity.ok(updatedPlan);
    }

    @DeleteMapping("/{id}/individual-plan/daily-records/{dailyRecordId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<IndividualPlanDTO> removeDailyRecordFromIndividualPlan(@PathVariable Long id, @PathVariable Long dailyRecordId) {
        log.info("Removing daily record {} from individual plan for client: {}", dailyRecordId, id);
        IndividualPlanDTO updatedPlan = clientService.removeDailyRecordFromIndividualPlan(id, dailyRecordId);
        return ResponseEntity.ok(updatedPlan);
    }
}
