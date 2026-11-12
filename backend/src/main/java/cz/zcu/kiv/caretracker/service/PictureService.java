package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.entity.Picture;
import cz.zcu.kiv.caretracker.exception.ResourceNotFoundException;
import cz.zcu.kiv.caretracker.exception.ValidationException;
import cz.zcu.kiv.caretracker.repository.PictureRepository;
import net.coobird.thumbnailator.Thumbnails;
import net.coobird.thumbnailator.geometry.Positions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Iterator;
import java.util.Optional;

/**
 * Turns uploaded images into profile pictures: square JPEGs in two sizes (detail and thumbnail),
 * rotated by their EXIF orientation and stripped of metadata (location, camera).
 * Owners (clients, employees) keep the picture; access checks are done by their services.
 */
@Service
public class PictureService {

    public enum Size { FULL, THUMB }

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    // a decoded image takes 4 bytes per pixel, so the size limit alone does not bound memory
    private static final long MAX_PIXELS = 30_000_000L;
    private static final int FULL_SIZE = 512;
    private static final int THUMB_SIZE = 128;
    private static final double JPEG_QUALITY = 0.85;

    @Autowired
    private PictureRepository pictureRepository;

    /**
     * Validates an upload and resizes it into a new, not yet saved picture.
     *
     * @throws ValidationException if the file is empty, too large or not a readable JPEG, PNG, GIF or WebP image
     */
    public Picture createPicture(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("Soubor je prázdný");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ValidationException("Soubor je příliš velký. Maximální velikost je 5 MB");
        }
        byte[] original = file.getBytes();
        if (detectMimeType(original) == null) {
            throw new ValidationException("Nepovolený formát souboru. Povolené formáty: JPEG, PNG, GIF, WEBP");
        }

        Picture picture = new Picture();
        fillResized(picture, original);
        return picture;
    }

    /**
     * Returns the stored picture in the requested size, loading only that size from the database.
     * A picture saved before resizing was introduced is converted and saved first.
     *
     * @throws ResourceNotFoundException if the picture does not exist (e.g. replaced by a concurrent upload)
     */
    @Transactional
    public byte[] getContent(Long pictureId, Size size) {
        Optional<byte[]> stored = size == Size.THUMB
                ? pictureRepository.findThumbnailById(pictureId)
                : pictureRepository.findResizedDataById(pictureId);
        return stored.orElseGet(() -> getContent(pictureRepository.findById(pictureId)
                .orElseThrow(() -> new ResourceNotFoundException("Obrázek nenalezen")), size));
    }

    /**
     * Returns the image in the requested size. Pictures saved before resizing was introduced
     * (no thumbnail, original upload in {@code data}) are converted in place, so the caller
     * must pass a managed entity inside a read-write transaction.
     */
    byte[] getContent(Picture picture, Size size) {
        if (picture.getThumbnail() == null) {
            fillResized(picture, picture.getData());
        }
        return size == Size.THUMB ? picture.getThumbnail() : picture.getData();
    }

    private void fillResized(Picture picture, byte[] original) {
        BufferedImage image = readUpright(original);
        byte[] full = toSquareJpeg(image, FULL_SIZE);
        picture.setData(full);
        picture.setThumbnail(toSquareJpeg(image, THUMB_SIZE));
        picture.setContentType("image/jpeg");
        picture.setSize((long) full.length);
        picture.setUploadedAt(LocalDateTime.now());
    }

    /** Decodes the image upright (EXIF orientation applied) on a white background, as JPEG has no transparency. */
    private BufferedImage readUpright(byte[] original) {
        checkPixelCount(original);
        try {
            BufferedImage decoded = Thumbnails.of(new ByteArrayInputStream(original)).scale(1.0)
                    // without an explicit type, palette images (GIF, PNG-8) get a default palette and lose their colours
                    .imageType(BufferedImage.TYPE_INT_ARGB)
                    .asBufferedImage();
            BufferedImage opaque = new BufferedImage(decoded.getWidth(), decoded.getHeight(), BufferedImage.TYPE_INT_RGB);
            Graphics2D graphics = opaque.createGraphics();
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, opaque.getWidth(), opaque.getHeight());
            graphics.drawImage(decoded, 0, 0, null);
            graphics.dispose();
            return opaque;
        } catch (IOException e) {
            throw new ValidationException("Obrázek se nepodařilo přečíst");
        }
    }

    /** Reads only the image header, so an oversized image is rejected before it is decoded. */
    private void checkPixelCount(byte[] original) {
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(original))) {
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) {
                throw new ValidationException("Obrázek se nepodařilo přečíst");
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, true, true);
                if ((long) reader.getWidth(0) * reader.getHeight(0) > MAX_PIXELS) {
                    throw new ValidationException("Obrázek má příliš vysoké rozlišení. Maximum je 30 Mpx");
                }
            } finally {
                reader.dispose();
            }
        } catch (IOException e) {
            throw new ValidationException("Obrázek se nepodařilo přečíst");
        }
    }

    private byte[] toSquareJpeg(BufferedImage image, int size) {
        try {
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            Thumbnails.of(image)
                    .size(size, size)
                    .crop(Positions.CENTER)
                    .outputFormat("jpg")
                    .outputQuality(JPEG_QUALITY)
                    .toOutputStream(output);
            return output.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("JPEG encoding failed", e);
        }
    }

    /** Detects the format from magic bytes (the client-supplied Content-Type is trivially forgeable). */
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
}
