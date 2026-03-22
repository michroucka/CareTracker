package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.dto.client.ClientShortDTO;
import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.mapper.ClientMapper;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.service.ClientService;
import cz.zcu.kiv.caretracker.service.MyUserDetailsService;
import cz.zcu.kiv.caretracker.service.PictureService;
import cz.zcu.kiv.caretracker.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ClientController.class)
class ClientControllerTest {

    @TestConfiguration
    @EnableMethodSecurity
    static class TestMethodSecurityConfig {}

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ClientService clientService;
    @MockBean
    private PictureService pictureService;
    @MockBean
    private UserService userService;
    @MockBean
    private ClientRepository clientRepository;
    @MockBean
    private ClientMapper clientMapper;
    @MockBean
    private MyUserDetailsService myUserDetailsService;

    @Test
    void getClients_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/clients"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getClients_asAdmin_returns200WithEmptyList() throws Exception {
        when(clientService.getClients(any(), any(), any(), any())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/clients"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getClientById_notFound_returns404() throws Exception {
        when(clientService.getClientById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/clients/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "CAREGIVER")
    void createClient_asCaregiver_returns403() throws Exception {
        mockMvc.perform(post("/api/clients")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createClient_asAdmin_returns200() throws Exception {
        Client client = new Client();
        ClientShortDTO dto = new ClientShortDTO();
        dto.setId(1L);
        dto.setFirstName("Jan");
        dto.setLastName("Novák");

        when(clientService.createClient(any())).thenReturn(client);
        when(clientMapper.toShortDTO(any(Client.class))).thenReturn(dto);

        mockMvc.perform(post("/api/clients")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk());
    }
}
