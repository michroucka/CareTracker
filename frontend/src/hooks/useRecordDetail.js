import React from "react";

/**
 * Record shown in a detail sheet, loaded whenever `detailId` changes. Until the record of the current id
 * arrives the detail is null, so the sheet shows its loader instead of the previously opened record.
 * A response for a record the user has already left is dropped.
 *
 * Returns `[detail, setDetail]`; `setDetail` replaces the record after an edit.
 */
export function useRecordDetail(detailId, fetchRecord, onLoadFailed) {
    const [record, setRecord] = React.useState(null);

    React.useEffect(() => {
        if (detailId == null) return undefined;
        let isCurrent = true;
        fetchRecord(detailId)
            .then((loaded) => isCurrent && setRecord(loaded))
            .catch(() => isCurrent && onLoadFailed());
        return () => {
            isCurrent = false;
        };
        // load whenever another record is opened
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detailId]);

    const detail = record != null && record.id === detailId ? record : null;
    return [detail, setRecord];
}
