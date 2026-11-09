package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Department;
import cz.zcu.kiv.caretracker.entity.PerformedTask;
import cz.zcu.kiv.caretracker.exception.ResourceNotFoundException;
import cz.zcu.kiv.caretracker.exception.ValidationException;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.repository.DepartmentRepository;
import cz.zcu.kiv.caretracker.repository.PerformedTaskRepository;
import cz.zcu.kiv.caretracker.specification.PerformedTaskSpecifications;
import cz.zcu.kiv.caretracker.service.PaymentQrClient.PaymentAccount;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.xhtmlrenderer.pdf.ITextRenderer;
import java.io.ByteArrayOutputStream;
import java.text.Collator;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * Generates PDF billing receipts and payment QR codes for a client's performed tasks in a given month.
 * PDF rendering uses Flying Saucer (ITextRenderer) with Thymeleaf HTML templates.
 * QR codes are fetched by {@link PaymentQrClient} and embedded in the PDF as Base64.
 */
@Service
public class ReceiptService extends BaseRoleFilteringService<PerformedTask, Void>{

    @Autowired
    private PerformedTaskRepository performedTaskRepository;
    @Autowired
    private ClientRepository clientRepository;
    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private SpringTemplateEngine templateEngine;
    @Autowired
    private PaymentQrClient paymentQrClient;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("d. M. yyyy");
    private static final Collator CZECH_COLLATOR = Collator.getInstance(Locale.forLanguageTag("cs-CZ"));
    private static final int MAX_PARALLEL_QR_REQUESTS = 8;
    private static final String[] MONTH_NAMES = {
            "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
            "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
    };

    /**
     * Generates a PDF receipt listing all performed tasks for a client in the given month.
     * Includes a payment QR code if the organization has bank account details configured.
     *
     * @param clientId the client ID
     * @param month the billing month (1–12)
     * @param year the billing year
     * @return the rendered PDF as a byte array
     * @throws ValidationException if the month value is out of range
     * @throws ResourceNotFoundException if the client is not found
     * @throws SecurityException if the user does not have access to this client
     */
    @Transactional(readOnly = true)
    public byte[] generateReceipt(Long clientId, Integer month, Integer year) {
        validateMonth(month);

        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Klient nebyl nalezen"));

        validateDepartmentAccess(client,
                c -> c.getOrganization().getId(),
                c -> c.getDepartment() != null ? c.getDepartment().getId() : null);

        List<PerformedTask> tasks = performedTaskRepository.findAll(PerformedTaskSpecifications.withFilters(
                client.getOrganization().getId(), null, null, clientId, month, year));
        tasks.sort(Comparator.comparing(PerformedTask::getDate));

        String variableSymbol = variableSymbol(client, month, year);
        String qrCode = encodeBase64(paymentQrClient.fetchPng(PaymentAccount.of(client.getOrganization()), ReceiptFormatting.totalPrice(tasks), variableSymbol));
        return renderPdf(List.of(buildReceiptHtml(client, tasks, month, year, qrCode)));
    }

    /**
     * Generates one PDF with the receipts of all clients of a department who received care in the
     * given month, each client on its own page, ordered by surname. Clients without any performed task
     * in the month are left out.
     *
     * @param departmentId the department ID
     * @param month the billing month (1–12)
     * @param year the billing year
     * @return the rendered PDF as a byte array
     * @throws ResourceNotFoundException if the department is not found or no client has a record in the month
     * @throws SecurityException if the user does not have access to this department
     */
    @Transactional(readOnly = true)
    public byte[] generateDepartmentReceipts(Long departmentId, Integer month, Integer year) {
        validateMonth(month);

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Středisko nebylo nalezeno"));
        validateDepartmentId(department.getId(), department.getOrganization().getId());

        List<PerformedTask> tasks = performedTaskRepository.findAll(PerformedTaskSpecifications.withFilters(
                department.getOrganization().getId(), List.of(departmentId), null, null, month, year));
        if (tasks.isEmpty()) {
            throw new ResourceNotFoundException("Ve zvoleném měsíci nemá žádný klient střediska záznam");
        }
        tasks.sort(Comparator.comparing(PerformedTask::getDate));

        Map<Long, List<PerformedTask>> tasksByClient = tasks.stream()
                .collect(Collectors.groupingBy(t -> t.getClient().getId(), LinkedHashMap::new, Collectors.toList()));

        List<List<PerformedTask>> clientGroups = tasksByClient.values().stream()
                .sorted(Comparator.comparing((List<PerformedTask> group) -> group.get(0).getClient().getLastName(), CZECH_COLLATOR)
                        .thenComparing(group -> group.get(0).getClient().getFirstName(), CZECH_COLLATOR))
                .toList();

        // QR codes come from an external API one request per client, so they are fetched in parallel;
        // everything read from JPA entities is resolved here first, the parallel part only uses plain values
        PaymentAccount account = PaymentAccount.of(department.getOrganization());
        List<Integer> totals = clientGroups.stream().map(ReceiptFormatting::totalPrice).toList();
        List<String> variableSymbols = clientGroups.stream()
                .map(group -> variableSymbol(group.get(0).getClient(), month, year))
                .toList();
        // own bounded pool: the blocking calls must not occupy the JVM-wide common pool
        List<String> qrCodes;
        try (ExecutorService qrFetchers = Executors.newFixedThreadPool(Math.clamp(clientGroups.size(), 1, MAX_PARALLEL_QR_REQUESTS))) {
            List<CompletableFuture<String>> pendingQrCodes = IntStream.range(0, clientGroups.size())
                    .mapToObj(index -> CompletableFuture.supplyAsync(
                            () -> encodeBase64(paymentQrClient.fetchPng(account, totals.get(index), variableSymbols.get(index))),
                            qrFetchers))
                    .toList();
            qrCodes = pendingQrCodes.stream().map(CompletableFuture::join).toList();
        }

        List<String> pages = IntStream.range(0, clientGroups.size())
                .mapToObj(index -> buildReceiptHtml(clientGroups.get(index).get(0).getClient(), clientGroups.get(index), month, year, qrCodes.get(index)))
                .toList();

        return renderPdf(pages);
    }

