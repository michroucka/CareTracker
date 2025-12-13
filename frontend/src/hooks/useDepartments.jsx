import { useState } from "react";
import { getJSON } from "../api/api.js";
import { showErrorToast } from "../utils/errorHandler.jsx";
import { CloudAlert } from "lucide-react";
import { sortByKey } from "../utils/sorting.js";

export function useDepartments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const departments = await getJSON("/departments");
            const sorted = sortByKey(departments, 'city', 'ascending');
            setDepartments(sorted);
        } catch (err) {
            console.error("Error fetching departments:", err);
            showErrorToast(err, "Chyba při načítání oddělení", { icon: <CloudAlert /> });
        } finally {
            setLoading(false);
        }
    };

    return {
        departments,
        loading,
        fetchDepartments,
    };
}
