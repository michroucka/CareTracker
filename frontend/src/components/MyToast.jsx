import {addToast} from "@heroui/react";
import {X} from "lucide-react";
import React from "react";

/**
 * Wrapper around {@link addToast} with sensible defaults and consistent close button positioning.
 *
 * @param {Object} options
 * @param {string} options.title toast title
 * @param {string} [options.description] toast body text
 * @param {string} [options.color="default"] color variant: default, primary, secondary, success, warning, danger
 * @param {ReactNode} [options.icon] custom left icon
 * @param {ReactNode} [options.closeIcon=<X />] close button icon
 * @param {number} [options.timeout=5000] auto-dismiss delay in ms
 * @param {Object} [options.classNames] CSS class overrides for toast parts
 * @param {...any} otherProps additional props forwarded to addToast
 * @returns {string} the toast ID
 */
export const showToast = ({
    title,
    description,
    color = "default",
    icon,
    closeIcon = <X />,
    timeout = 5000,
    classNames,
    ...otherProps
}) => {
    return addToast({
        title,
        description,
        color,
        icon,
        closeIcon,
        timeout,
        classNames: {
            closeButton: "opacity-100 absolute right-4 top-1/2 -translate-y-1/2 size-9 sm:size-7",
            title: "text-lg sm:text-base pr-2",
            description: "opacity-75 text-base sm:text-sm",
            icon: "size-8 sm:size-7 fill-none",
            ...classNames,
        },
        ...otherProps
    });
};
