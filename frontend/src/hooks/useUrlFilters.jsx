import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Manages filter state with automatic two-way synchronization to URL search params.
 * Reads initial values from the URL on mount and updates the URL whenever filters change.
 * Supports three filter types:
 *  - {@code 'string'}: plain string value stored as-is in the URL
 *  - {@code 'set'}: a Set serialized as comma-separated values in the URL
 *  - {@code 'multiset'}: like set but treats the special value {@code "all"} as "no filter"
 *    (omitted from the URL when "all" is selected)
 *
 * @param {Record<string, { type: 'string'|'set'|'multiset', defaultValue: any, urlParam?: string }>} config
 *   filter definitions keyed by filter name
 * @returns {{ filters: Object, setFilter: Function, handlers: Object, hasInitialized: boolean }}
 */
export function useUrlFilters(config) {
    const [searchParams, setSearchParams] = useSearchParams();
    const previousUrlParams = useRef("");
    const hasInitialized = useRef(false);

    const [filters, setFilters] = useState(() => {
        const initialFilters = {};
        Object.entries(config).forEach(([name, filterConfig]) => {
            initialFilters[name] = filterConfig.defaultValue;
        });
        return initialFilters;
    });

    useEffect(() => {
        const currentUrlParams = searchParams.toString();

        // Skip if the URL change was triggered by our own filter→URL sync below
        if (currentUrlParams === previousUrlParams.current) {
            return;
        }

        previousUrlParams.current = currentUrlParams;

        const newFilters = {};
        let hasChanges = false;

        Object.entries(config).forEach(([name, filterConfig]) => {
            const urlParam = filterConfig.urlParam || name;
            const paramValue = searchParams.get(urlParam);

            if (paramValue) {
                if (filterConfig.type === 'set' || filterConfig.type === 'multiset') {
                    newFilters[name] = new Set(paramValue.split(","));
                } else {
                    newFilters[name] = paramValue;
                }
                hasChanges = true;
            } else if (!hasInitialized.current) {
                newFilters[name] = filterConfig.defaultValue;
            }
        });

        if (hasChanges || !hasInitialized.current) {
            setFilters(prev => ({ ...prev, ...newFilters }));
        }

        hasInitialized.current = true;
    }, [searchParams, config]);

    useEffect(() => {
        if (!hasInitialized.current) return;

        const params = new URLSearchParams();

        Object.entries(config).forEach(([name, filterConfig]) => {
            const value = filters[name];
            const urlParam = filterConfig.urlParam || name;

            const isDefault =
                (filterConfig.type === 'set' || filterConfig.type === 'multiset')
                    ? setsEqual(value, filterConfig.defaultValue)
                    : value === filterConfig.defaultValue;

            if (!isDefault && value) {
                if (filterConfig.type === 'set' || filterConfig.type === 'multiset') {
                    // "all" means no filter — omit from URL so it stays clean
                    if (filterConfig.type === 'multiset' && value.has("all")) {
                        return;
                    }
                    params.set(urlParam, Array.from(value).join(","));
                } else {
                    params.set(urlParam, value);
                }
            }
        });

        const currentParams = searchParams.toString();
        const newParams = params.toString();

        if (currentParams !== newParams) {
            previousUrlParams.current = newParams;
            setSearchParams(params, { replace: true });
        }
    }, [filters, config, searchParams, setSearchParams]);

    const setsEqual = (a, b) => {
        if (!a || !b) return false;
        if (a.size !== b.size) return false;
        for (let item of a) {
            if (!b.has(item)) return false;
        }
        return true;
    };

    const setFilter = useCallback((name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    }, []);

    /**
     * Creates a selection handler that enforces "all" mutual exclusivity:
     * selecting "all" clears other selections; selecting something else removes "all".
     */
    const createMultiSelectHandler = useCallback((name) => {
        return (keys) => {
            const newKeys = new Set(keys);
            const currentValue = filters[name];

            if (newKeys.has("all") && !currentValue.has("all")) {
                setFilter(name, new Set(["all"]));
            } else if (newKeys.size > 1 && newKeys.has("all")) {
                // Something specific selected while "all" was active — drop "all"
                newKeys.delete("all");
                setFilter(name, newKeys);
            } else if (newKeys.size === 0) {
                // Everything deselected — fall back to "all"
                setFilter(name, new Set(["all"]));
            } else {
                setFilter(name, newKeys);
            }
        };
    }, [filters, setFilter]);

    const handlers = {};
    Object.entries(config).forEach(([name, filterConfig]) => {
        if (filterConfig.type === 'multiset') {
            handlers[name] = createMultiSelectHandler(name);
        } else {
            handlers[name] = (value) => setFilter(name, value);
        }
    });

    return {
        filters,
        setFilter,
        handlers,
        hasInitialized: hasInitialized.current
    };
}
