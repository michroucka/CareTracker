import React from "react";
import { getJSON } from "../api/api.js";

/**
 * Active clients the employee is the key worker for and the employee's performed tasks in the current month.
 * Returns null while loading; `failed` is set when the data could not be loaded.
 */
export function useEmployeeOverview(employeeId, organizationId) {
    const [overview, setOverview] = React.useState(null);

    React.useEffect(() => {
        setOverview(null);
        if (!employeeId) return undefined;

        const controller = new AbortController();
        const now = new Date();
        const organization = organizationId ? `&organizationId=${organizationId}` : "";
        Promise.all([
            getJSON(`/clients?status=true&caregiverIds=${employeeId}${organization}`, { signal: controller.signal }),
            getJSON(`/performed-tasks?caregiverIds=${employeeId}&month=${now.getMonth() + 1}&year=${now.getFullYear()}${organization}`, { signal: controller.signal }),
        ])
            .then(([clients, performedTasks]) => setOverview({ clients, performedTasks }))
            .catch((error) => {
                if (error.name !== "AbortError") setOverview({ clients: [], performedTasks: [], failed: true });
            });
        return () => controller.abort();
    }, [employeeId, organizationId]);

    return overview;
}
