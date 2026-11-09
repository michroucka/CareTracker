package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Picture;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.repository.EmployeeRepository;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import cz.zcu.kiv.caretracker.support.AccessScenario;
import cz.zcu.kiv.caretracker.support.AccessScenario.Actor;
import cz.zcu.kiv.caretracker.support.TestImages;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.Map;

import static cz.zcu.kiv.caretracker.support.AccessScenario.Actor.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The signed-in user's own account (Můj účet): profile, credentials, password reset e-mail and own picture.
 * Every user reaches only their own account; the picture belongs to employees, so a client account
 * may not change it and a superadmin (no employee) has none.
 */
class OwnAccountIT extends AbstractIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    private AccessScenario scenario;

    @BeforeEach
    void createScenario() {
        scenario = new AccessScenario(testData);
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void everyUserReadsOwnAccount(Actor actor) throws Exception {
        User account = scenario.user(actor);

        perform(actor, get("/api/user/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(account.getId()))
                .andExpect(jsonPath("$.username").value(account.getUsername()))
                .andExpect(jsonPath("$.role").value(account.getRole().name()));
    }

    @Test
    void clientAccountShowsClientsName() throws Exception {
        perform(CLIENT_ACCOUNT, get("/api/user/me"))
                .andExpect(jsonPath("$.fullName").value(scenario.client.getFullName()));
    }

    @Test
    void superadminAccountHasNoPersonName() throws Exception {
        perform(SUPERADMIN, get("/api/user/me"))
                .andExpect(jsonPath("$.fullName").doesNotExist());
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void updateChangesOnlyOwnCredentials(Actor actor) throws Exception {
        User account = scenario.user(actor);
        User colleague = scenario.user(actor == CAREGIVER ? COORDINATOR : CAREGIVER);
        String newUsername = "novy." + actor.name().toLowerCase();

        perform(actor, put("/api/user/me").contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("username", newUsername, "email", newUsername + "@caretracker.test"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(account.getId()));

        assertThat(userRepository.findById(account.getId())).get()
                .extracting(User::getUsername, User::getEmail)
                .containsExactly(newUsername, newUsername + "@caretracker.test");
        assertThat(userRepository.findById(colleague.getId())).get()
                .extracting(User::getUsername, User::getEmail)
                .containsExactly(colleague.getUsername(), colleague.getEmail());
    }

    @Test
    void cannotTakeUsernameOfAnotherAccount() throws Exception {
        User caregiver = scenario.user(CAREGIVER);
        User admin = scenario.user(ADMIN);

        perform(CAREGIVER, put("/api/user/me").contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("username", admin.getUsername(), "email", caregiver.getEmail()))))
                .andExpect(status().isBadRequest());

        assertThat(userRepository.findById(caregiver.getId())).get()
                .extracting(User::getUsername)
                .isEqualTo(caregiver.getUsername());
    }

    @Test
    void cannotTakeEmailOfAnotherAccount() throws Exception {
        User caregiver = scenario.user(CAREGIVER);
        User admin = scenario.user(ADMIN);

        perform(CAREGIVER, put("/api/user/me").contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("username", caregiver.getUsername(), "email", admin.getEmail()))))
                .andExpect(status().isBadRequest());

        assertThat(userRepository.findById(caregiver.getId())).get()
                .extracting(User::getEmail)
                .isEqualTo(caregiver.getEmail());
    }

    @Test
    void cannotClearOwnUsername() throws Exception {
        User caregiver = scenario.user(CAREGIVER);

        perform(CAREGIVER, put("/api/user/me").contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("email", caregiver.getEmail()))))
                .andExpect(status().isBadRequest());

        assertThat(userRepository.findById(caregiver.getId())).get()
                .extracting(User::getUsername)
                .isEqualTo(caregiver.getUsername());
    }

    @ParameterizedTest
    @EnumSource(Actor.class)
    void passwordResetEmailIsIssuedOnlyForOwnAccount(Actor actor) throws Exception {
        User account = scenario.user(actor);
        User colleague = scenario.user(actor == CAREGIVER ? COORDINATOR : CAREGIVER);

        perform(actor, post("/api/user/forgot-password"))
                .andExpect(status().isOk());

        assertThat(userRepository.findById(account.getId())).get()
                .extracting(User::getActivationToken)
                .isNotNull();
        assertThat(userRepository.findById(colleague.getId())).get()
                .extracting(User::getActivationToken)
                .isNull();
    }

    @ParameterizedTest
    @EnumSource(value = Actor.class, mode = EnumSource.Mode.EXCLUDE, names = {"SUPERADMIN", "CLIENT_ACCOUNT"})
    void employeeUploadsOnlyOwnPicture(Actor actor) throws Exception {
        Employee self = scenario.employee(actor);
        Employee colleague = testData.withPicture(testData.employee(scenario.department, EmployeeRole.CAREGIVER));
        Long colleaguePictureId = pictureIdOf(colleague);

        perform(actor, multipart("/api/user/me/picture").file(photo()))
                .andExpect(status().isOk());

        assertThat(pictureIdOf(self)).isNotNull();
        assertThat(pictureIdOf(colleague)).isEqualTo(colleaguePictureId);
    }

    @ParameterizedTest
    @EnumSource(value = Actor.class, mode = EnumSource.Mode.EXCLUDE, names = {"SUPERADMIN", "CLIENT_ACCOUNT"})
    void employeeDeletesOnlyOwnPicture(Actor actor) throws Exception {
        Employee self = testData.withPicture(scenario.employee(actor));
        Employee colleague = testData.withPicture(testData.employee(scenario.department, EmployeeRole.CAREGIVER));

        perform(actor, delete("/api/user/me/picture"))
                .andExpect(status().isNoContent());

        assertThat(pictureIdOf(self)).isNull();
        assertThat(pictureIdOf(colleague)).isNotNull();
    }

    @Test
    void deletingMissingOwnPictureReturnsNotFound() throws Exception {
        perform(CAREGIVER, delete("/api/user/me/picture"))
                .andExpect(status().isNotFound());
    }

    @Test
    void clientAccountCannotUploadPicture() throws Exception {
        perform(CLIENT_ACCOUNT, multipart("/api/user/me/picture").file(photo()))
                .andExpect(status().isForbidden());
    }

    @Test
    void clientAccountCannotDeletePicture() throws Exception {
        testData.withPicture(scenario.client);

        perform(CLIENT_ACCOUNT, delete("/api/user/me/picture"))
                .andExpect(status().isForbidden());
    }

    @Test
    void superadminWithoutEmployeeHasNoPictureToUpload() throws Exception {
        perform(SUPERADMIN, multipart("/api/user/me/picture").file(photo()))
                .andExpect(status().isNotFound());
    }

    @Test
    void superadminWithoutEmployeeHasNoPictureToDelete() throws Exception {
        perform(SUPERADMIN, delete("/api/user/me/picture"))
                .andExpect(status().isNotFound());
    }

    private ResultActions perform(Actor actor, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(loggedInAs(scenario.user(actor))));
    }

    private Long pictureIdOf(Employee employee) {
        Picture picture = employeeRepository.findById(employee.getId()).orElseThrow().getPicture();
        return picture == null ? null : picture.getId();
    }

    private static MockMultipartFile photo() {
        return new MockMultipartFile("file", "photo.jpg", "image/jpeg", TestImages.jpeg(64, 64));
    }
}
