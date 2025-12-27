import React from "react";
import { DeleteConfirmationModal } from "../DeleteConfirmationModal.jsx";

export function PerformedTaskDeleteModal({ isOpen, onClose, onSubmit, performedTaskId }) {
    return (
        <DeleteConfirmationModal
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={onSubmit}
            itemId={performedTaskId}
            title="Smazat vykonaný úkon"
            message="Opravdu chcete smazat tento vykonaný úkon?"
        />
    );
}
