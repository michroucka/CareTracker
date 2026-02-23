package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.entity.Client;
import cz.zcu.kiv.caretracker.entity.PerformedTask;
import cz.zcu.kiv.caretracker.exception.ResourceNotFoundException;
import cz.zcu.kiv.caretracker.exception.ValidationException;
import cz.zcu.kiv.caretracker.repository.ClientRepository;
import cz.zcu.kiv.caretracker.repository.PerformedTaskRepository;
import cz.zcu.kiv.caretracker.specification.PerformedTaskSpecifications;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReceiptService extends BaseRoleFilteringService<PerformedTask, Void>{
    @Autowired
    private PerformedTaskRepository performedTaskRepository;
    @Autowired
    private ClientRepository clientRepository;
    @Autowired
    private SpringTemplateEngine templateEngine;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("d.M.yyyy");
    private static final String[] MONTH_NAMES = {
            "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
            "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
    };

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
                month, year
        ).and(PerformedTaskSpecifications.hasClient(clientId));

        List<PerformedTask> tasks = performedTaskRepository.findAll(spec);
        tasks.sort(Comparator.comparing(PerformedTask::getDate));

        List<Map<String, String>> taskRows = groupByTask(tasks);

        int totalPrice = tasks.stream()
                .mapToInt(PerformedTask::calculatePrice)
                .sum();

        Context context = new Context();
        context.setVariable("organizationName", client.getOrganization().getName());
        context.setVariable("clientName", client.getFullName());
        context.setVariable("clientPersonalNumber", client.getPersonalNumber());
        context.setVariable("clientDateOfBirth", client.getDateOfBirth().format(DATE_FMT));
        context.setVariable("clientAddress", client.getStreet() + ", " + client.getPostalCode() + ", " + client.getCity());
        context.setVariable("monthYear", MONTH_NAMES[month - 1] + " " + year);
        context.setVariable("tasks", taskRows);
        context.setVariable("totalPrice", totalPrice);

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
