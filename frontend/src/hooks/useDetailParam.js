import { useSearchParams } from "react-router-dom";

/**
 * Record detail state kept in the URL as `?detail=<id>`, so the browser back button closes the
 * detail sheet and the link can be shared. Other search params (filters) are preserved.
 */
export function useDetailParam() {
    const [searchParams, setSearchParams] = useSearchParams();
    const rawId = searchParams.get("detail");

    const openDetail = (id) => {
        setSearchParams((previous) => {
            const next = new URLSearchParams(previous);
            next.set("detail", String(id));
            return next;
        });
    };

    const closeDetail = () => {
        setSearchParams((previous) => {
            const next = new URLSearchParams(previous);
            next.delete("detail");
            return next;
        });
    };

    return { detailId: rawId ? Number(rawId) : null, openDetail, closeDetail };
}
