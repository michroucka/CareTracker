package cz.zcu.kiv.caretracker.entity;

import cz.zcu.kiv.caretracker.enums.UnitType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Price of one record: hourly tasks are recorded in minutes but priced per hour, result rounded to whole crowns. */
class PerformedTaskTest {

    private static PerformedTask performedTask(double unitCount, int unitPrice, UnitType unitType) {
        Task task = new Task();
        task.setUnitPrice(unitPrice);
        task.setUnitType(unitType);

        PerformedTask performedTask = new PerformedTask();
        performedTask.assignTask(task);
        performedTask.setUnitCount(unitCount);
        return performedTask;
    }

    @ParameterizedTest(name = "{0} min × {1} Kč/h = {2} Kč")
    @CsvSource({
            "60,   100, 100",
            "30,   100, 50",
            "90,   100, 150",
            "10,   100, 17",   // 16.67
            "1,    100, 2",    // 1.67
            "0,    100, 0",
            "15,   0,   0",
            "30,   1,   1",    // 0.5 rounds up
            "29,   1,   0",    // 0.48
            "7.5,  120, 15",   // fractional minutes
            "480,  250, 2000", // full working day
            "1,    59,  1",    // 0.98
    })
    void hourlyTaskIsPricedPerHourFromMinutes(double minutes, int pricePerHour, int expectedPrice) {
        assertEquals(expectedPrice, performedTask(minutes, pricePerHour, UnitType.HOUR).calculatePrice());
    }

    @ParameterizedTest(name = "{1} {0} × {2} Kč = {3} Kč")
    @CsvSource({
            "OCCURRENCE, 3,    50, 150",
            "OCCURRENCE, 1,    0,  0",
            "OCCURRENCE, 0,    50, 0",
            "KG,         2.5,  40, 100",
            "KG,         0.5,  15, 8",    // 7.5 rounds up
            "KG,         1.25, 10, 13",   // 12.5 rounds up
            "KG,         0.33, 10, 3",    // 3.3
            "KM,         10,   5,  50",
            "KM,         12.7, 8,  102",  // 101.6
            "KM,         0.1,  4,  0",    // 0.4
    })
    void otherUnitsArePricedPerUnit(UnitType unitType, double unitCount, int unitPrice, int expectedPrice) {
        assertEquals(expectedPrice, performedTask(unitCount, unitPrice, unitType).calculatePrice());
    }

    @ParameterizedTest(name = "{0} kg × {1} Kč = {2} Kč")
    @CsvSource({
            "0.29, 50,  15",
            "0.35, 90,  32",
            "0.35, 170, 60",
    })
    void amountExactlyHalfwayRoundsUp(double unitCount, int unitPrice, int expectedPrice) {
        assertEquals(expectedPrice, performedTask(unitCount, unitPrice, UnitType.KG).calculatePrice());
    }

    private static Task catalogTask(long id, int unitPrice) {
        Task task = new Task();
        task.setId(id);
        task.setUnitPrice(unitPrice);
        task.setUnitType(UnitType.OCCURRENCE);
        return task;
    }

    @Test
    void keepsTheRecordedPriceWhenTheCatalogPriceChanges() {
        Task lunch = catalogTask(1, 80);
        PerformedTask performedTask = new PerformedTask();
        performedTask.assignTask(lunch);
        performedTask.setUnitCount(2.0);

        lunch.setUnitPrice(100);
        performedTask.assignTask(lunch);

        assertEquals(80, performedTask.getUnitPrice());
        assertEquals(160, performedTask.calculatePrice());
    }

    @Test
    void takesTheCurrentPriceOfANewlyAssignedTask() {
        PerformedTask performedTask = new PerformedTask();
        performedTask.assignTask(catalogTask(1, 80));

        performedTask.assignTask(catalogTask(2, 120));

        assertEquals(120, performedTask.getUnitPrice());
    }
}
