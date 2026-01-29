import React from "react";
import { DeleteConfirmationModal } from "../DeleteConfirmationModal.jsx";

export function DailyRecordDeleteModal({ isOpen, onClose, onSubmit, dailyRecordId }) {
    return (
        <DeleteConfirmationModal
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={onSubmit}
            itemId={dailyRecordId}
            title="Smazat denní záznam"
            message="Opravdu chcete smazat tento denní záznam?"
        />
    );
}
