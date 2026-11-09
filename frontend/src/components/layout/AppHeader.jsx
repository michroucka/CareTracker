import React from "react";
import { Link, useLocation } from "react-router-dom";
import { IconChevronLeft, IconChevronRight, IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand, IconMenu2 } from "@tabler/icons-react";
import { CareTrackerLogo } from "@/components/CareTrackerLogo";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./CommandPalette";
import { getBreadcrumbs, rememberListLocation } from "./navigation";

function SidebarToggle() {
    const { toggleSidebar, state, isMobile } = useSidebar();
    const isCollapsed = state === "collapsed";
    const Icon = isMobile ? IconMenu2 : isCollapsed ? IconLayoutSidebarLeftExpand : IconLayoutSidebarLeftCollapse;
    const label = isMobile ? "Otevřít menu" : isCollapsed ? "Rozbalit menu" : "Sbalit menu";

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={toggleSidebar} aria-label={label}>
                    <Icon />
                </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
                {label} <kbd className="ml-1 font-sans opacity-70">Ctrl B</kbd>
            </TooltipContent>
        </Tooltip>
    );
}

/**
 * Full trail from 640 px up. On phones the trail does not fit, so nested pages show a back link to the
 * parent instead (the current page's name is right below as the page title); top-level pages show their name.
 */
function Breadcrumbs() {
    const { pathname, search } = useLocation();

    React.useEffect(() => {
        rememberListLocation(pathname, search);
    }, [pathname, search]);

    const crumbs = getBreadcrumbs(pathname);
    const parent = crumbs.at(-2);

    return (
        <nav aria-label="Drobečková navigace" className="min-w-0">
            {parent && (
                <Link to={parent.to} className="-ml-1 flex min-w-0 items-center gap-0.5 rounded-sm px-1 text-sm font-medium text-foreground sm:hidden">
                    <IconChevronLeft className="size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{parent.label}</span>
                </Link>
            )}
            <ol className={cn("flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground", parent && "max-sm:hidden")}>
                {crumbs.map((crumb, index) => {
                    const isLast = index === crumbs.length - 1;
                    return (
                        <li key={crumb.label} className={isLast ? "min-w-0" : "flex shrink-0 items-center gap-1.5 max-sm:hidden"}>
                            {isLast ? (
                                <span aria-current="page" className="block truncate font-medium text-foreground">{crumb.label}</span>
                            ) : (
                                <>
                                    <Link to={crumb.to} className="rounded-sm transition-colors duration-base ease-out hover:text-foreground">
                                        {crumb.label}
                                    </Link>
                                    <IconChevronRight className="size-4" aria-hidden="true" />
                                </>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

export function AppHeader() {
    return (
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur md:px-4">
            <SidebarToggle />
            <Link to="/" className="flex items-center md:hidden" aria-label="CareTracker – nástěnka">
                <CareTrackerLogo small size="size-7" />
            </Link>
            <Breadcrumbs />
            <CommandPalette />
        </header>
    );
}
