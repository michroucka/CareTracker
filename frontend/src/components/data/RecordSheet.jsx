import { AnimatePresence, motion } from "motion/react";
import { IconLoader2 } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DURATION, EASE_OUT } from "@/lib/motion";

const AnimatedPanel = motion.div;

/**
 * Record detail sheet following the approved layout (PLAN.md 2.6, catalog "Sheet – detail úkonu"):
 * badge + meta, large title, actions under the title, scrolling body, footer only while editing.
 * `contentKey` switches the body with a crossfade (e.g. "view" / "edit").
 */
export function RecordSheet({
    open,
    onOpenChange,
    badge,
    meta,
    title,
    description,
    actions,
    footer,
    isLoading = false,
    contentKey,
    children,
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full gap-0 sm:max-w-md">
                <SheetHeader className="gap-3 border-b p-5 pr-14">
                    <div className="flex flex-wrap items-center gap-2">
                        {badge && <Badge variant="secondary">{badge}</Badge>}
                        {meta}
                    </div>
                    <SheetTitle className="font-display text-2xl font-semibold tracking-tight">
                        {isLoading ? "Načítám…" : title}
                    </SheetTitle>
                    <SheetDescription className="sr-only">{description ?? title}</SheetDescription>
                    {!isLoading && actions && <div className="flex flex-wrap gap-2">{actions}</div>}
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-5">
                    {isLoading ? (
                        <div className="grid place-items-center py-16 text-muted-foreground" role="status" aria-label="Načítání">
                            <IconLoader2 className="size-6 animate-spin" />
                        </div>
                    ) : (
                        <AnimatePresence mode="wait" initial={false}>
                            <AnimatedPanel
                                key={contentKey}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: DURATION.base, ease: EASE_OUT }}
                            >
                                {children}
                            </AnimatedPanel>
                        </AnimatePresence>
                    )}
                </div>

                {footer && <SheetFooter className="flex-row justify-end border-t p-4">{footer}</SheetFooter>}
            </SheetContent>
        </Sheet>
    );
}

/** Small uppercase section label used inside record sheets. */
export function SheetSection({ label, children }) {
    return (
        <section className="grid gap-3">
            <h3 className="font-sans text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</h3>
            {children}
        </section>
    );
}
