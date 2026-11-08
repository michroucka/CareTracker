import React from "react";
import { Link, useLocation } from "react-router-dom";
import { IconChevronRight, IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand, IconMenu2 } from "@tabler/icons-react";
import { CareTrackerLogo } from "@/components/CareTrackerLogo";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CommandPalette } from "./CommandPalette";
import { getBreadcrumbs } from "./navigation";

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

function Breadcrumbs() {
    const { pathname } = useLocation();
    const crumbs = getBreadcrumbs(pathname);

    return (
        <nav aria-label="Drobečková navigace" className="min-w-0">
            <ol className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
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
