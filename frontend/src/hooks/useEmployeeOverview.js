import React from "react";
import { getJSON } from "../api/api.js";

/**
 * Active clients the employee is the key worker for and the employee's performed tasks in the current month.
 * Returns null while loading; `failed` is set when the data could not be loaded.
 */
export function useEmployeeOverview(employeeId, organizationId) {
    const requestKey = employeeId ? `${employeeId}:${organizationId ?? ""}` : null;
    // the overview is kept with the request it answers, so another employee shows the loader, not stale data
    const [loaded, setLoaded] = React.useState({ requestKey: null, overview: null });

    React.useEffect(() => {
        if (!requestKey) return undefined;

        const controller = new AbortController();
        const now = new Date();
        const organization = organizationId ? `&organizationId=${organizationId}` : "";
        Promise.all([
            getJSON(`/clients?status=true&caregiverIds=${employeeId}${organization}`, { signal: controller.signal }),
            getJSON(`/performed-tasks?caregiverIds=${employeeId}&month=${now.getMonth() + 1}&year=${now.getFullYear()}${organization}`, { signal: controller.signal }),
        ])
            .then(([clients, performedTasks]) => setLoaded({ requestKey, overview: { clients, performedTasks } }))
            .catch((error) => {
                if (error.name !== "AbortError") setLoaded({ requestKey, overview: { clients: [], performedTasks: [], failed: true } });
            });
        return () => controller.abort();
        // the request key covers both ids
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requestKey]);

    return loaded.requestKey === requestKey ? loaded.overview : null;
}
