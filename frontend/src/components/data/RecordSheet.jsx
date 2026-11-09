import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconDots, IconLoader2, IconPencil } from "@tabler/icons-react";
import { PersonAvatar } from "@/components/PersonAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

const AnimatedPanel = motion.div;

/**
 * Record detail sheet following the approved layout (PLAN.md 2.6, catalog "Sheet – detail úkonu"):
 * badge + meta, large title with an optional `avatar` and muted `subtitle`, scrolling body and actions in the footer.
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
    avatar,
    description,
    onEdit,
    moreActions,
    footer,
    isLoading = false,
    contentKey,
    children,
}) {
    // Sheets open from table rows (state in the URL), not from a trigger button, so Radix has nothing to
    // return focus to; give it back to the row that opened the sheet, as long as that row is still there.
    const openerRef = React.useRef(null);
    const returnFocus = (event) => {
        if (openerRef.current?.isConnected) {
            event.preventDefault();
            openerRef.current.focus();
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                className="w-full gap-0 sm:max-w-md"
                onOpenAutoFocus={() => { openerRef.current = document.activeElement; }}
                onCloseAutoFocus={returnFocus}
            >
                <SheetHeader className="gap-0 p-0">
                    <div className="flex h-15 items-center gap-2 border-b pr-14 pl-5">
                        {badge && <Badge variant="secondary">{badge}</Badge>}
                        {meta}
                    </div>
                    <div className="flex items-center gap-4 px-5 pt-5">
                        {!isLoading && avatar}
                        <div className="grid min-w-0 gap-1">
                            <SheetTitle className="font-display text-2xl font-semibold tracking-tight">
                                {isLoading ? "Načítám…" : title}
                            </SheetTitle>
                            {!isLoading && subtitle && <p className="text-sm text-muted-foreground tabular-nums">{subtitle}</p>}
                        </div>
                    </div>
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

/** Muted tile with a key number at the top of a record sheet; `hint` adds a small line under the value. */
export function SheetSummaryTile({ label, value, hint, valueClassName = "text-2xl" }) {
    return (
        <div className="rounded-lg bg-muted p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn("font-display font-semibold tabular-nums", valueClassName)}>{value}</p>
            {hint && <p className="text-xs text-muted-foreground tabular-nums">{hint}</p>}
        </div>
    );
}

/** Person row: photo or initials, name, optional muted `description` and an action (`children`) on the right. */
export function SheetPerson({ name, src, description, children }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
                <PersonAvatar name={name} src={src} />
                <div className="min-w-0">
                    <p className="truncate font-medium">{name}</p>
                    {description && <p className="truncate text-sm text-muted-foreground">{description}</p>}
                </div>
            </div>
            {children}
        </div>
    );
}
