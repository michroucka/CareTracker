import { useState } from "react";
import { getJSON } from "../api/api.js";
import { showErrorToast } from "../utils/errorHandler.jsx";
import { CloudAlert } from "lucide-react";
import { sortByKey } from "../utils/sorting.js";

export function useEmployees() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const employees = await getJSON("/employees");
            // Add fullName field for sorting
            const employeesWithFullName = employees.map(emp => ({
                ...emp,
                fullName: `${emp.firstName} ${emp.lastName}`
            }));
            const sorted = sortByKey(employeesWithFullName, 'fullName', 'ascending');
            setEmployees(sorted);
        } catch (err) {
            console.error("Error fetching employees:", err);
            showErrorToast(err, "Chyba při načítání zaměstnanců", { icon: <CloudAlert /> });
        } finally {
            setLoading(false);
        }
    };

    return {
        employees,
        loading,
        fetchEmployees,
    };
}
