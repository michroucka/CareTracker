import React from "react";
import { useSearchParams } from "react-router-dom";

function statusFromParam(param) {
    if (param === "all") return new Set(["true", "false"]);
    if (param === "false") return new Set(["false"]);
    return new Set(["true"]);
}

function statusToParam(statusFilter) {
    if (statusFilter.size === 2) return "all";
    return statusFilter.has("false") ? "false" : "true";
}

/**
 * Search text and active/inactive filter of a list page, kept in the URL (`?search=…&status=true|false|all`)
 * next to other params such as `detail`. `apiStatus` is the value for list endpoints
 * (true, false or undefined for both).
 */
export function useListFilters() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = React.useState(() => searchParams.get("search") ?? "");
    const [statusFilter, setStatusFilter] = React.useState(() => statusFromParam(searchParams.get("status")));

    React.useEffect(() => {
        setSearchParams((previous) => {
            const next = new URLSearchParams(previous);
            if (search) next.set("search", search);
            else next.delete("search");
            next.set("status", statusToParam(statusFilter));
            return next;
        }, { replace: true });
    }, [search, statusFilter, setSearchParams]);

    const apiStatus = statusFilter.size === 2 ? undefined : statusFilter.has("true");

    return { search, setSearch, statusFilter, setStatusFilter, apiStatus };
}
