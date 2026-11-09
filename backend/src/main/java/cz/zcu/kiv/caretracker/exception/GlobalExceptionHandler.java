package cz.zcu.kiv.caretracker.exception;

import com.fasterxml.jackson.databind.JsonMappingException;
import cz.zcu.kiv.caretracker.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Translates exceptions thrown from controllers and services into structured JSON error responses.
 * All handlers return an {@link ErrorResponse} body with an appropriate HTTP status code.
 * Only the application's own exceptions pass their message to the client; anything unexpected
 * is logged and answered with a generic 500, so no Java internals reach the response.
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(
            DataIntegrityViolationException ex,
            HttpServletRequest request) {

        String message = "Chyba při ukládání dat";

        if (ex.getMessage().contains("duplicate key") || ex.getMessage().contains("unique constraint")) {
            if (ex.getMessage().contains("personal_number") ||
                ex.getMessage().contains("idx_client_personal_number_organization")) {
                message = "Osobní číslo již existuje";
            } else if (ex.getMessage().contains("username")) {
                message = "Uživatelské jméno již existuje";
            } else if (ex.getMessage().contains("email")) {
                message = "Email již existuje";
            } else {
                message = "Záznam s těmito údaji již existuje";
            }
        }
        else if (ex.getMessage().contains("foreign key constraint")) {
            message = "Nelze smazat, existují závislé záznamy";
        }
        else if (ex.getMessage().contains("not-null") || ex.getMessage().contains("NULL")) {
            message = "Všechna povinná pole musí být vyplněna";
        }

        ErrorResponse error = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Data Integrity Violation",
                message,
                request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUsernameNotFound(
            UsernameNotFoundException ex,
            HttpServletRequest request) {

        ErrorResponse error = new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                "Not Found",
                ex.getMessage(),
                request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ErrorResponse> handleSecurityException(
            SecurityException ex,
            HttpServletRequest request) {

        ErrorResponse error = new ErrorResponse(
                HttpStatus.FORBIDDEN.value(),
                "Forbidden",
                ex.getMessage(),
                request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException ex,
            HttpServletRequest request) {

        ErrorResponse error = new ErrorResponse(
                HttpStatus.FORBIDDEN.value(),
                "Access Denied",
                "Nemáte oprávnění k této operaci",
                request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    /**
     * The application never throws IllegalArgumentException on purpose, it comes from libraries
     * (e.g. {@code Enum.valueOf} with an unknown value), so its message names Java classes.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex,
            HttpServletRequest request) {

        log.warn("Invalid argument on {}: {}", request.getRequestURI(), ex.getMessage());
        return errorResponse(HttpStatus.BAD_REQUEST, "Bad Request", "Neplatná hodnota v požadavku", request);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
            ResourceNotFoundException ex,
            HttpServletRequest request) {

        ErrorResponse error = new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                "Not Found",
                ex.getMessage(),
                request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            ValidationException ex,
            HttpServletRequest request) {

        ErrorResponse error = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Validation Error",
                ex.getMessage(),
                request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(TokenExpiredException.class)
    public ResponseEntity<ErrorResponse> handleTokenExpired(
            TokenExpiredException ex,
            HttpServletRequest request) {

        ErrorResponse error = new ErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                "Token Expired",
                ex.getMessage(),
                request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFound(
            NoResourceFoundException ex,
            HttpServletRequest request) {

        return errorResponse(HttpStatus.NOT_FOUND, "Not Found", "Požadovaná adresa neexistuje", request);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException ex,
            HttpServletRequest request) {

        return errorResponse(HttpStatus.METHOD_NOT_ALLOWED, "Method Not Allowed",
                "Metoda " + ex.getMethod() + " není pro tuto adresu podporována", request);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMediaTypeNotSupported(
            HttpMediaTypeNotSupportedException ex,
            HttpServletRequest request) {

        return errorResponse(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Unsupported Media Type",
                "Nepodporovaný formát obsahu požadavku", request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleMessageNotReadable(
            HttpMessageNotReadableException ex,
            HttpServletRequest request) {

        String message = "Neplatný formát dat v požadavku";
        if (ex.getCause() instanceof JsonMappingException mappingException && !mappingException.getPath().isEmpty()) {
            message = "Neplatná hodnota pole '" + fieldPath(mappingException) + "'";
        }

        return errorResponse(HttpStatus.BAD_REQUEST, "Bad Request", message, request);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleArgumentTypeMismatch(
            MethodArgumentTypeMismatchException ex,
            HttpServletRequest request) {

        return errorResponse(HttpStatus.BAD_REQUEST, "Bad Request",
                "Neplatná hodnota parametru '" + ex.getName() + "'", request);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParameter(
            MissingServletRequestParameterException ex,
            HttpServletRequest request) {

        return errorResponse(HttpStatus.BAD_REQUEST, "Bad Request",
                "Chybí povinný parametr '" + ex.getParameterName() + "'", request);
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ErrorResponse> handleMissingPart(
            MissingServletRequestPartException ex,
            HttpServletRequest request) {

        return errorResponse(HttpStatus.BAD_REQUEST, "Bad Request",
                "Chybí povinná část požadavku '" + ex.getRequestPartName() + "'", request);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSize(
            MaxUploadSizeExceededException ex,
            HttpServletRequest request) {

        return errorResponse(HttpStatus.PAYLOAD_TOO_LARGE, "Payload Too Large",
                "Soubor je příliš velký", request);
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<ErrorResponse> handleMultipart(
            MultipartException ex,
            HttpServletRequest request) {

        return errorResponse(HttpStatus.BAD_REQUEST, "Bad Request",
                "Požadavek se souborem se nepodařilo zpracovat", request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex,
            HttpServletRequest request) {

        log.error("Unexpected error on {} {}", request.getMethod(), request.getRequestURI(), ex);

        ErrorResponse error = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                "Nastala neočekávaná chyba na serveru",
                request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /** JSON path of the invalid value in the request body, e.g. {@code taskIds[1]} or {@code address.city}. */
    private static String fieldPath(JsonMappingException ex) {
        StringBuilder path = new StringBuilder();
        for (JsonMappingException.Reference reference : ex.getPath()) {
            if (reference.getFieldName() != null) {
                if (!path.isEmpty()) {
                    path.append('.');
                }
                path.append(reference.getFieldName());
            } else {
                path.append('[').append(reference.getIndex()).append(']');
            }
        }
        return path.toString();
    }

    private ResponseEntity<ErrorResponse> errorResponse(
            HttpStatus status,
            String error,
            String message,
            HttpServletRequest request) {

        return new ResponseEntity<>(
                new ErrorResponse(status.value(), error, message, request.getRequestURI()),
                status
        );
    }
}
