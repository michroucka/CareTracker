import React from "react";
import { useValueChange } from "./useValueChange";

/** Edit mode of a record sheet. Closing the sheet leaves edit mode, so it opens next time on the record view. */
export function useEditingWhileOpen(open) {
    const [isEditing, setIsEditing] = React.useState(false);
    useValueChange(open, (isOpen) => {
        if (!isOpen) setIsEditing(false);
    });
    return [isEditing, setIsEditing];
}
