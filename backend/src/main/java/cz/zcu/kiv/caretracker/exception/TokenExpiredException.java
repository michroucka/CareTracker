package cz.zcu.kiv.caretracker.exception;

/**
 * Výjimka pro expirované tokeny
 */
public class TokenExpiredException extends RuntimeException {
    public TokenExpiredException(String message) {
        super(message);
    }
}
