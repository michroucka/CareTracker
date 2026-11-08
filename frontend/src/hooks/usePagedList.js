import React from "react";
import { pageCountOf } from "@/lib/pagination";
import { usePageParam } from "./useListFilters";

export const PAGE_SIZE = 25;

/**
 * Client-side pagination of an already filtered and sorted list, with the page kept in the URL.
 *
 * Returns the rows of the current page, props for `TablePagination`, a `tableRef` to put on the table
 * (a page change scrolls back to its start) and `withPageReset(setter)`, which wraps a filter setter
 * so that changing the filter goes back to the first page. A change of `resetKey` (e.g. the organization
 * a superadmin works in) goes back to the first page too.
 */
export function usePagedList(items, { resetKey, pageSize = PAGE_SIZE } = {}) {
    const [page, setPage] = usePageParam();
    const tableRef = React.useRef(null);

    const previousResetKey = React.useRef(resetKey);
    React.useEffect(() => {
        if (previousResetKey.current !== resetKey) setPage(1);
        previousResetKey.current = resetKey;
    }, [resetKey, setPage]);

    // the page from the URL may point past the end once the list gets shorter
    const currentPage = Math.min(page, pageCountOf(items.length, pageSize));
    const pageItems = React.useMemo(
        () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [items, currentPage, pageSize]
    );

    const changePage = (nextPage) => {
        setPage(nextPage);
        // the pagination bar sticks to the bottom, so bring the start of the new page into view
        if (tableRef.current?.getBoundingClientRect().top < 0) tableRef.current.scrollIntoView({ block: "start" });
    };

    const withPageReset = (setter) => (value) => {
        setter(value);
        setPage(1);
    };

    return {
        pageItems,
        tableRef,
        withPageReset,
        paginationProps: { page: currentPage, pageSize, totalCount: items.length, onPageChange: changePage },
    };
}
