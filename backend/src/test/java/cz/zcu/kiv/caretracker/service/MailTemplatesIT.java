package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.Employee;
import cz.zcu.kiv.caretracker.entity.User;
import cz.zcu.kiv.caretracker.enums.EmployeeRole;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.repository.EmployeeRepository;
import cz.zcu.kiv.caretracker.repository.UserRepository;
import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Content of the activation and password reset e-mails rendered from the Thymeleaf templates: Czech subject,
 * greeting with the recipient's name, the link to the frontend (base URL from {@code app.frontend.url}) with
 * the token, and HTML escaping of names typed in by users. Token lifecycles are covered by
 * {@code ActivationTokenIT}, {@code PasswordResetIT} and {@code UserAccountIT}.
 */
class MailTemplatesIT extends AbstractIntegrationTest {

    private static final String ACTIVATION_SUBJECT = "Aktivace účtu - CareTracker";
    private static final String RESET_SUBJECT = "Reset hesla - CareTracker";
    private static final String SCRIPT_NAME = "<script>alert('x')</script>";

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String senderAddress;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private TransactionTemplate transactionTemplate;

    private Department department;
    private Employee caregiver;

    @BeforeEach
    void createDepartment() {
        department = testData.department(testData.organization());
        caregiver = testData.employee(department, EmployeeRole.CAREGIVER);
    }

    @Test
    void newEmployeeAccountGetsActivationMail() {
        Employee withoutAccount = transactionTemplate.execute(status -> {
            Employee managed = testData.employee(department, EmployeeRole.COORDINATOR);
            managed = employeeRepository.findById(managed.getId()).orElseThrow();
            userRepository.delete(managed.getUser());
            managed.setUser(null);
            return managed;
        });
        // as in EmployeeService, the account is created for an employee managed by the surrounding transaction
        Employee employee = transactionTemplate.execute(status -> {
            Employee managed = employeeRepository.findById(withoutAccount.getId()).orElseThrow();
            userService.createUserForEmployee(managed, "novy@caretracker.test", false);
            return managed;
        });

        String token = userRepository.findAllByEmailIgnoreCase("novy@caretracker.test").getFirst().getActivationToken();
        MimeMessage mail = onlyMail();
        assertThat(recipientOf(mail)).isEqualTo("novy@caretracker.test");
        assertActivationMail(mail, token, employee.getFullName());
    }

    @Test
    void mailHasPlainTextAlternativeWithTheLink() throws Exception {
        Client client = testData.client(caregiver);

        userService.createUserForClient(client, "klient@caretracker.test");

        String token = userRepository.findByClientId(client.getId()).orElseThrow().getActivationToken();
        String plainText = mailText(onlyMail()).replace(mailHtml(onlyMail()), "");
        assertThat(plainText)
                .contains("Dobrý den, " + client.getFullName())
                .contains("/activate?token=" + token)
                .doesNotContain("<");
    }

    @Test
    void newClientAccountGetsActivationMailWithClientName() {
        Client client = testData.client(caregiver);

        userService.createUserForClient(client, "klient@caretracker.test");

        String token = userRepository.findByClientId(client.getId()).orElseThrow().getActivationToken();
        assertActivationMail(onlyMail(), token, client.getFullName());
    }

    @Test
    void resentActivationMailHasTheSameTemplateAndTheNewToken() {
        User pending = testData.withPendingAccount(testData.employee(department, EmployeeRole.CAREGIVER)).getUser();
        User account = userRepository.findById(pending.getId()).orElseThrow();

        userService.resendActivationEmail(account);

        String newToken = userRepository.findById(pending.getId()).orElseThrow().getActivationToken();
        assertActivationMail(onlyMail(), newToken, account.getEmployee().getFullName());
    }

    @Test
    void resentClientActivationMailGreetsTheClient() {
        Client client = testData.client(caregiver);
        User pending = testData.pendingClientAccount(client);

        userService.resendActivationEmailForClient(client);

        String newToken = userRepository.findById(pending.getId()).orElseThrow().getActivationToken();
        assertActivationMail(onlyMail(), newToken, client.getFullName());
    }

    @Test
    void forgottenPasswordMailForEmployee() {
        User account = caregiver.getUser();

        userService.sendResetPasswordEmailByEmail(account.getEmail());

        String token = userRepository.findById(account.getId()).orElseThrow().getResetToken();
        MimeMessage mail = onlyMail();
        assertThat(recipientOf(mail)).isEqualTo(account.getEmail());
        assertResetMail(mail, token, caregiver.getFullName());
    }

    @Test
    void forgottenPasswordMailForClientAccountGreetsTheClient() {
        Client client = testData.client(caregiver);
        User account = testData.clientAccount(client);

        userService.sendResetPasswordEmailByEmail(account.getEmail());

        String token = userRepository.findById(account.getId()).orElseThrow().getResetToken();
        assertResetMail(onlyMail(), token, client.getFullName());
    }

    @Test
    void activationMailEscapesHtmlInName() {
        Employee employee = testData.withPendingAccount(testData.employee(department, EmployeeRole.CAREGIVER));
        employee.setFirstName(SCRIPT_NAME);
        employeeRepository.save(employee);

        userService.resendActivationEmail(userRepository.findById(employee.getUser().getId()).orElseThrow());

        assertEscapedScriptName(mailHtml(onlyMail()));
    }

    @Test
    void resetMailEscapesHtmlInName() {
        Client client = testData.client(caregiver);
        client.setLastName(SCRIPT_NAME);
        clientRepository.save(client);
        User account = testData.clientAccount(client);

        userService.sendResetPasswordEmailByEmail(account.getEmail());

        assertEscapedScriptName(mailHtml(onlyMail()));
    }

    private void assertActivationMail(MimeMessage mail, String token, String recipientName) {
        String link = frontendUrl + "/activate?token=" + token;
        assertThat(token).isNotBlank();
        assertThat(subjectOf(mail)).isEqualTo(ACTIVATION_SUBJECT);
        assertThat(senderOf(mail)).isEqualTo(senderAddress);
        assertThat(mailText(mail))
                .contains("<html")
                .contains("Dobrý den <span>" + recipientName + "</span>,")
                .contains("href=\"" + link + "\"")
                .contains(">" + link + "</a>")
                .contains("Aktivovat účet")
                .contains("<span>7</span> dnů")
                .contains("src=\"" + frontendUrl + "/email-logo.png\"");
    }

    private void assertResetMail(MimeMessage mail, String token, String recipientName) {
        String link = frontendUrl + "/reset-password?token=" + token;
        assertThat(token).isNotBlank();
        assertThat(subjectOf(mail)).isEqualTo(RESET_SUBJECT);
        assertThat(senderOf(mail)).isEqualTo(senderAddress);
        assertThat(mailText(mail))
                .contains("Dobrý den <span>" + recipientName + "</span>,")
                .contains("href=\"" + link + "\"")
                .contains(">" + link + "</a>")
                .contains("Resetovat heslo")
                .contains("<span>24</span> hodin");
    }

    private static void assertEscapedScriptName(String html) {
        assertThat(html)
                .doesNotContain("<script>")
                .contains("&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;");
    }

    private MimeMessage onlyMail() {
        List<MimeMessage> mails = sentMails();
        assertThat(mails).hasSize(1);
        return mails.getFirst();
    }

    private static String subjectOf(MimeMessage mail) {
        try {
            return mail.getSubject();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static String senderOf(MimeMessage mail) {
        try {
            return ((InternetAddress) mail.getFrom()[0]).getAddress();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