    private static void validateMonth(Integer month) {
        if (month < 1 || month > 12) {
            throw new ValidationException("Měsíc musí být mezi 1 a 12");
        }
    }

    private static String variableSymbol(Client client, int month, int year) {
        return ReceiptFormatting.variableSymbol(client.getPersonalNumber(), month, year);
    }

    /**
     * Fills the receipt template for one client; `tasks` are the client's records in the month, sorted by date.
     * `qrCode` is the Base64 payment QR image, or null when the organization has no bank account.
     */
    private String buildReceiptHtml(Client client, List<PerformedTask> tasks, int month, int year, String qrCode) {
        int totalPrice = ReceiptFormatting.totalPrice(tasks);
        String variableSymbol = variableSymbol(client, month, year);

        Context context = new Context();
        context.setVariable("organizationName", client.getOrganization().getName());
        context.setVariable("clientName", client.getFullName());
        context.setVariable("clientPersonalNumber", client.getPersonalNumber());
        context.setVariable("clientDateOfBirth", client.getDateOfBirth().format(DATE_FMT));
        context.setVariable("clientStreet", client.getStreet());
        context.setVariable("clientCity", client.getPostalCode() + " " + client.getCity());
        context.setVariable("monthYear", MONTH_NAMES[month - 1] + " " + year);
        context.setVariable("issuedDate", LocalDate.now().format(DATE_FMT));
        context.setVariable("tasks", ReceiptFormatting.groupByTask(tasks));
        context.setVariable("totalPrice", ReceiptFormatting.formatCurrency(totalPrice));
        context.setVariable("accountNumber", ReceiptFormatting.formatAccountNumber(client.getOrganization()));
        context.setVariable("variableSymbol", variableSymbol);
        context.setVariable("qrCode", qrCode);
        context.setVariable("logoUrl", getClass().getClassLoader().getResource("images/lockup-horizontal-color.png").toString());

        return templateEngine.process("receipt/performed-task-receipt", context);
    }

    /** Renders the HTML documents into one PDF; every document starts on a new page. */
    private byte[] renderPdf(List<String> documents) {
        try {
            ITextRenderer renderer = new ITextRenderer();

            renderer.getFontResolver().addFont(
                    getClass().getClassLoader().getResource("fonts/Figtree-Regular.ttf").toURI().toString(),
                    "Identity-H",
                    true
            );
            renderer.getFontResolver().addFont(
                    getClass().getClassLoader().getResource("fonts/Figtree-Bold.ttf").toURI().toString(),
                    "Identity-H",
                    true
            );

            ByteArrayOutputStream os = new ByteArrayOutputStream();
            renderer.setDocumentFromString(documents.get(0));
            renderer.layout();
            renderer.createPDF(os, false);

            for (String document : documents.subList(1, documents.size())) {
                renderer.setDocumentFromString(document);
                renderer.layout();
                renderer.writeNextDocument();
            }

            renderer.finishPDF();
            return os.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Chyba při generování PDF", e);
        }
    }

    /**
     * Generates a standalone payment QR code PNG for a client's monthly billing total.
     * Returns {@code null} if the organization has no bank account configured.
     *
     * @param clientId the client ID
     * @param month the billing month (1–12)
     * @param year the billing year
     * @return PNG bytes, or {@code null} if no bank account is configured
     * @throws SecurityException if the signed-in client asks for another client's payment
     */
    public byte[] generatePaymentQrCode(Long clientId, Integer month, Integer year) {
        validateMonth(month);
        Client ownClient = getCurrentUser().getClient();
        if (ownClient == null || !ownClient.getId().equals(clientId)) {
            throw new SecurityException("Přístup odepřen: platba patří jinému klientovi");
        }

        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Klient nebyl nalezen"));

        int totalPrice = ReceiptFormatting.totalPrice(performedTaskRepository.findAll(
                PerformedTaskSpecifications.withFilters(client.getOrganization().getId(), null, null, clientId, month, year)));

        return paymentQrClient.fetchPng(PaymentAccount.of(client.getOrganization()), totalPrice, variableSymbol(client, month, year));
    }

    private static String encodeBase64(byte[] bytes) {
        return bytes != null ? Base64.getEncoder().encodeToString(bytes) : null;
    }
}
