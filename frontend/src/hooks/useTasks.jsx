import { useState } from "react";
import { getJSON } from "../api/api.js";
import { showErrorToast } from "../utils/errorHandler.jsx";
import { CloudAlert } from "lucide-react";
import { sortByKey } from "../utils/sorting.js";

export function useTasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const tasks = await getJSON("/tasks");
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
