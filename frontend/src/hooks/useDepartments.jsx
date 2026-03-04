import { useState } from "react";
import { getJSON } from "../api/api.js";
import { showErrorToast } from "../utils/errorHandler.jsx";
import { CloudAlert } from "lucide-react";
import { sortByKey } from "../utils/sorting.js";

export function useDepartments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchDepartments = async (filters = {}) => {
        try {
            setDepartments([]);
            setLoading(true);

            const params = new URLSearchParams();

            if (filters.organizationId) {
                params.append("organizationId", filters.organizationId);
            }
            if (filters.status !== undefined && filters.status !== null) {
                params.append("status", filters.status);
            }

            const queryString = params.toString();
            const url = queryString ? `/departments?${queryString}` : "/departments";
            const departments = await getJSON(url);

            const sorted = sortByKey(departments, 'name', 'ascending');
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
