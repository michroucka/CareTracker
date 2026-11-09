import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { IconBuildingCommunity, IconLogout, IconMoon, IconSelector, IconSun } from "@tabler/icons-react";
import { CareTrackerLogo } from "@/components/CareTrackerLogo";
import { CareTrackerWordmark } from "@/components/CareTrackerWordmark";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
    useSidebar,
} from "@/components/ui/sidebar";
import { getRoleLabel, hasRole, ROLES } from "@/constants/roles";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useOrganizations } from "@/hooks/useOrganizations";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { isNavItemActive, NAV_ITEMS } from "./navigation";

const ActiveIndicator = motion.span;

function initials(name) {
    return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function NavItems() {
    const { user } = useAuth();
    const { pathname } = useLocation();
    const { setOpenMobile } = useSidebar();

    const items = NAV_ITEMS.filter((item) => hasRole(user.role, item.allowedRoles));

    return (
        <SidebarMenu className="gap-0.5">
            {items.map((item) => {
                const isActive = isNavItemActive(item.path, pathname);
                const Icon = item.icon;
                return (
                    <SidebarMenuItem key={item.path}>
                        {/* Sibling of the button (not inside it): the button clips overflow, which would cut the tile mid-slide */}
                        {isActive && (
                            <ActiveIndicator
                                layoutId="sidebar-active-item"
                                className="absolute inset-0 rounded-md bg-sidebar-active shadow-xs"
                                transition={{ duration: DURATION.slow, ease: EASE_OUT }}
                            />
                        )}
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.name} className="relative">
                            <NavLink to={item.path} onClick={() => setOpenMobile(false)}>
                                <Icon stroke={isActive ? 2.25 : 2} />
                                <span className="flex-1 truncate transition-opacity duration-base ease-out group-data-[collapsible=icon]:opacity-0">{item.name}</span>
                            </NavLink>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                );
            })}
        </SidebarMenu>
    );
}

function OrganizationSwitcher() {
    const { superadminOrg, setSuperadminOrg } = useAuth();
    const { organizations, fetchOrganizations } = useOrganizations();

    React.useEffect(() => {
        fetchOrganizations({ status: "true" });
        // load once when the switcher mounts
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (value) => {
        const organization = organizations.find((org) => String(org.id) === value);
        if (organization) setSuperadminOrg({ id: organization.id, name: organization.name });
    };

    const label = superadminOrg?.name ?? "Vyberte organizaci";

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton tooltip={label} className="border border-sidebar-border bg-sidebar-active/60">
                            <IconBuildingCommunity />
                            <span className="flex-1 truncate transition-opacity duration-base ease-out group-data-[collapsible=icon]:opacity-0">{label}</span>
                            <IconSelector className="opacity-60 transition-opacity duration-base ease-out group-data-[collapsible=icon]:opacity-0" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start" className="max-h-72 w-(--radix-dropdown-menu-trigger-width) min-w-56 overflow-y-auto">
                        <DropdownMenuLabel>Organizace</DropdownMenuLabel>
                        <DropdownMenuRadioGroup value={superadminOrg ? String(superadminOrg.id) : ""} onValueChange={handleChange}>
                            {organizations.map((org) => (
                                <DropdownMenuRadioItem key={org.id} value={String(org.id)}>{org.name}</DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

function UserPanel() {
    const { user, logout } = useAuth();
    const { resolvedTheme, setTheme } = useTheme();
    const { setOpenMobile } = useSidebar();
    const displayName = user.fullName || user.username;
    const isDark = resolvedTheme === "dark";
    const ThemeIcon = isDark ? IconSun : IconMoon;
    const themeLabel = isDark ? "Světlý motiv" : "Tmavý motiv";

    return (
        <SidebarMenu className="gap-0.5">
            <SidebarMenuItem>
                <SidebarMenuButton tooltip={themeLabel} onClick={() => setTheme(isDark ? "light" : "dark")}>
                    <ThemeIcon />
                    <span className="transition-opacity duration-base ease-out group-data-[collapsible=icon]:opacity-0">{themeLabel}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip="Odhlásit se" onClick={logout} className="hover:text-destructive">
                    <IconLogout />
                    <span className="transition-opacity duration-base ease-out group-data-[collapsible=icon]:opacity-0">Odhlásit se</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild size="lg" tooltip={`${displayName} · Můj účet`}>
                    <NavLink to="/account" onClick={() => setOpenMobile(false)}>
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                            {initials(displayName)}
                        </span>
                        <span className="grid min-w-0 flex-1 leading-tight transition-opacity duration-base ease-out group-data-[collapsible=icon]:opacity-0">
                            <span className="truncate font-semibold text-foreground">{displayName}</span>
                            <span className="truncate text-xs text-muted-foreground">{getRoleLabel(user.role)}</span>
                        </span>
                    </NavLink>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

export function AppSidebar() {
    const { user } = useAuth();
    const { setOpenMobile } = useSidebar();

    return (
        <Sidebar variant="inset" collapsible="icon">
            <SidebarHeader className="pt-3">
                <NavLink
                    to="/"
                    onClick={() => setOpenMobile(false)}
                    className="flex h-10 items-center overflow-hidden rounded-md px-[7px] whitespace-nowrap outline-none focus-visible:ring-[3px] focus-visible:ring-sidebar-ring/50"
                >
                    <CareTrackerLogo small className="me-2.5 shrink-0" />
                    <CareTrackerWordmark className="h-4.5 text-foreground transition-opacity duration-base ease-out group-data-[collapsible=icon]:opacity-0" />
                </NavLink>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup className="pt-3">
                    <NavItems />
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="gap-2">
                {user.role === ROLES.SUPERADMIN && <OrganizationSwitcher />}
                <SidebarSeparator className="mx-0" />
                <UserPanel />
            </SidebarFooter>
        </Sidebar>
    );
}
