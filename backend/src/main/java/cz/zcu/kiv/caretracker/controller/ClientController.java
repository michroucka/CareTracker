package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.dto.client.ClientDTO;
import cz.zcu.kiv.caretracker.dto.client.ClientRequestDTO;
import cz.zcu.kiv.caretracker.dto.client.ClientTerminateDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.DailyRecordRequestDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanContentDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanContentRequestDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanDTO;
import cz.zcu.kiv.caretracker.dto.individualPlan.IndividualPlanVersionSummaryDTO;
import cz.zcu.kiv.caretracker.dto.picture.PictureDTO;
import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.IndividualPlan;
import cz.zcu.kiv.caretracker.entity.Picture;
import cz.zcu.kiv.caretracker.mapper.ClientMapper;
import cz.zcu.kiv.caretracker.service.ClientService;
import cz.zcu.kiv.caretracker.service.PictureService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/clients")
public class ClientController {
    private static final Logger log = LoggerFactory.getLogger(ClientController.class);

    @Autowired
    private ClientMapper clientMapper;
    @Autowired
    private ClientService clientService;
    @Autowired
    private PictureService pictureService;

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

    // ========== Picture endpoints ==========

    @PostMapping("/{id}/picture")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<PictureDTO> uploadPicture(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
        log.info("Uploading picture for client: {}", id);
        Picture savedPicture = pictureService.savePicture(id, file);

        // Manually map Picture to PictureDTO
        PictureDTO dto = new PictureDTO(
                savedPicture.getId(),
                savedPicture.getContentType(),
                savedPicture.getFilename(),
                savedPicture.getUploadedAt(),
                savedPicture.getSize()
        );

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{id}/picture")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<byte[]> getPicture(@PathVariable Long id) {
        log.info("Fetching picture for client: {}", id);
        Picture picture = pictureService.getPicture(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(picture.getContentType()));
        headers.setContentLength(picture.getSize());
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + picture.getFilename() + "\"");

        return new ResponseEntity<>(picture.getData(), headers, HttpStatus.OK);
    }

    @DeleteMapping("/{id}/picture")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<Void> deletePicture(@PathVariable Long id) {
        log.info("Deleting picture for client: {}", id);
        pictureService.deletePicture(id);
        return ResponseEntity.noContent().build();
    }
}
