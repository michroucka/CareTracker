import React from "react";
import { useSearchParams } from "react-router-dom";
import { useSearchParamsUpdater } from "./useSearchParamsUpdater";
import { MIN_YEAR } from "../constants/globalConstants.js";

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
    const [searchParams] = useSearchParams();
    const updateSearchParams = useSearchParamsUpdater();
    const [search, setSearch] = useTextParam("search");
    const [statusFilter, setStatusFilter] = React.useState(() => statusFromParam(searchParams.get("status")));

    React.useEffect(() => {
        updateSearchParams((next) => {
            next.set("status", statusToParam(statusFilter));
        }, { replace: true });
    }, [statusFilter, updateSearchParams]);

    const apiStatus = statusFilter.size === 2 ? undefined : statusFilter.has("true");

    return { search, setSearch, statusFilter, setStatusFilter, apiStatus };
}

/**
 * Multi-select filter kept in the URL as a comma separated list (`?departments=1,4`).
 * An empty Set means "all". `initialValue` is used when the URL has no such param.
 */
export function useMultiSelectParam(key, initialValue = []) {
    const [searchParams] = useSearchParams();
    const updateSearchParams = useSearchParamsUpdater();
    const [selected, setSelected] = React.useState(() => {
        const param = searchParams.get(key);
        if (param === null) return new Set(initialValue.map(String));
        return param === "all" ? new Set() : new Set(param.split(",").filter(Boolean));
    });

    React.useEffect(() => {
        updateSearchParams((next) => {
            next.set(key, selected.size === 0 ? "all" : [...selected].join(","));
        }, { replace: true });
    }, [key, selected, updateSearchParams]);

    return [selected, setSelected];
}

/** Text kept in the URL (`?search=…`); the param is removed when the text is empty. */
export function useTextParam(key) {
    const [searchParams] = useSearchParams();
    const updateSearchParams = useSearchParamsUpdater();
    const [text, setText] = React.useState(() => searchParams.get(key) ?? "");

    React.useEffect(() => {
        updateSearchParams((next) => {
            if (text) next.set(key, text);
            else next.delete(key);
        }, { replace: true });
    }, [key, text, updateSearchParams]);

    return [text, setText];
}

function monthFromParams(searchParams) {
    const today = new Date();
    const month = Number(searchParams.get("month"));
    const year = Number(searchParams.get("year"));
    const isValid = month >= 1 && month <= 12 && year >= MIN_YEAR
        && (year < today.getFullYear() || (year === today.getFullYear() && month - 1 <= today.getMonth()));
    return isValid ? { month: month - 1, year } : { month: today.getMonth(), year: today.getFullYear() };
}

/**
 * Selected month kept in the URL as `?month=11&year=2026` (1-based in the URL, 0-based `month` in state).
 * Defaults to the current month; future months fall back to it too.
 */
export function useMonthParam() {
    const [searchParams] = useSearchParams();
    const updateSearchParams = useSearchParamsUpdater();
    const [period, setPeriod] = React.useState(() => monthFromParams(searchParams));

    React.useEffect(() => {
        updateSearchParams((next) => {
            next.set("month", String(period.month + 1));
            next.set("year", String(period.year));
        }, { replace: true });
    }, [period, updateSearchParams]);

    return [period, setPeriod];
}

/** 1-based page number kept in the URL as `?page=3`; the param is left out on the first page. */
export function usePageParam() {
    const [searchParams] = useSearchParams();
    const updateSearchParams = useSearchParamsUpdater();
    const [page, setPage] = React.useState(() => Math.max(1, Math.floor(Number(searchParams.get("page"))) || 1));

    React.useEffect(() => {
        updateSearchParams((next) => {
            if (page > 1) next.set("page", String(page));
            else next.delete("page");
        }, { replace: true });
    }, [page, updateSearchParams]);

    return [page, setPage];
}
