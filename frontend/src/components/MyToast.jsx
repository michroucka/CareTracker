import {toast} from "@heroui/react";

export const showToast = ({
    title,
    description,
    color = "default",
    icon,
    timeout = 5000,
    ...otherProps
}) => {
    const options = {
        description,
        indicator: icon,
        timeout,
        ...otherProps,
    };

    switch (color) {
        case "success":
            return toast.success(title, options);
        case "danger":
            return toast.danger(title, options);
        case "warning":
            return toast.warning(title, options);
        default:
            return toast(title, options);
    }
};
