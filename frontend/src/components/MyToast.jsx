import { toast } from "@/components/ui/sonner";

const TOAST_BY_COLOR = {
    success: toast.success,
    danger: toast.error,
    warning: toast.warning,
    primary: toast.info,
    secondary: toast.info,
};

/**
 * Legacy toast API kept for pages that are not migrated yet; it now renders sonner toasts.
 * New code should call `toast` from "@/components/ui/sonner" directly.
 * The `icon`, `closeIcon` and `classNames` options are ignored, sonner picks the icon by type.
 *
 * @param {Object} options
 * @param {string} options.title toast title
 * @param {string} [options.description] toast body text
 * @param {string} [options.color="default"] default, primary, secondary, success, warning, danger
 * @param {number} [options.timeout=5000] auto-dismiss delay in ms
 * @returns {string|number} the toast ID
 */
export const showToast = ({ title, description, color = "default", timeout = 5000 }) => {
    const showByColor = TOAST_BY_COLOR[color] ?? toast;
    return showByColor(title, { description, duration: timeout });
};
