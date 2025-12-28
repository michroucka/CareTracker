import { useState } from "react";
import { getJSON } from "../api/api.js";
import { showErrorToast } from "../utils/errorHandler.jsx";
import { CloudAlert } from "lucide-react";
import { sortByKey } from "../utils/sorting.js";

export function useOrganizations() {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchOrganizations = async () => {
        try {
            setLoading(true);
            const organizations = await getJSON("/organizations");
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
