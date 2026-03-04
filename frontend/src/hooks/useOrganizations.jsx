import { useState } from "react";
import { getJSON } from "../api/api.js";
import { showErrorToast } from "../utils/errorHandler.jsx";
import { CloudAlert } from "lucide-react";
import { sortByKey } from "../utils/sorting.js";

export function useOrganizations() {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchOrganizations = async (filters = {}) => {
        try {
            setLoading(true);

            const params = new URLSearchParams();

            if (filters.status !== undefined && filters.status !== null) {
                params.append("status", filters.status);
            }

            const queryString = params.toString();
            const url = queryString ? `/organizations?${queryString}` : "/organizations";
            const organizations = await getJSON(url);
            const sorted = sortByKey(organizations, 'name', 'ascending');
            setOrganizations(sorted);
        } catch (err) {
            console.error("Error fetching organizations:", err);
            showErrorToast(err, "Chyba při načítání organizací", { icon: <CloudAlert /> });
        } finally {
            setLoading(false);
        }
    };

    return {
        organizations,
        loading,
        fetchOrganizations,
    };
}
