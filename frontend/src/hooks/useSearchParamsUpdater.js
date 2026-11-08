import React from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Updates some URL search params and keeps the rest. `update(params)` mutates a copy of the current params.
 *
 * React Router hands a functional `setSearchParams` the params of the last render, so several hooks
 * updating the URL in the same tick (filters on page load) would overwrite each other. This reads
 * the live URL instead, which the previous navigation has already replaced.
 *
 * The returned function keeps its identity (setSearchParams changes with every URL change), so
 * callbacks built on it can be passed to memoized rows.
 */
export function useSearchParamsUpdater() {
    const [, setSearchParams] = useSearchParams();
    const setSearchParamsRef = React.useRef(setSearchParams);

    React.useLayoutEffect(() => {
        setSearchParamsRef.current = setSearchParams;
    }, [setSearchParams]);

    return React.useCallback((update, options) => {
        setSearchParamsRef.current(() => {
            const next = new URLSearchParams(window.location.search);
            update(next);
            return next;
        }, options);
    }, []);
}
