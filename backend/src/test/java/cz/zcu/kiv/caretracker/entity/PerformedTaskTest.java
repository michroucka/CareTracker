package cz.zcu.kiv.caretracker.entity;

import cz.zcu.kiv.caretracker.enums.UnitType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PerformedTaskTest {

    private PerformedTask createPerformedTask(double unitCount, int unitPrice, UnitType unitType) {
        Task task = new Task();
        task.setUnitPrice(unitPrice);
        task.setUnitType(unitType);

        PerformedTask performedTask = new PerformedTask();
        performedTask.setTask(task);
        performedTask.setUnitCount(unitCount);
        return performedTask;
    }

    @Test
    void calculatePrice_hourType_wholeHours() {
        // 60 min at 100/hr = 100
        assertEquals(100, createPerformedTask(60.0, 100, UnitType.HOUR).calculatePrice());
    }

    @Test
    void calculatePrice_hourType_halfHour() {
        // 30 min at 100/hr = 50
        assertEquals(50, createPerformedTask(30.0, 100, UnitType.HOUR).calculatePrice());
    }

    @Test
    void calculatePrice_hourType_withRounding() {
        // 10 min at 100/hr = round(10*100/60) = round(16.67) = 17
        assertEquals(17, createPerformedTask(10.0, 100, UnitType.HOUR).calculatePrice());
    }

    @Test
    void calculatePrice_occurrenceType() {
        // 3 occurrences at 50 = 150
        assertEquals(150, createPerformedTask(3.0, 50, UnitType.OCCURRENCE).calculatePrice());
    }

    @Test
    void calculatePrice_kgType() {
        // 2.5 kg at 40 = round(100) = 100
        assertEquals(100, createPerformedTask(2.5, 40, UnitType.KG).calculatePrice());
    }

    @Test
    void calculatePrice_kmType() {
        // 10 km at 5 = 50
        assertEquals(50, createPerformedTask(10.0, 5, UnitType.KM).calculatePrice());
    }
}
