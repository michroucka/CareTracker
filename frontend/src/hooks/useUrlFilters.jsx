import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Custom hook pro správu filtrů s automatickou synchronizací s URL params
 *
 * @param {Object} config - Konfigurace filtrů
 * @param {Object} config.filters - Definice filtrů { filterName: { type: 'string' | 'set' | 'multiset', defaultValue, urlParam } }
 * @returns {Object} - { filters, handlers, updateUrl }
 */
export function useUrlFilters(config) {
    const [searchParams, setSearchParams] = useSearchParams();
    const previousUrlParams = useRef("");
    const hasInitialized = useRef(false);

    // Vytvoř state pro každý filtr
    const [filters, setFilters] = useState(() => {
        const initialFilters = {};
        Object.entries(config).forEach(([name, filterConfig]) => {
            initialFilters[name] = filterConfig.defaultValue;
        });
        return initialFilters;
    });

    // Načti filtry z URL při mountu nebo změně URL
    useEffect(() => {
        const currentUrlParams = searchParams.toString();

        // Pokud se URL nezměnilo (změna z našeho useEffectu níže), neprovádět nic
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
                // Převést URL hodnotu na správný typ
                if (filterConfig.type === 'set' || filterConfig.type === 'multiset') {
                    newFilters[name] = new Set(paramValue.split(","));
                } else {
                    newFilters[name] = paramValue;
                }
                hasChanges = true;
            } else if (!hasInitialized.current) {
                // Při prvním načtení nastav default hodnoty
                newFilters[name] = filterConfig.defaultValue;
            }
        });

        if (hasChanges || !hasInitialized.current) {
            setFilters(prev => ({ ...prev, ...newFilters }));
        }

        hasInitialized.current = true;
    }, [searchParams, config]);

    // Aktualizuj URL při změně filtrů
    useEffect(() => {
        if (!hasInitialized.current) return;

        const params = new URLSearchParams();

        Object.entries(config).forEach(([name, filterConfig]) => {
            const value = filters[name];
            const urlParam = filterConfig.urlParam || name;

            // Přidej do URL jen pokud se liší od defaultu
            const isDefault =
                (filterConfig.type === 'set' || filterConfig.type === 'multiset')
                    ? setsEqual(value, filterConfig.defaultValue)
                    : value === filterConfig.defaultValue;

            if (!isDefault && value) {
                if (filterConfig.type === 'set' || filterConfig.type === 'multiset') {
                    // Pro multiset ignoruj "all"
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

    // Helper funkce pro porovnání Sets
    const setsEqual = (a, b) => {
        if (!a || !b) return false;
        if (a.size !== b.size) return false;
        for (let item of a) {
            if (!b.has(item)) return false;
        }
        return true;
    };

    // Vytvoř setter pro každý filtr
    const setFilter = useCallback((name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    }, []);

    // Vytvoř handler pro multiselect filtry (s logikou "all")
    const createMultiSelectHandler = useCallback((name) => {
        return (keys) => {
            const newKeys = new Set(keys);
            const currentValue = filters[name];

            if (newKeys.has("all") && !currentValue.has("all")) {
                // Vybrali "all" -> nastav jen "all"
                setFilter(name, new Set(["all"]));
            } else if (newKeys.size > 1 && newKeys.has("all")) {
                // Vybrali něco jiného když bylo "all" -> odstraň "all"
                newKeys.delete("all");
                setFilter(name, newKeys);
            } else if (newKeys.size === 0) {
                // Zrušili všechno -> nastav "all"
                setFilter(name, new Set(["all"]));
            } else {
                setFilter(name, newKeys);
            }
        };
    }, [filters, setFilter]);

    // Vytvoř handlery pro všechny filtry
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
