package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.dto.ClientDTO;
import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.mapper.ClientMapper;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ClientService {

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private ClientMapper clientMapper;

    public List<ClientDTO> getAllActiveClients() {
        List<Client> clients = clientRepository.findByActiveTrue();
        return clientMapper.toDTOList(clients);
    }

    public List<ClientDTO> getAllClients() {
        List<Client> clients = clientRepository.findAll();
        return clientMapper.toDTOList(clients);
    }

    public Optional<ClientDTO> getClientById(Long id) {
        return clientRepository.findById(id)
                .map(clientMapper::toDTO);
    }

    public Client createClient(Client client) {
        return clientRepository.save(client);
    }

    public Client updateClient(Long id, Client clientDetails) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        client.setFirstName(clientDetails.getFirstName());
        client.setLastName(clientDetails.getLastName());
        client.setGender(clientDetails.getGender());
        client.setPersonalNumber(clientDetails.getPersonalNumber());
        client.setDateOfBirth(clientDetails.getDateOfBirth());
        client.setDateOfDeath(clientDetails.getDateOfDeath());
        client.setEmail(clientDetails.getEmail());
        client.setPhone(clientDetails.getPhone());
        client.setStreet(clientDetails.getStreet());
        client.setCity(clientDetails.getCity());
        client.setPostalCode(clientDetails.getPostalCode());
        client.setLegallyCompetent(clientDetails.getLegallyCompetent());
        client.setBenefits(clientDetails.getBenefits());
        client.setRelativesContact(clientDetails.getRelativesContact());
        client.setGeneralPractitioner(clientDetails.getGeneralPractitioner());
        client.setNotes(clientDetails.getNotes());
        client.setActive(clientDetails.getActive());
        client.setDepartment(clientDetails.getDepartment());
        client.setCaregiver(clientDetails.getCaregiver());

        return clientRepository.save(client);
    }

    public void deleteClient(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));
        client.setActive(false);
        clientRepository.save(client);
    }
}
