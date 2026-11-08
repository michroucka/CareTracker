/** Number of pages for a list; an empty list still has one (empty) page. */
export function pageCountOf(totalCount, pageSize) {
    return Math.max(1, Math.ceil(totalCount / pageSize));
}
