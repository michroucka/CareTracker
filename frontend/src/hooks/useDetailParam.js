import React from "react";
import { useSearchParams } from "react-router-dom";
import { useSearchParamsUpdater } from "./useSearchParamsUpdater";

/**
 * Record detail state kept in the URL as `?detail=<id>`, so the browser back button closes the
 * detail sheet and the link can be shared. Other search params (filters) are preserved.
 */
export function useDetailParam() {
    const [searchParams] = useSearchParams();
    const updateSearchParams = useSearchParamsUpdater();
    const rawId = searchParams.get("detail");

    const openDetail = React.useCallback((id) => {
        updateSearchParams((next) => {
            next.set("detail", String(id));
        });
    }, [updateSearchParams]);

    const closeDetail = React.useCallback(() => {
        updateSearchParams((next) => {
            next.delete("detail");
        });
    }, [updateSearchParams]);

    return { detailId: rawId ? Number(rawId) : null, openDetail, closeDetail };
}
