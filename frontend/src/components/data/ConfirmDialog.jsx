import React from "react";
import { IconLoader2 } from "@tabler/icons-react";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/**
 * Confirmation for irreversible or significant actions. `onConfirm` may be async; the dialog
 * shows progress and closes only when it succeeds.
 */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, destructive = false, onConfirm }) {
    const [isPending, setIsPending] = React.useState(false);

    const confirm = async () => {
        setIsPending(true);
        try {
            await onConfirm();
            onOpenChange(false);
        } catch {
            // the caller already shows an error toast; keep the dialog open
        } finally {
            setIsPending(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Zrušit</AlertDialogCancel>
                    <Button variant={destructive ? "destructive" : "default"} onClick={confirm} disabled={isPending}>
                        {isPending && <IconLoader2 className="animate-spin" />}
                        {confirmLabel}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
