package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.config.SecurityConfig;
import cz.zcu.kiv.caretracker.exception.ValidationException;
import cz.zcu.kiv.caretracker.mapper.ClientMapper;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import cz.zcu.kiv.caretracker.security.handler.CustomAuthenticationFailureHandler;
import cz.zcu.kiv.caretracker.security.handler.CustomAuthenticationSuccessHandler;
import cz.zcu.kiv.caretracker.service.ClientService;
import cz.zcu.kiv.caretracker.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.security.web.authentication.rememberme.PersistentTokenRepository;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultMatcher;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Invalid client requests end with a JSON error whose {@code message} is Czech and readable for the user,
 * never with Spring or Jackson internals. Only the web layer runs here (no database), with the real
 * security configuration and the service mocked.
 */
@WebMvcTest(controllers = ClientController.class, properties = "app.remember-me.key=test-remember-me-key")
@Import({SecurityConfig.class, CustomAuthenticationSuccessHandler.class, CustomAuthenticationFailureHandler.class})
@WithMockUser(roles = "ADMIN")
class ClientRequestErrorsTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ClientService clientService;
    @MockitoBean
    private ClientMapper clientMapper;
    @MockitoBean
    private UserService userService;
    @MockitoBean
    private UserRepository userRepository;
    @MockitoBean
    private UserDetailsService userDetailsService;
    @MockitoBean
    private PersistentTokenRepository rememberMeTokenRepository;

    /** Every request carries a valid CSRF token like the frontend sends, so only the tested error shows. */
    private ResultActions perform(AbstractMockHttpServletRequestBuilder<?> request) throws Exception {
        return mockMvc.perform(request.with(csrf()));
    }

    @Test
    void malformedJsonIsRejected() throws Exception {
        perform(post("/api/clients").contentType(MediaType.APPLICATION_JSON).content("{\"firstName\": \"Marie\","))
                .andExpect(error(400, "Neplatný formát dat v požadavku"));

        verifyNoInteractions(clientService);
    }

    @Test
    void missingBodyIsRejected() throws Exception {
        perform(post("/api/clients").contentType(MediaType.APPLICATION_JSON))
                .andExpect(error(400, "Neplatný formát dat v požadavku"));
    }

    @Test
    void textInNumberFieldNamesTheField() throws Exception {
        perform(post("/api/clients").contentType(MediaType.APPLICATION_JSON).content("{\"personalNumber\": \"abc\"}"))
                .andExpect(error(400, "Neplatná hodnota pole 'personalNumber'"));
    }

    @Test
    void invalidDateNamesTheField() throws Exception {
        perform(post("/api/clients").contentType(MediaType.APPLICATION_JSON).content("{\"dateOfBirth\": \"12. 3. 1948\"}"))
                .andExpect(error(400, "Neplatná hodnota pole 'dateOfBirth'"));
    }

    @Test
    void invalidListItemNamesTheFieldAndPosition() throws Exception {
        perform(post("/api/clients").contentType(MediaType.APPLICATION_JSON).content("{\"taskIds\": [1, \"x\"]}"))
                .andExpect(error(400, "Neplatná hodnota pole 'taskIds[1]'"));
    }

    @Test
    void objectInsteadOfTextNamesTheField() throws Exception {
        perform(post("/api/clients").contentType(MediaType.APPLICATION_JSON).content("{\"firstName\": {\"a\": 1}}"))
                .andExpect(error(400, "Neplatná hodnota pole 'firstName'"));
    }

    /** The request has no bean validation ({@code @Valid}); required fields are checked by the service. */
    @Test
    void missingRequiredFieldReportedByServiceKeepsItsMessage() throws Exception {
        when(clientService.createClient(any())).thenThrow(new ValidationException("Jméno je povinné"));

        perform(post("/api/clients").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(error(400, "Jméno je povinné"));
    }

    /** Enum fields of the request are plain strings converted by {@code Enum.valueOf} in the mapper. */
    @Test
    void unknownEnumValueDoesNotLeakEnumClassName() throws Exception {
        when(clientService.createClient(any()))
                .thenThrow(new IllegalArgumentException("No enum constant cz.zcu.kiv.caretracker.enums.Gender.ALIEN"));

        perform(post("/api/clients").contentType(MediaType.APPLICATION_JSON).content("{\"gender\": \"ALIEN\"}"))
                .andExpect(error(400, "Neplatná hodnota v požadavku"));
    }

    @Test
    void textAsPathIdIsRejected() throws Exception {
        perform(get("/api/clients/abc"))
                .andExpect(error(400, "Neplatná hodnota parametru 'id'"));

        verifyNoInteractions(clientService);
    }

    @Test
    void invalidQueryParameterIsRejected() throws Exception {
        perform(get("/api/clients").param("status", "maybe"))
                .andExpect(error(400, "Neplatná hodnota parametru 'status'"));
    }

    @Test
    void missingRequiredQueryParameterIsRejected() throws Exception {
        perform(post("/api/clients/1/account/create"))
                .andExpect(error(400, "Chybí povinný parametr 'email'"));

        verifyNoInteractions(userService);
    }

    @Test
    void pictureUploadWithoutFileIsRejected() throws Exception {
        perform(multipart("/api/clients/1/picture"))
                .andExpect(error(400, "Chybí povinná část požadavku 'file'"));
    }

    @Test
    void pictureUploadThatIsNotMultipartIsRejected() throws Exception {
        perform(post("/api/clients/1/picture").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(error(400, "Požadavek se souborem se nepodařilo zpracovat"));
    }

    @Test
    void unknownAddressReturnsNotFound() throws Exception {
        perform(get("/api/client/1"))
                .andExpect(error(404, "Požadovaná adresa neexistuje"));
    }

    @Test
    void unsupportedMethodReturnsMethodNotAllowed() throws Exception {
        perform(delete("/api/clients"))
                .andExpect(error(405, "Metoda DELETE není pro tuto adresu podporována"));
    }

    @Test
    void nonJsonBodyReturnsUnsupportedMediaType() throws Exception {
        perform(post("/api/clients").contentType(MediaType.TEXT_PLAIN).content("Marie Nová"))
                .andExpect(error(415, "Nepodporovaný formát obsahu požadavku"));
    }

    @Test
    void unexpectedServiceErrorIsAGeneric500() throws Exception {
        when(clientService.createClient(any())).thenThrow(
                new NullPointerException("Cannot invoke \"java.util.List.iterator()\" because \"taskIds\" is null"));

        perform(post("/api/clients").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(error(500, "Nastala neočekávaná chyba na serveru"));
    }

    @Test
    @WithMockUser(roles = "CAREGIVER")
    void roleWithoutWriteAccessIsForbiddenBeforeBodyIsUsed() throws Exception {
        perform(post("/api/clients").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(error(403, "Nemáte oprávnění k této operaci"));

        verifyNoInteractions(clientService);
    }


    private static ResultMatcher error(int status, String message) {
        return result -> {
            status().is(status).match(result);
            jsonPath("$.status").value(status).match(result);
            jsonPath("$.message").value(message).match(result);
            assertThat(result.getResponse().getContentAsString())
                    .doesNotContain("java.", "cz.zcu", "springframework", "jackson", "Exception", "Cannot invoke", "\tat ");
        };
    }
}
