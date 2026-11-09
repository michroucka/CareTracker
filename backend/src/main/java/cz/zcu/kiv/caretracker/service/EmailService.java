package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.exception.ValidationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Sends transactional emails (account activation, password reset) via JavaMailSender
 * using Thymeleaf HTML templates.
 */
@Service
public class EmailService {

    private static final int ACTIVATION_EXPIRY_DAYS = 7;
    private static final int RESET_EXPIRY_HOURS = 24;
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender javaMailSender;

    @Autowired
    private SpringTemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String sender;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.name:CareTracker}")
    private String appName;

    /**
     * Sends an HTML account activation email using the {@code email/activation-email} Thymeleaf template.
     *
     * @param recipientEmail the target email address
     * @param activationToken the activation token to embed in the link
     * @param recipientName the recipient's full name for the greeting
     * @throws ValidationException if the email cannot be sent
     */
    public void sendActivationEmail(String recipientEmail, String activationToken, String recipientName) {
        try {
            String activationLink = frontendUrl + "/activate?token=" + activationToken;

            Context context = new Context();
            context.setVariable("recipientName", recipientName);
            context.setVariable("activationLink", activationLink);
            context.setVariable("appName", appName);
            context.setVariable("logoUrl", frontendUrl + "/email-logo.png");
            context.setVariable("expiryDays", ACTIVATION_EXPIRY_DAYS);

            String htmlContent = templateEngine.process("email/activation-email", context);

            String plainText = """
                    Dobrý den, %s,

                    v aplikaci %s pro vás byl založen účet. Pro jeho aktivaci otevřete tento odkaz:
                    %s

                    Odkaz je platný %d dní.
                    """.formatted(recipientName, appName, activationLink, ACTIVATION_EXPIRY_DAYS);

            sendHtmlEmail(recipientEmail, "Aktivace účtu - " + appName, plainText, htmlContent);

            log.info("Activation email sent successfully to: {}", recipientEmail);
        } catch (Exception e) {
            log.error("Failed to send activation email to: {}", recipientEmail, e);
            throw new ValidationException("Nepodařilo se odeslat aktivační email");
        }
    }

    /**
     * Sends a plain-text email.
     *
     * @param to recipient email address
     * @param subject email subject
     * @param text plain-text body
     * @throws ValidationException if the email cannot be sent
     */
    public void sendSimpleEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(sender);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);

            javaMailSender.send(message);

            log.info("Simple email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send simple email to: {}", to, e);
            throw new ValidationException("Nepodařilo se odeslat email");
        }
    }

    /**
     * Sends a UTF-8 HTML email via MIME message with a plain-text alternative,
     * which mail clients without HTML show and spam filters expect.
     *
     * @param to recipient email address
     * @param subject email subject
     * @param plainText plain-text body
     * @param htmlContent rendered HTML body
     */
    private void sendHtmlEmail(String to, String subject, String plainText, String htmlContent) throws MessagingException {
        MimeMessage message = javaMailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(sender);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(plainText, htmlContent);

        javaMailSender.send(message);
    }

    /**
     * Sends an HTML password-reset email using the {@code email/password-reset-email} Thymeleaf template.
     *
     * @param email the target email address
     * @param resetToken the reset token to embed in the link
     * @param recipientName the recipient's name for the greeting
     * @throws ValidationException if the email cannot be sent
     */
    public void sendPasswordResetEmail(String email, String resetToken, String recipientName) {
        try {
            String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

            Context context = new Context();
            context.setVariable("recipientName", recipientName);
            context.setVariable("resetLink", resetLink);
            context.setVariable("appName", appName);
            context.setVariable("logoUrl", frontendUrl + "/email-logo.png");
            context.setVariable("expiryHours", RESET_EXPIRY_HOURS);

            String htmlContent = templateEngine.process("email/password-reset-email", context);

            String plainText = """
                    Dobrý den, %s,

                    pro nastavení nového hesla v aplikaci %s otevřete tento odkaz:
                    %s

                    Odkaz je platný %d hodin. Pokud jste o reset hesla nežádali, e-mail ignorujte.
                    """.formatted(recipientName, appName, resetLink, RESET_EXPIRY_HOURS);

            sendHtmlEmail(email, "Reset hesla - " + appName, plainText, htmlContent);

            log.info("Password reset email sent successfully to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send password reset email to: {}", email, e);
            throw new ValidationException("Nepodařilo se odeslat email pro reset hesla");
        }
    }
}
