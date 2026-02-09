import { useState } from "react";
import { getJSON } from "../api/api.js";
import { showErrorToast } from "../utils/errorHandler.jsx";
import { CloudAlert } from "lucide-react";
import { sortByKey } from "../utils/sorting.js";

export function useTasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchTasks = async (filters = {}) => {
        try {
            setTasks([]);
            setLoading(true);

            const params = new URLSearchParams();

            if (filters.organizationId) {
                params.append("organizationId", filters.organizationId);
            }

            if (filters.status !== undefined && filters.status !== null) {
                params.append("status", filters.status);
            }

            const queryString = params.toString();
            const url = queryString ? `/tasks?${queryString}` : "/tasks";
            const tasks = await getJSON(url);

            const sorted = sortByKey(tasks, 'name', 'ascending');
            setTasks(sorted);
        } catch (err) {
            console.error("Error fetching tasks:", err);
            showErrorToast(err, "Chyba při načítání úkolů", { icon: <CloudAlert /> });
        } finally {
            setLoading(false);
        }
    };

    return {
        tasks,
        loading,
        fetchTasks,
    };
}
