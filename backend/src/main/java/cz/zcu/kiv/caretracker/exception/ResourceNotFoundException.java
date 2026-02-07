package cz.zcu.kiv.caretracker.exception;

/**
 * Výjimka pro nenalezený zdroj (entity)
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
