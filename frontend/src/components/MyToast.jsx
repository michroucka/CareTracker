import {addToast} from "@heroui/react";
import {X} from "lucide-react";
import React from "react";

/**
 * Wrapper pro addToast s přednastavenými defaultními hodnotami
 *
 * @param {Object} options - Nastavení toastu
 * @param {string} options.title - Titulek toastu
 * @param {string} [options.description] - Popisek toastu
 * @param {string} [options.color="default"] - Barva: default, primary, secondary, success, warning, danger
 * @param {ReactNode} [options.icon] - Custom ikona (vlevo)
 * @param {ReactNode} [options.closeIcon=<X />] - Ikona pro zavření
 * @param {number} [options.timeout=5000] - Doba zobrazení v ms
 * @param {Object} [options.classNames] - Custom CSS třídy pro části toastu
 * @param {...any} otherProps - Další props pro addToast
 * @returns {string} ID toastu
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