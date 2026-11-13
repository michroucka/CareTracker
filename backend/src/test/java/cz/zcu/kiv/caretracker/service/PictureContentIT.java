package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.Picture;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.exception.ResourceNotFoundException;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.repository.EmployeeRepository;
import cz.zcu.kiv.caretracker.repository.PictureRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import cz.zcu.kiv.caretracker.support.TestImages;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.awt.image.BufferedImage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Picture endpoints serve the stored size the request asks for; pictures saved before resizing are converted at startup. */
class PictureContentIT extends AbstractIntegrationTest {

    private static final byte[] FULL = TestImages.jpeg(32, 32);
    private static final byte[] THUMBNAIL = TestImages.jpeg(8, 8);

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PictureRepository pictureRepository;

    @Autowired
    private PictureService pictureService;

    @Autowired
    private LegacyPictureResizer legacyPictureResizer;

    private Employee caregiver;
    private Client client;

    @BeforeEach
    void createClient() {
        caregiver = testData.employee(testData.department(testData.organization()), EmployeeRole.CAREGIVER);
        client = testData.client(caregiver);
    }

    @Test
    void clientPictureIsServedInTheRequestedSize() throws Exception {
        client.setPicture(picture(FULL, THUMBNAIL));
        clientRepository.save(client);

        assertThat(picture("/api/clients/" + client.getId() + "/picture?size=thumb")).isEqualTo(THUMBNAIL);
        assertThat(picture("/api/clients/" + client.getId() + "/picture")).isEqualTo(FULL);
    }

    @Test
    void employeePictureIsServedInTheRequestedSize() throws Exception {
        caregiver.setPicture(picture(FULL, THUMBNAIL));
        employeeRepository.save(caregiver);

        assertThat(picture("/api/employees/" + caregiver.getId() + "/picture?size=thumb")).isEqualTo(THUMBNAIL);
        assertThat(picture("/api/employees/" + caregiver.getId() + "/picture")).isEqualTo(FULL);
    }

    @Test
    void pictureSavedBeforeResizingIsConvertedAtStartupAndServed() throws Exception {
        client.setPicture(picture(TestImages.jpeg(1000, 600), null));
        Long pictureId = clientRepository.save(client).getPictureId();

        legacyPictureResizer.resizeAll();

        Picture stored = pictureRepository.findById(pictureId).orElseThrow();
        assertSquare(stored.getData(), 512);
        assertSquare(stored.getThumbnail(), 128);
        assertThat(picture("/api/clients/" + client.getId() + "/picture")).isEqualTo(stored.getData());
        assertThat(picture("/api/clients/" + client.getId() + "/picture?size=thumb")).isEqualTo(stored.getThumbnail());
    }

    @Test
    void unreadablePictureSavedBeforeResizingStaysAsItIsAndIsNotServed() throws Exception {
        byte[] unreadable = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0, 1, 2};
        client.setPicture(picture(unreadable, null));
        Long pictureId = clientRepository.save(client).getPictureId();
        Client readable = testData.client(caregiver);
        readable.setPicture(picture(TestImages.jpeg(300, 300), null));
        Long readablePictureId = clientRepository.save(readable).getPictureId();

        legacyPictureResizer.resizeAll();

        assertThat(pictureRepository.findById(pictureId).orElseThrow().getData()).isEqualTo(unreadable);
        assertThat(pictureRepository.findById(readablePictureId).orElseThrow().getThumbnail()).isNotNull();
        mockMvc.perform(get("/api/clients/" + client.getId() + "/picture").with(loggedInAs(caregiver.getUser())))
                .andExpect(status().isNotFound());
    }

    @Test
    void pictureDeletedInTheMeantimeIsNotFound() {
        Long deletedPictureId = pictureRepository.save(picture(FULL, THUMBNAIL)).getId();
        pictureRepository.deleteById(deletedPictureId);

        assertThatThrownBy(() -> pictureService.getContent(deletedPictureId, PictureService.Size.THUMB))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private static Picture picture(byte[] data, byte[] thumbnail) {
        Picture picture = new Picture();
        picture.setData(data);
        picture.setThumbnail(thumbnail);
        picture.setContentType("image/jpeg");
        picture.setSize((long) data.length);
        return picture;
    }

    private byte[] picture(String url) throws Exception {
        return mockMvc.perform(get(url).with(loggedInAs(caregiver.getUser())))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();
    }

    private static void assertSquare(byte[] jpeg, int size) {
        BufferedImage image = TestImages.decode(jpeg);
        assertThat(image.getWidth()).isEqualTo(size);
        assertThat(image.getHeight()).isEqualTo(size);
    }
}
