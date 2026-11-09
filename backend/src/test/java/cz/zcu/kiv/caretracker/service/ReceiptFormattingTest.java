package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.entity.Organization;
import cz.zcu.kiv.caretracker.entity.PerformedTask;
import cz.zcu.kiv.caretracker.entity.Task;
import cz.zcu.kiv.caretracker.enums.UnitType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ReceiptFormattingTest {

    private static final String NBSP = " ";

    private static Task task(long id, String name, UnitType unitType, int unitPrice) {
        Task task = new Task();
        task.setId(id);
        task.setName(name);
        task.setUnitType(unitType);
        task.setUnitPrice(unitPrice);
        return task;
    }

    private static PerformedTask record(Task task, double unitCount) {
        PerformedTask performedTask = new PerformedTask();
        performedTask.setTask(task);
        performedTask.setUnitCount(unitCount);
        return performedTask;
    }

    @Test
    void totalPriceSumsRoundedPricesOfRecords() {
        Task hourly = task(1, "Doprovod", UnitType.HOUR, 100);
        // 10 min = 16.67 → 17 for each record, rounding is per record and not of the sum (33.33 → 33)
        assertEquals(34, ReceiptFormatting.totalPrice(List.of(record(hourly, 10), record(hourly, 10))));
    }

    @Test
    void totalPriceOfNoRecordsIsZero() {
        assertEquals(0, ReceiptFormatting.totalPrice(List.of()));
    }

    @ParameterizedTest(name = "{0}/{1}, klient {2} → {3}")
    @CsvSource({
            "11, 2026, 123,    2611000123",
            "1,  2027, 7,      2701000007",
            "12, 2000, 999999, 0012999999",
    })
    void variableSymbolIsYearMonthAndPersonalNumber(int month, int year, long personalNumber, String expected) {
        assertEquals(expected, ReceiptFormatting.variableSymbol(personalNumber, month, year));
    }

    @Test
    void variableSymbolOfSevenDigitPersonalNumberHasElevenDigits() {
        // a Czech variable symbol has at most 10 digits; personal numbers are generated from client IDs
        assertEquals("26111234567", ReceiptFormatting.variableSymbol(1_234_567L, 11, 2026));
    }

    @Test
    void groupByTaskMakesOneRowPerTaskInOrderOfFirstAppearance() {
        Task walk = task(1, "Doprovod", UnitType.HOUR, 120);
        Task shopping = task(2, "Nákup", UnitType.OCCURRENCE, 50);

        List<Map<String, String>> rows = ReceiptFormatting.groupByTask(List.of(
                record(walk, 45), record(shopping, 1), record(walk, 60), record(shopping, 2)));

        assertEquals(2, rows.size());
        assertEquals(Map.of(
                "taskName", "Doprovod",
                "recordCount", "2",
                "amount", "1 h 45 min",
                "rate", "120" + NBSP + "Kč / h",
                "price", "210" + NBSP + "Kč"), rows.get(0));
        assertEquals(Map.of(
                "taskName", "Nákup",
                "recordCount", "2",
                "amount", "3×",
                "rate", "50" + NBSP + "Kč / úkon",
                "price", "150" + NBSP + "Kč"), rows.get(1));
    }

    @Test
    void groupedPriceIsSumOfRecordPrices() {
        Task hourly = task(1, "Doprovod", UnitType.HOUR, 100);

        List<Map<String, String>> rows = ReceiptFormatting.groupByTask(List.of(record(hourly, 10), record(hourly, 10)));

        // same total as the receipt sum, not the price of 20 minutes (33)
        assertEquals("34" + NBSP + "Kč", rows.get(0).get("price"));
    }

    @ParameterizedTest(name = "{0} {1} → \"{2}\"")
    @CsvSource({
            "HOUR,       0,      0 min",
            "HOUR,       45,     45 min",
            "HOUR,       60,     1 h",
            "HOUR,       105,    1 h 45 min",
            "HOUR,       600,    10 h",
            "HOUR,       7.5,    8 min",
            "OCCURRENCE, 5,      5×",
            "OCCURRENCE, 1.5,    '1,5×'",
            "KG,         3.5,    '3,5 kg'",
            "KG,         2,      2 kg",
            "KG,         1.234,  '1,23 kg'",
            "KM,         12.75,  '12,75 km'",
    })
    void formatAmountByUnit(UnitType unitType, double unitCount, String expected) {
        assertEquals(expected, ReceiptFormatting.formatAmount(unitCount, unitType));
    }

    @Test
    void formatAmountSeparatesThousandsWithNonBreakingSpace() {
        assertEquals("1" + NBSP + "250 km", ReceiptFormatting.formatAmount(1250, UnitType.KM));
    }

    @ParameterizedTest(name = "{0} → \"{1}\"")
    @CsvSource({
            "HOUR,       h",
            "OCCURRENCE, úkon",
            "KG,         kg",
            "KM,         km",
    })
    void formatRateShowsPricePerUnit(UnitType unitType, String unit) {
        assertEquals("80" + NBSP + "Kč / " + unit, ReceiptFormatting.formatRate(task(1, "Úkon", unitType, 80)));
    }

    @ParameterizedTest(name = "{0} → \"{1}\"")
    @CsvSource({
            "0,       0",
            "999,     999",
            "3081,    3|081",
            "1250000, 1|250|000",
    })
    void formatCurrencyUsesNonBreakingSpaces(int amount, String expectedDigits) {
        assertEquals(expectedDigits.replace("|", NBSP) + NBSP + "Kč", ReceiptFormatting.formatCurrency(amount));
    }

    @Test
    void formatAccountNumberWithPrefix() {
        assertEquals("19-123456789/0100", ReceiptFormatting.formatAccountNumber(organization("19", "123456789", "0100")));
    }

    @Test
    void formatAccountNumberWithoutPrefix() {
        assertEquals("123456789/0800", ReceiptFormatting.formatAccountNumber(organization(null, "123456789", "0800")));
    }

    @Test
    void formatAccountNumberIsNullWithoutAccountOrBankCode() {
        assertNull(ReceiptFormatting.formatAccountNumber(organization(null, null, "0800")));
        assertNull(ReceiptFormatting.formatAccountNumber(organization("19", "123456789", null)));
    }

    private static Organization organization(String prefix, String number, String bankCode) {
        Organization organization = new Organization();
        organization.setAccountPrefix(prefix);
        organization.setAccountNumber(number);
        organization.setBankCode(bankCode);
        return organization;
    }
}
