import { toast } from "@/components/ui/sonner";

/**
 * Displays an error toast with the message from the error object.
 * @param {Error} error
 * @param {string} [defaultTitle="Chyba"] toast title
 */
export function showErrorToast(error, defaultTitle = "Chyba") {
    toast.error(defaultTitle, { description: error?.message || "Nastala neočekávaná chyba" });
}
