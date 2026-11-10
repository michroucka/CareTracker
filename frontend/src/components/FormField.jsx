import React from "react";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import { Label } from "@/components/ui/label";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

const SHAKE_KEYFRAMES = { x: [0, -6, 6, -4, 4, 0] };

const AnimatedMessage = motion.p;

/**
 * Label above the control, hint/error below it. Shared by all form controls.
 *
 * The control is rendered through `children(controlProps)` so it receives the id and ARIA wiring.
 * Changing `shakeSignal` (e.g. a submit counter) shakes the field once if it has an error.
 */
export function FormField({ id, label, required = false, hint, error, shakeSignal, className, children }) {
    const [scope, animate] = useAnimate();
    // hint and error have their own ids: while the old message fades out both are in the page, and one shared
    // id would leave the control described by the outgoing text
    const messageId = error ? `${id}-error` : `${id}-hint`;
    const message = error || hint;

    React.useEffect(() => {
        if (shakeSignal && error && scope.current) {
            animate(scope.current, SHAKE_KEYFRAMES, { duration: DURATION.slow });
        }
        // shake only when a new submit happens, not when the error text changes while typing
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shakeSignal]);

    const controlProps = {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": message ? messageId : undefined,
        "aria-required": required || undefined,
    };

    return (
        <div ref={scope} className={cn("group grid gap-1.5", className)}>
            <Label
                htmlFor={id}
                className={cn(
                    "text-sm text-foreground transition-colors duration-fast ease-out group-focus-within:text-primary",
                    error && "text-destructive group-focus-within:text-destructive"
                )}
            >
                {label}
                {required && <span aria-hidden="true" className="text-highlight"> *</span>}
            </Label>

            {children(controlProps)}

            <AnimatePresence initial={false} mode="popLayout">
                {message && (
                    <AnimatedMessage
                        key={error ? "error" : "hint"}
                        id={messageId}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: DURATION.base, ease: EASE_OUT }}
                        className={cn("px-0.5 text-sm", error ? "text-destructive" : "text-muted-foreground")}
                    >
                        {message}
                    </AnimatedMessage>
                )}
            </AnimatePresence>
        </div>
    );
}
