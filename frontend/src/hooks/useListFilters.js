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

/**
 * Multi-select filter kept in the URL as a comma separated list (`?departments=1,4`).
 * An empty Set means "all". `initialValue` is used when the URL has no such param.
 */
export function useMultiSelectParam(key, initialValue = []) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [selected, setSelected] = React.useState(() => {
        const param = searchParams.get(key);
        if (param === null) return new Set(initialValue.map(String));
        return param === "all" ? new Set() : new Set(param.split(",").filter(Boolean));
    });

    React.useEffect(() => {
        setSearchParams((previous) => {
            const next = new URLSearchParams(previous);
            next.set(key, selected.size === 0 ? "all" : [...selected].join(","));
            return next;
        }, { replace: true });
    }, [key, selected, setSearchParams]);

    return [selected, setSelected];
}
