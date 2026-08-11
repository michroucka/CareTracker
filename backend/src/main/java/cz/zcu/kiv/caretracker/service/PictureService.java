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
import java.util.List;

/**
 * Manages client profile pictures stored as binary BLOBs in the database.
 * Each client may have at most one picture; uploading a new file replaces the existing one.
 */
@Service
public class PictureService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );

    @Autowired
    private PictureRepository pictureRepository;

    @Autowired
    private ClientRepository clientRepository;

    /**
     * Saves or replaces a client's profile picture.
     * If a picture already exists for the client, its binary data is updated in place.
     *
     * @param clientId the client ID
     * @param file the uploaded image file
     * @return the persisted picture entity
     * @throws ValidationException if the file is empty, too large, or has an unsupported content type
     * @throws ResourceNotFoundException if the client is not found
     */
    @Transactional
    public Picture savePicture(Long clientId, MultipartFile file) throws IOException {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Klient nenalezen"));

        Picture picture = pictureRepository.findByClientId(clientId).orElse(null);

        byte[] data = file.getBytes();
        String detectedContentType = validateFile(file, data);
        String safeFilename = sanitizeFilename(file.getOriginalFilename());

        if (picture != null) {
            picture.setData(data);
            picture.setContentType(detectedContentType);
            picture.setFilename(safeFilename);
            picture.setSize(file.getSize());
            picture.setUploadedAt(LocalDateTime.now());
        } else {
            picture = Picture.builder()
                    .client(client)
                    .data(data)
                    .contentType(detectedContentType)
                    .filename(safeFilename)
                    .size(file.getSize())
                    .uploadedAt(LocalDateTime.now())
                    .build();
        }

        return pictureRepository.save(picture);
    }

    /**
     * Returns the profile picture for a client.
     *
     * @param clientId the client ID
     * @return the picture entity containing the binary data
     * @throws ResourceNotFoundException if no picture exists for this client
     */
    @Transactional(readOnly = true)
    public Picture getPicture(Long clientId) {
        return pictureRepository.findByClientId(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Obrázek nenalezen"));
    }

    /**
     * Deletes the profile picture for a client.
     *
     * @param clientId the client ID
     * @throws ResourceNotFoundException if no picture exists for this client
     */
    @Transactional
    public void deletePicture(Long clientId) {
        if (!pictureRepository.existsByClientId(clientId)) {
            throw new ResourceNotFoundException("Obrázek nenalezen");
        }
        pictureRepository.deleteByClientId(clientId);
    }

    /**
     * Validates size and detects the real MIME type from magic bytes (ignores the
     * client-supplied Content-Type header, which is trivially forgeable).
     *
     * @return the detected MIME type to store
     * @throws ValidationException if the file is empty, too large, or not a recognised image format
     */
    private String validateFile(MultipartFile file, byte[] data) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("Soubor je prázdný");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ValidationException("Soubor je příliš velký. Maximální velikost je 5 MB");
        }

        String detected = detectMimeType(data);
        if (detected == null) {
            throw new ValidationException("Nepovolený formát souboru. Povolené formáty: JPEG, PNG, GIF, WEBP");
        }
        return detected;
    }

    /** Detects MIME type from file magic bytes, returns null if not a supported image. */
    private String detectMimeType(byte[] data) {
        if (data.length >= 3
                && (data[0] & 0xFF) == 0xFF
                && (data[1] & 0xFF) == 0xD8
                && (data[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (data.length >= 8
                && (data[0] & 0xFF) == 0x89
                && data[1] == 'P' && data[2] == 'N' && data[3] == 'G'
                && data[4] == '\r' && data[5] == '\n'
                && (data[6] & 0xFF) == 0x1A && data[7] == '\n') {
            return "image/png";
        }
        if (data.length >= 6
                && data[0] == 'G' && data[1] == 'I' && data[2] == 'F'
                && data[3] == '8'
                && (data[4] == '7' || data[4] == '9')
                && data[5] == 'a') {
            return "image/gif";
        }
        if (data.length >= 12
                && data[0] == 'R' && data[1] == 'I' && data[2] == 'F' && data[3] == 'F'
                && data[8] == 'W' && data[9] == 'E' && data[10] == 'B' && data[11] == 'P') {
            return "image/webp";
        }
        return null;
    }

    /** Strips path separators and header-injection characters from the original filename. */
    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) return "image";
        String name = filename.replaceAll("[/\\\\]", "_").replaceAll("[\\r\\n\"']", "");
        return name.length() > 255 ? name.substring(0, 255) : name;
    }
}
