import React from "react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Password input with a show/hide toggle. Accepts all Input props; pass `isVisible` and
 * `onVisibleChange` to share the visibility between two fields (password + confirmation).
 */
export function PasswordInput({ className, isVisible: isVisibleProp, onVisibleChange, disabled, ...props }) {
    const [isVisibleState, setIsVisibleState] = React.useState(false);
    const isVisible = isVisibleProp ?? isVisibleState;
    const setIsVisible = onVisibleChange ?? setIsVisibleState;
    const Icon = isVisible ? IconEyeOff : IconEye;

    return (
        <div className="relative">
            <Input {...props} disabled={disabled} type={isVisible ? "text" : "password"} className={cn("pr-11", className)} />
            <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                disabled={disabled}
                aria-label={isVisible ? "Skrýt heslo" : "Zobrazit heslo"}
                aria-pressed={isVisible}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-md text-muted-foreground transition-colors duration-base ease-out outline-none hover:text-foreground focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
            >
                <Icon className="size-5" />
            </button>
        </div>
    );
}
