package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.dto.ClientDTO;
import cz.zcu.kiv.caretracker.dto.ClientRequestDTO;
import cz.zcu.kiv.caretracker.entity.Client;
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
        log.info("Fetching all active clients");
        List<ClientDTO> clients = clientService.getAllActiveClients();

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

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR')")
    public ResponseEntity<ClientDTO> createClient(@RequestBody ClientRequestDTO dto) {
        log.info("Creating new client: {} {}", dto.getFirstName(), dto.getLastName());
        Client savedClient = clientService.createClient(dto);
        return ResponseEntity.ok(clientMapper.toDTO(savedClient));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR')")
    public ResponseEntity<Client> updateClient(@PathVariable Long id, @RequestBody Client client) {
        log.info("Updating client with id: {}", id);
        Client updatedClient = clientService.updateClient(id, client);
        return ResponseEntity.ok(updatedClient);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COORDINATOR')")
    public ResponseEntity<Void> deleteClient(@PathVariable Long id) {
        log.info("Deleting client with id: {}", id);
        clientService.deleteClient(id);
        return ResponseEntity.noContent().build();
    }




}
