package cz.zcu.kiv.caretracker.support;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.zip.CRC32;

public final class TestImages {

    private TestImages() {
    }

    public static byte[] jpeg(int width, int height) {
        return encode(new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB), "jpg");
    }

    public static byte[] encode(BufferedImage image, String format) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            if (!ImageIO.write(image, format, out)) {
                throw new IllegalArgumentException("No ImageIO writer for " + format);
            }
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    public static BufferedImage decode(byte[] data) {
        try {
            return ImageIO.read(new ByteArrayInputStream(data));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /** Loads a binary fixture from {@code src/test/resources/pictures/}. */
    public static byte[] fixture(String name) {
        try (InputStream in = TestImages.class.getResourceAsStream("/pictures/" + name)) {
            if (in == null) {
                throw new IllegalArgumentException("Missing fixture pictures/" + name);
            }
            return in.readAllBytes();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /** Adds an EXIF APP1 segment with the given orientation tag right after the JFIF APP0 segment. */
    public static byte[] withExifOrientation(byte[] jpeg, int orientation) {
        int insertAt = 2;
        if ((jpeg[2] & 0xFF) == 0xFF && (jpeg[3] & 0xFF) == 0xE0) {
            insertAt += 2 + (((jpeg[4] & 0xFF) << 8) | (jpeg[5] & 0xFF));
        }
        ByteBuffer exif = ByteBuffer.allocate(36)
                .put((byte) 0xFF).put((byte) 0xE1)
                .putShort((short) 34)
                .put("Exif\0\0".getBytes(StandardCharsets.US_ASCII))
                .put("MM".getBytes(StandardCharsets.US_ASCII)).putShort((short) 42).putInt(8)
                .putShort((short) 1)
                .putShort((short) 0x0112).putShort((short) 3).putInt(1).putShort((short) orientation).putShort((short) 0)
                .putInt(0);

        byte[] result = new byte[jpeg.length + exif.capacity()];
        System.arraycopy(jpeg, 0, result, 0, insertAt);
        System.arraycopy(exif.array(), 0, result, insertAt, exif.capacity());
        System.arraycopy(jpeg, insertAt, result, insertAt + exif.capacity(), jpeg.length - insertAt);
        return result;
    }

    /** A PNG with only the signature and a valid IHDR chunk: declares its dimensions but has no pixel data. */
    public static byte[] pngHeaderOnly(int width, int height) {
        ByteBuffer ihdr = ByteBuffer.allocate(17)
                .put("IHDR".getBytes(StandardCharsets.US_ASCII))
                .putInt(width).putInt(height)
                .put((byte) 8).put((byte) 2).put((byte) 0).put((byte) 0).put((byte) 0);
        CRC32 crc = new CRC32();
        crc.update(ihdr.array());

        return ByteBuffer.allocate(8 + 4 + 17 + 4)
                .put(new byte[]{(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'})
                .putInt(13)
                .put(ihdr.array())
                .putInt((int) crc.getValue())
                .array();
    }
}
