package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.entity.PerformedTask;
import cz.zcu.kiv.caretracker.exception.ResourceNotFoundException;
import cz.zcu.kiv.caretracker.exception.ValidationException;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.repository.PerformedTaskRepository;
import cz.zcu.kiv.caretracker.specification.PerformedTaskSpecifications;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.xhtmlrenderer.pdf.ITextRenderer;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Generates PDF billing receipts and payment QR codes for a client's performed tasks in a given month.
 * PDF rendering uses Flying Saucer (ITextRenderer) with Thymeleaf HTML templates.
 * QR codes are fetched from the external Paylibo API and embedded in the PDF as Base64.
 */
@Service
public class ReceiptService extends BaseRoleFilteringService<PerformedTask, Void>{
    private static final Logger log = LoggerFactory.getLogger(ReceiptService.class);
    private static final String PAYLIBO_URL = "https://api.paylibo.com/paylibo/generator/czech/image";

    @Autowired
    private PerformedTaskRepository performedTaskRepository;
    @Autowired
    private ClientRepository clientRepository;
    @Autowired
    private SpringTemplateEngine templateEngine;

    private final RestClient restClient = RestClient.create();

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("d.M.yyyy");
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
        if (month < 1 || month > 12) {
            throw new ValidationException("Měsíc musí být mezi 1 a 12");
        }

        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Klient nebyl nalezen"));

        validateDepartmentAccess(client,
                c -> c.getOrganization().getId(),
                c -> c.getDepartment() != null ? c.getDepartment().getId() : null);

        Specification<PerformedTask> spec = PerformedTaskSpecifications.withFilters(
                client.getOrganization().getId(),
                null, null,
                clientId,
                month, year
        );

        List<PerformedTask> tasks = performedTaskRepository.findAll(spec);
        tasks.sort(Comparator.comparing(PerformedTask::getDate));

        List<Map<String, String>> taskRows = groupByTask(tasks);

        int totalPrice = tasks.stream()
                .mapToInt(PerformedTask::calculatePrice)
                .sum();

        String variableSymbol = String.format("%02d%02d%06d", year % 100, month, client.getPersonalNumber());

        Context context = new Context();
        context.setVariable("organizationName", client.getOrganization().getName());
        context.setVariable("clientName", client.getFullName());
        context.setVariable("clientPersonalNumber", client.getPersonalNumber());
        context.setVariable("clientDateOfBirth", client.getDateOfBirth().format(DATE_FMT));
        context.setVariable("clientAddress", client.getStreet() + ", " + client.getPostalCode() + ", " + client.getCity());
        context.setVariable("monthYear", MONTH_NAMES[month - 1] + " " + year);
        context.setVariable("tasks", taskRows);
        context.setVariable("totalPrice", totalPrice);
        context.setVariable("qrCode", fetchPaymentQrCode(client.getOrganization(), totalPrice, variableSymbol));

        String html = templateEngine.process("receipt/performed-task-receipt", context);

        try {
            ITextRenderer renderer = new ITextRenderer();

            renderer.getFontResolver().addFont(
                    getClass().getClassLoader().getResource("fonts/Nunito-Regular.ttf").toURI().toString(),
                    "Identity-H",
                    true
            );
            renderer.getFontResolver().addFont(
                    getClass().getClassLoader().getResource("fonts/Nunito-Bold.ttf").toURI().toString(),
                    "Identity-H",
                    true
            );

            renderer.setDocumentFromString(html);
            renderer.layout();

            ByteArrayOutputStream os = new ByteArrayOutputStream();
            renderer.createPDF(os);
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
     */
    public byte[] generatePaymentQrCode(Long clientId, Integer month, Integer year) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Klient nebyl nalezen"));

        int totalPrice = performedTaskRepository.findAll(
                PerformedTaskSpecifications.withFilters(client.getOrganization().getId(), null, null, clientId, month, year)
        ).stream().mapToInt(PerformedTask::calculatePrice).sum();

        String variableSymbol = String.format("%02d%02d%06d", year % 100, month, client.getPersonalNumber());
        return fetchPaymentQrPng(client.getOrganization(), totalPrice, variableSymbol);
    }

    /** Fetches the QR code PNG and returns it as a Base64 string for embedding in the PDF template. */
    private String fetchPaymentQrCode(Organization org, double totalPrice, String variableSymbol) {
        byte[] bytes = fetchPaymentQrPng(org, totalPrice, variableSymbol);
        return bytes != null ? Base64.getEncoder().encodeToString(bytes) : null;
    }

    /**
     * Calls the Paylibo API to generate a Czech payment QR code image.
     * Returns {@code null} if bank details are missing or the request fails.
     */
    private byte[] fetchPaymentQrPng(Organization org, double totalPrice, String variableSymbol) {
        if (org.getAccountNumber() == null || org.getBankCode() == null) {
            return null;
        }
        try {
            UriComponentsBuilder uri = UriComponentsBuilder.fromUriString(PAYLIBO_URL)
                    .queryParam("accountNumber", org.getAccountNumber())
                    .queryParam("bankCode", org.getBankCode())
                    .queryParam("amount", totalPrice)
                    .queryParam("currency", "CZK")
                    .queryParam("vs", variableSymbol)
                    .queryParam("size", 150);
            if (org.getAccountPrefix() != null) {
                uri.queryParam("accountPrefix", org.getAccountPrefix());
            }
            return restClient.get()
                    .uri(uri.toUriString())
                    .retrieve()
                    .body(byte[].class);
        } catch (Exception e) {
            log.warn("Nepodařilo se vygenerovat QR kód platby: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Groups performed tasks by task type and aggregates unit counts and prices per group
     * for use as rows in the receipt template.
     */
    private List<Map<String, String>> groupByTask(List<PerformedTask> tasks) {
        return tasks.stream()
                .collect(Collectors.groupingBy(
                        t -> t.getTask().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ))
                .values().stream()
                .map(group -> {
                    var task = group.get(0).getTask();
                    double totalUnitCount = group.stream()
                            .mapToDouble(PerformedTask::getUnitCount).sum();
                    int totalPrice = group.stream()
                            .mapToInt(PerformedTask::calculatePrice).sum();

                    Map<String, String> row = new HashMap<>();
                    row.put("taskName", task.getName());
                    row.put("unitCount", String.valueOf(totalUnitCount));
                    row.put("unitType", task.getUnitType().getLabel());
                    row.put("price", String.valueOf(totalPrice));
                    return row;
                })
                .toList();
    }
}
