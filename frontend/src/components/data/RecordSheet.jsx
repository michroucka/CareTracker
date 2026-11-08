import { AnimatePresence, motion } from "motion/react";
import { IconDots, IconLoader2, IconPencil } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DURATION, EASE_OUT } from "@/lib/motion";

const AnimatedPanel = motion.div;

/**
 * Record detail sheet following the approved layout (PLAN.md 2.6, catalog "Sheet – detail úkonu"):
 * badge + meta, large title with an optional muted `subtitle`, scrolling body and actions in the footer.
 *
 * In view mode the footer shows "⋯" with `moreActions` (DropdownMenuItems) on the left and "Upravit"
 * (`onEdit`) on the right; while editing the sheet passes its own `footer` (Zrušit / Uložit) instead.
 * `contentKey` switches the body with a crossfade (e.g. "view" / "edit").
 */
export function RecordSheet({
    open,
    onOpenChange,
    badge,
    meta,
    title,
    subtitle,
    description,
    onEdit,
    moreActions,
    footer,
    isLoading = false,
    contentKey,
    children,
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full gap-0 sm:max-w-md">
                <SheetHeader className="gap-0 p-0">
                    <div className="flex h-15 items-center gap-2 border-b pr-14 pl-5">
                        {badge && <Badge variant="secondary">{badge}</Badge>}
                        {meta}
                    </div>
                    <SheetTitle className="px-5 pt-5 font-display text-2xl font-semibold tracking-tight">
                        {isLoading ? "Načítám…" : title}
                    </SheetTitle>
                    {!isLoading && subtitle && <p className="mt-1 px-5 text-sm text-muted-foreground tabular-nums">{subtitle}</p>}
                    <SheetDescription className="sr-only">{description ?? title}</SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-5 pt-4">
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

                {footer ? (
                    <SheetFooter className="flex-row justify-end border-t p-4">{footer}</SheetFooter>
                ) : !isLoading && (onEdit || moreActions) && (
                    <SheetFooter className="flex-row items-center justify-between border-t p-4">
                        {moreActions ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" aria-label="Další akce"><IconDots /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="top" align="start">{moreActions}</DropdownMenuContent>
                            </DropdownMenu>
                        ) : <span />}
                        {onEdit && <Button onClick={onEdit}><IconPencil /> Upravit</Button>}
                    </SheetFooter>
                )}
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
