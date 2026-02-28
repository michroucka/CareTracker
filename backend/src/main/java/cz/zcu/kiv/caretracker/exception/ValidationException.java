package cz.zcu.kiv.caretracker.exception;

/**
 * Výjimka pro validační chyby (neplatná data, duplicity, atd.)
 */
public class ValidationException extends RuntimeException {
    public ValidationException(String message) {
        super(message);
    }
}
