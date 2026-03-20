package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.dto.organization.OrganizationDTO;
import cz.zcu.kiv.caretracker.dto.organization.OrganizationRequestDTO;
import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.mapper.OrganizationMapper;
import cz.zcu.kiv.caretracker.service.OrganizationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {
    private static final Logger log = LoggerFactory.getLogger(OrganizationController.class);

    @Autowired
    private OrganizationService organizationService;
    @Autowired
    private OrganizationMapper organizationMapper;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<List<OrganizationDTO>> getOrganizations(@RequestParam(required = false) Boolean status) {
        log.info("Fetching organizations");
        List<OrganizationDTO> organizations = organizationService.getOrganizations(status);

        return ResponseEntity.ok(organizations);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR', 'CAREGIVER')")
    public ResponseEntity<OrganizationDTO> getOrganizationById(@PathVariable Long id) {
        log.info("Fetching organization with id: {}", id);
        return organizationService.getOrganizationById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<OrganizationDTO> createOrganization(@RequestBody OrganizationRequestDTO dto) {
        log.info("Creating new organization: {}", dto.getName());
        Organization savedOrganization = organizationService.createOrganization(dto);
        return ResponseEntity.ok(organizationMapper.toDTO(savedOrganization));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<OrganizationDTO> updateOrganization(@PathVariable Long id, @RequestBody OrganizationRequestDTO dto) {
        log.info("Updating organization with id: {}", id);
        Organization updatedOrganization = organizationService.updateOrganization(id, dto);
        return ResponseEntity.ok(organizationMapper.toDTO(updatedOrganization));
    }

    @PutMapping("/{id}/terminate")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<OrganizationDTO> terminateOrganization(@PathVariable Long id) {
        log.info("Terminating organization with id: {}", id);
        Organization updatedOrganization = organizationService.terminateOrganization(id);
        return ResponseEntity.ok(organizationMapper.toDTO(updatedOrganization));
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<OrganizationDTO> activateOrganization(@PathVariable Long id) {
        log.info("Activating organization with id: {}", id);
        Organization updatedOrganization = organizationService.activateOrganization(id);
        return ResponseEntity.ok(organizationMapper.toDTO(updatedOrganization));
    }
}
