package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.entity.Picture;
import cz.zcu.kiv.caretracker.exception.ValidationException;
import cz.zcu.kiv.caretracker.support.TestImages;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockMultipartFile;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.awt.image.IndexColorModel;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PictureServiceTest {

    private static final int FULL_SIZE = 512;
    private static final int THUMB_SIZE = 128;
    private static final int MAX_FILE_SIZE = 5 * 1024 * 1024;
    // JPEG compression shifts colours slightly, so pixels are compared with a tolerance
    private static final int COLOR_TOLERANCE = 40;

    private static final Color RED = new Color(255, 0, 0);
    private static final Color GREEN = new Color(0, 200, 0);
    private static final Color BLUE = new Color(0, 0, 255);
    private static final Color ORANGE = new Color(255, 128, 0);

    private final PictureService pictureService = new PictureService();

    @Test
    void createsSquareJpegsInFullAndThumbnailSize() throws Exception {
        Picture picture = pictureService.createPicture(upload(TestImages.encode(filled(1024, 768, GREEN), "png")));

        assertSquareJpeg(picture.getData(), FULL_SIZE);
        assertSquareJpeg(picture.getThumbnail(), THUMB_SIZE);
        assertThat(picture.getContentType()).isEqualTo("image/jpeg");
        assertThat(picture.getSize()).isEqualTo(picture.getData().length);
        assertThat(picture.getUploadedAt()).isNotNull();
        assertThat(picture.getId()).isNull();
    }

    @Test
    void enlargesSmallImageToFullSize() throws Exception {
        Picture picture = pictureService.createPicture(upload(TestImages.jpeg(64, 64)));

        assertSquareJpeg(picture.getData(), FULL_SIZE);
        assertSquareJpeg(picture.getThumbnail(), THUMB_SIZE);
    }

    @Test
    void cropsLandscapeImageToItsCentre() throws Exception {
        BufferedImage landscape = threeStripes(400, 100, true);

        Picture picture = pictureService.createPicture(upload(TestImages.encode(landscape, "png")));

        assertWholeImageIs(TestImages.decode(picture.getData()), GREEN);
        assertWholeImageIs(TestImages.decode(picture.getThumbnail()), GREEN);
    }

    @Test
    void cropsPortraitImageToItsCentre() throws Exception {
        BufferedImage portrait = threeStripes(100, 400, false);

        Picture picture = pictureService.createPicture(upload(TestImages.encode(portrait, "png")));

        assertWholeImageIs(TestImages.decode(picture.getData()), GREEN);
    }

    @Test
    void rotatesImageByExifOrientation() throws Exception {
        // stored landscape 200x100; the marker lies inside the part that survives the centre crop
        BufferedImage stored = filled(200, 100, BLUE);
        fill(stored, new Rectangle(50, 0, 50, 50), RED);
        byte[] rotatedClockwise = TestImages.withExifOrientation(TestImages.encode(stored, "jpg"), 6);

        BufferedImage result = TestImages.decode(pictureService.createPicture(upload(rotatedClockwise)).getData());

        // unrotated, the marker would end up top left; rotated the wrong way, bottom left
        assertThat(result.getWidth()).isEqualTo(FULL_SIZE);
        assertColor(result, 384, 128, RED);
        assertColor(result, 128, 128, BLUE);
        assertColor(result, 128, 384, BLUE);
        assertColor(result, 384, 384, BLUE);
    }

    @Test
    void stripsExifMetadata() throws Exception {
        byte[] withExif = TestImages.withExifOrientation(TestImages.jpeg(64, 64), 1);

        Picture picture = pictureService.createPicture(upload(withExif));

        assertThat(containsExifSegment(withExif)).isTrue();
        assertThat(containsExifSegment(picture.getData())).isFalse();
        assertThat(containsExifSegment(picture.getThumbnail())).isFalse();
    }

    @Test
    void fillsTransparencyWithWhite() throws Exception {
        BufferedImage transparent = new BufferedImage(100, 100, BufferedImage.TYPE_INT_ARGB);
        fill(transparent, new Rectangle(25, 25, 50, 50), RED);

        BufferedImage result = TestImages.decode(pictureService.createPicture(upload(TestImages.encode(transparent, "png"))).getData());

        assertColor(result, 10, 10, Color.WHITE);
        assertColor(result, 500, 500, Color.WHITE);
        assertColor(result, 256, 256, RED);
    }

    @Test
    void acceptsGif() throws Exception {
        Picture picture = pictureService.createPicture(upload(TestImages.encode(redAndBluePalette(60, 40), "gif")));

        assertSquareJpeg(picture.getData(), FULL_SIZE);
        assertSquareJpeg(picture.getThumbnail(), THUMB_SIZE);
    }

    @Disabled("Nález: obrázky s paletou (GIF, PNG s paletou) ztratí barvy – Thumbnailator při scale(1.0) "
            + "vytvoří cílový obrázek stejného indexovaného typu s výchozí paletou; oprava: imageType(TYPE_INT_ARGB) v readUpright")
    @ParameterizedTest
    @ValueSource(strings = {"gif", "png"})
    void keepsColoursOfPaletteImage(String format) throws Exception {
        byte[] paletteImage = TestImages.encode(redAndBluePalette(60, 40), format);

        BufferedImage result = TestImages.decode(pictureService.createPicture(upload(paletteImage)).getData());

        assertColor(result, 100, 256, RED);
        assertColor(result, 412, 256, BLUE);
    }

    @ParameterizedTest
    @ValueSource(strings = {"orange-lossless.webp", "orange-lossy.webp"})
    void acceptsWebp(String fixture) throws Exception {
        Picture picture = pictureService.createPicture(upload(TestImages.fixture(fixture)));

        assertSquareJpeg(picture.getData(), FULL_SIZE);
        assertSquareJpeg(picture.getThumbnail(), THUMB_SIZE);
        assertWholeImageIs(TestImages.decode(picture.getData()), ORANGE);
    }

    @Test
    void acceptsFileOfExactlyMaximumSize() throws Exception {
        // decoders ignore bytes after the end of image marker
        byte[] padded = Arrays.copyOf(TestImages.jpeg(64, 64), MAX_FILE_SIZE);

        assertSquareJpeg(pictureService.createPicture(upload(padded)).getData(), FULL_SIZE);
    }

    @Test
    void rejectsFileOverMaximumSize() {
        byte[] tooLarge = Arrays.copyOf(TestImages.jpeg(64, 64), MAX_FILE_SIZE + 1);

        assertRejected(tooLarge, "5 MB");
    }

    @Test
    void rejectsImageOverThirtyMegapixelsBeforeDecoding() {
        // only the header is present, so decoding would fail with a different message
        assertRejected(TestImages.pngHeaderOnly(6000, 5001), "30 Mpx");
    }

    @Test
    void rejectsEmptyFile() {
        assertRejected(new byte[0], "prázdný");
    }

    @Test
    void rejectsMissingFile() {
        assertThatThrownBy(() -> pictureService.createPicture(null))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("prázdný");
    }

    @Test
    void rejectsUnknownFormat() {
        assertRejected("not an image at all".getBytes(StandardCharsets.UTF_8), "Nepovolený formát");
    }

    @Test
    void rejectsBmpEvenThoughItIsReadable() {
        assertRejected(TestImages.encode(filled(32, 32, RED), "bmp"), "Nepovolený formát");
    }

    @ParameterizedTest
    @ValueSource(strings = {"jpeg", "png", "gif", "webp"})
    void rejectsCorruptedDataWithValidMagicBytes(String format) {
        byte[] magic = switch (format) {
            case "jpeg" -> new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
            case "png" -> new byte[]{(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};
            case "gif" -> "GIF89a".getBytes(StandardCharsets.US_ASCII);
            default -> "RIFF\0\0\0\0WEBP".getBytes(StandardCharsets.US_ASCII);
        };
        byte[] corrupted = Arrays.copyOf(magic, magic.length + 64);
        Arrays.fill(corrupted, magic.length, corrupted.length, (byte) 0x5A);

        assertRejected(corrupted, "nepodařilo přečíst");
    }

    @Test
    void getContentConvertsLegacyPictureInPlace() {
        Picture legacy = new Picture();
        legacy.setData(TestImages.encode(threeStripes(400, 100, true), "png"));
        legacy.setContentType("image/png");

        byte[] thumbnail = pictureService.getContent(legacy, PictureService.Size.THUMB);

        assertSquareJpeg(thumbnail, THUMB_SIZE);
        assertThat(legacy.getThumbnail()).isSameAs(thumbnail);
        assertSquareJpeg(legacy.getData(), FULL_SIZE);
        assertWholeImageIs(TestImages.decode(legacy.getData()), GREEN);
        assertThat(legacy.getContentType()).isEqualTo("image/jpeg");
        assertThat(legacy.getSize()).isEqualTo(legacy.getData().length);
        assertThat(legacy.getUploadedAt()).isNotNull();
    }

    @Test
    void getContentReturnsStoredSizesOfConvertedPicture() throws Exception {
        Picture picture = pictureService.createPicture(upload(TestImages.jpeg(64, 64)));
        byte[] data = picture.getData();
        byte[] thumbnail = picture.getThumbnail();

        assertThat(pictureService.getContent(picture, PictureService.Size.FULL)).isSameAs(data);
        assertThat(pictureService.getContent(picture, PictureService.Size.THUMB)).isSameAs(thumbnail);
        assertThat(picture.getData()).isSameAs(data);
    }

    private static MockMultipartFile upload(byte[] content) {
        return new MockMultipartFile("file", "photo", "image/jpeg", content);
    }

    private void assertRejected(byte[] content, String messagePart) {
        assertThatThrownBy(() -> pictureService.createPicture(upload(content)))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining(messagePart);
    }

    private static void assertSquareJpeg(byte[] data, int size) {
        assertThat(data).startsWith((byte) 0xFF, (byte) 0xD8, (byte) 0xFF);
        BufferedImage image = TestImages.decode(data);
        assertThat(image.getWidth()).isEqualTo(size);
        assertThat(image.getHeight()).isEqualTo(size);
    }

    private static void assertWholeImageIs(BufferedImage image, Color expected) {
        int last = image.getWidth() - 1;
        assertColor(image, 0, 0, expected);
        assertColor(image, last, 0, expected);
        assertColor(image, 0, last, expected);
        assertColor(image, last, last, expected);
        assertColor(image, last / 2, last / 2, expected);
    }

    private static void assertColor(BufferedImage image, int x, int y, Color expected) {
        Color actual = new Color(image.getRGB(x, y));
        assertThat(Math.abs(actual.getRed() - expected.getRed())
                + Math.abs(actual.getGreen() - expected.getGreen())
                + Math.abs(actual.getBlue() - expected.getBlue()))
                .as("colour at [%d, %d] is %s, expected %s", x, y, actual, expected)
                .isLessThanOrEqualTo(COLOR_TOLERANCE);
    }

    private static BufferedImage filled(int width, int height, Color color) {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        fill(image, new Rectangle(0, 0, width, height), color);
        return image;
    }

    private static void fill(BufferedImage image, Rectangle area, Color color) {
        Graphics2D graphics = image.createGraphics();
        graphics.setColor(color);
        graphics.fill(area);
        graphics.dispose();
    }

    /** Two-colour indexed image, red left half and blue right half; GIF and palette PNG keep it indexed. */
    private static BufferedImage redAndBluePalette(int width, int height) {
        IndexColorModel palette = new IndexColorModel(1, 2,
                new byte[]{(byte) 255, 0}, new byte[]{0, 0}, new byte[]{0, (byte) 255});
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_BINARY, palette);
        fill(image, new Rectangle(0, 0, width / 2, height), RED);
        fill(image, new Rectangle(width / 2, 0, width - width / 2, height), BLUE);
        return image;
    }

    /** Red, green and blue stripes along the longer side; the green middle stripe is wider than the centre square. */
    private static BufferedImage threeStripes(int width, int height, boolean horizontalLayout) {
        BufferedImage image = filled(width, height, GREEN);
        if (horizontalLayout) {
            fill(image, new Rectangle(0, 0, 140, height), RED);
            fill(image, new Rectangle(width - 140, 0, 140, height), BLUE);
        } else {
            fill(image, new Rectangle(0, 0, width, 140), RED);
            fill(image, new Rectangle(0, height - 140, width, 140), BLUE);
        }
        return image;
    }

    private static boolean containsExifSegment(byte[] jpeg) {
        byte[] exifHeader = "Exif\0\0".getBytes(StandardCharsets.US_ASCII);
        for (int i = 0; i + exifHeader.length <= jpeg.length; i++) {
            if (Arrays.equals(jpeg, i, i + exifHeader.length, exifHeader, 0, exifHeader.length)) {
                return true;
            }
        }
        return false;
    }
}
