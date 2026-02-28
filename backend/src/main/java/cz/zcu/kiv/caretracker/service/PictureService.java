package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Picture;
import cz.zcu.kiv.caretracker.exception.ResourceNotFoundException;
import cz.zcu.kiv.caretracker.exception.ValidationException;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.repository.PictureRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
public class PictureService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp"
    );

    @Autowired
    private PictureRepository pictureRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Transactional
    public Picture savePicture(Long clientId, MultipartFile file) throws IOException {
        // Validace souboru
        validateFile(file);

        // Kontrola existence klienta
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Klient nenalezen"));

        // Zkus najít existující obrázek
        Picture picture = pictureRepository.findByClientId(clientId)
                .orElse(null);

        if (picture != null) {
            // Aktualizuj existující záznam
            picture.setData(file.getBytes());
            picture.setContentType(file.getContentType());
            picture.setFilename(file.getOriginalFilename());
            picture.setSize(file.getSize());
            picture.setUploadedAt(LocalDateTime.now());
        } else {
            // Vytvoř nový záznam
            picture = Picture.builder()
                    .client(client)
                    .data(file.getBytes())
                    .contentType(file.getContentType())
                    .filename(file.getOriginalFilename())
                    .size(file.getSize())
                    .uploadedAt(LocalDateTime.now())
                    .build();
        }

        return pictureRepository.save(picture);
    }

    @Transactional(readOnly = true)
    public Picture getPicture(Long clientId) {
        return pictureRepository.findByClientId(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Obrázek nenalezen"));
    }

    @Transactional
    public void deletePicture(Long clientId) {
        if (!pictureRepository.existsByClientId(clientId)) {
            throw new ResourceNotFoundException("Obrázek nenalezen");
        }
        pictureRepository.deleteByClientId(clientId);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("Soubor je prázdný");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ValidationException("Soubor je příliš velký. Maximální velikost je 5 MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new ValidationException("Nepovolený formát souboru. Povolené formáty: JPEG, PNG, GIF, WEBP");
        }
    }
}
