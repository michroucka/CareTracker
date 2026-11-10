package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.entity.PerformedTask;
import cz.zcu.kiv.caretracker.entity.Task;
import cz.zcu.kiv.caretracker.enums.UnitType;

import java.text.NumberFormat;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/** Amounts, totals and texts printed on a receipt, kept apart from PDF rendering so they can be tested directly. */
final class ReceiptFormatting {

    private static final Locale CZECH = Locale.forLanguageTag("cs-CZ");

    private ReceiptFormatting() {
    }

    static int totalPrice(List<PerformedTask> tasks) {
        return tasks.stream().mapToInt(PerformedTask::calculatePrice).sum();
    }

    /** Year, month and client's personal number: November 2026 for client 123 → "2611000123". */
    static String variableSymbol(Long personalNumber, int month, int year) {
        return String.format("%02d%02d%06d", year % 100, month, personalNumber);
    }

    /**
     * Groups performed tasks by task type and stored unit price and aggregates unit counts and prices per group
     * for use as rows in the receipt template, in the order the groups first appear. A price change within
     * the month gives the task a second row with the new rate.
     */
    static List<Map<String, String>> groupByTask(List<PerformedTask> tasks) {
        return tasks.stream()
                .collect(Collectors.groupingBy(
                        t -> List.of(t.getTask().getId(), t.getUnitPrice()),
                        LinkedHashMap::new,
                        Collectors.toList()
                ))
                .values().stream()
                .map(group -> {
                    PerformedTask first = group.get(0);
                    Task task = first.getTask();
                    double totalUnitCount = group.stream()
                            .mapToDouble(PerformedTask::getUnitCount).sum();

                    Map<String, String> row = new HashMap<>();
                    row.put("taskName", task.getName());
                    row.put("recordCount", String.valueOf(group.size()));
                    row.put("amount", formatAmount(totalUnitCount, task.getUnitType()));
                    row.put("rate", formatRate(task.getUnitType(), first.getUnitPrice()));
                    row.put("price", formatCurrency(totalPrice(group)));
                    return row;
                })
                .toList();
    }

    /** 105 min → "1 h 45 min", 5 occurrences → "5×", 3.5 kg → "3,5 kg" */
    static String formatAmount(double unitCount, UnitType unitType) {
        if (unitType == UnitType.HOUR) {
            long minutes = Math.round(unitCount);
            long hours = minutes / 60;
            long rest = minutes % 60;
            if (hours == 0) return rest + " min";
            return rest == 0 ? hours + " h" : hours + " h " + rest + " min";
        }
        if (unitType == UnitType.OCCURRENCE) {
            return formatNumber(unitCount) + "×";
        }
        return formatNumber(unitCount) + " " + unitType.getLabel();
    }

    /** Price per unit; hourly tasks are recorded in minutes but priced per hour. */
    static String formatRate(UnitType unitType, int unitPrice) {
        String unit = switch (unitType) {
            case HOUR -> "h";
            case OCCURRENCE -> "úkon";
            default -> unitType.getLabel();
        };
        return formatCurrency(unitPrice) + " / " + unit;
    }

    /** 3081 → "3 081 Kč" with non-breaking spaces, so the amount never wraps. */
    static String formatCurrency(int amount) {
        return formatNumber(amount) + " Kč";
    }

    static String formatNumber(double value) {
        NumberFormat format = NumberFormat.getNumberInstance(CZECH);
        format.setMaximumFractionDigits(2);
        return format.format(value).replace(' ', ' ');
    }

    /** "19-123456789/0100" as written on Czech payment orders, or null without a bank account. */
    static String formatAccountNumber(Organization organization) {
        if (organization.getAccountNumber() == null || organization.getBankCode() == null) {
            return null;
        }
        String prefix = organization.getAccountPrefix() != null ? organization.getAccountPrefix() + "-" : "";
        return prefix + organization.getAccountNumber() + "/" + organization.getBankCode();
    }
}
