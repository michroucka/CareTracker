import React from "react";
import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    NavbarMenuToggle,
    NavbarMenu,
    NavbarMenuItem,
    Link,
    Button,
    Divider,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    User,
} from "@heroui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.tsx";
import {
    Home, Users, ClipboardCheck, UserRound, ListChecks,
    Building, Building2, BarChart3, ChevronDown, LogOut,
} from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher.jsx";
import { CareTrackerLogo } from "./CareTrackerLogo.jsx";
import { getRoleLabel, ROLES, hasRole } from "../constants/roles.js";
import { useOrganizations } from "../hooks/useOrganizations.jsx";

const menuItems = [
    { name: "Nástěnka",         path: "/",                icon: Home,          allowedRoles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER] },
    { name: "Klienti",          path: "/clients",         icon: Users,         allowedRoles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER] },
    { name: "Provedené úkony",  path: "/performed-tasks", icon: ClipboardCheck,allowedRoles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER] },
    { name: "Zaměstnanci",      path: "/employees",       icon: UserRound,     allowedRoles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER] },
    { name: "Úkony",            path: "/tasks",           icon: ListChecks,    allowedRoles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER] },
    { name: "Střediska",        path: "/departments",     icon: Building,      allowedRoles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
    { name: "Organizace",       path: "/organizations",   icon: Building2,     allowedRoles: [ROLES.SUPERADMIN] },
    { name: "Měsíční přehled",  path: "/monthly-report",  icon: BarChart3,     allowedRoles: [ROLES.CLIENT] },
];

export default function AppNavbar() {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const { user, loading, logout, superadminOrg, setSuperadminOrg } = useAuth();
    const { organizations, fetchOrganizations } = useOrganizations();
    const location = useLocation();
    const navigate = useNavigate();

    const filteredMenuItems = React.useMemo(() => {
        return menuItems.filter((item) => {
            if (!user) return item.path === "/";
            return hasRole(user.role, item.allowedRoles);
        });
    }, [user]);

    React.useEffect(() => {
        if (user?.role === "SUPERADMIN") fetchOrganizations({ status: "true" });
    }, [user]);

    React.useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    const handleOrgChange = React.useCallback((keys) => {
        const id = Number(Array.from(keys)[0]);
        const org = organizations.find(o => o.id === id);
        if (org) setSuperadminOrg({ id: org.id, name: org.name });
    }, [organizations, setSuperadminOrg]);

    const orgSwitcherDropdown = (
        <Dropdown>
            <DropdownTrigger>
                <Button
                    startContent={<Building2 className="size-4 shrink-0" />}
                    endContent={<ChevronDown className="size-4 shrink-0" />}
                    variant="flat"
                    className="w-full justify-start gap-2 px-3"
                >
                    <span className="truncate text-sm">{superadminOrg?.name ?? "Vyberte organizaci"}</span>
                </Button>
            </DropdownTrigger>
            <DropdownMenu
                aria-label="Výběr organizace"
                selectionMode="single"
                selectedKeys={superadminOrg ? new Set([String(superadminOrg.id)]) : new Set()}
                onSelectionChange={handleOrgChange}
                className="max-h-72 overflow-y-auto"
            >
                {organizations.map(org => (
                    <DropdownItem key={String(org.id)}>{org.name}</DropdownItem>
                ))}
            </DropdownMenu>
        </Dropdown>
    );

    return (
        <>
            {/* ── Desktop sidebar ───────────────────────────────────────── */}
            <aside className="hidden sm:flex flex-col w-60 shrink-0 p-3 gap-1 overflow-y-auto">

                {/* Logo */}
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center px-2 py-3 mb-1 rounded-xl hover:bg-content2 transition-colors cursor-pointer"
                >
                    <CareTrackerLogo />
                    <span className="font-bold text-2xl">CareTracker</span>
                </button>

                {/* Nav links */}
                <nav className="flex flex-col gap-0.5 flex-1">
                    {filteredMenuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                color="foreground"
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-lg transition-all ease-in-out duration-200
                                    ${isActive
                                        ? "bg-primary/10 text-primary font-semibold opacity-100"
                                        : "opacity-60 hover:opacity-100 hover:bg-content2"
                                    }`}
                            >
                                <Icon className="size-5.5 shrink-0" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom: org switcher + divider + user row */}
                <div className="flex flex-col gap-2">
                    {user?.role === "SUPERADMIN" && orgSwitcherDropdown}

                    <Divider />

                    <div className="flex items-center gap-1 px-1">
                        {loading ? (
                            <div className="flex-1 h-9" />
                        ) : user ? (
                            <>
                                <button
                                    onClick={() => navigate("/account")}
                                    className="flex-1 min-w-0 flex flex-col items-start text-left cursor-pointer rounded-lg px-1 hover:opacity-70 transition-opacity"
                                >
                                    <span className={`font-semibold w-full truncate 
                                        ${user.username.length > 13
                                        ? "text-sm"
                                        : ""
                                    }`}
                                    >
                                        {user.username}
                                    </span>
                                    <span className="opacity-65 text-xs w-full truncate">{getRoleLabel(user.role)}</span>
                                </button>
                                <Button
                                    isIconOnly
                                    color="danger"
                                    variant="light"
                                    size="sm"
                                    onPress={logout}
                                >
                                    <LogOut className="size-5" />
                                </Button>
                            </>
                        ) : (
                            <Link href="/login" className="flex-1 font-semibold text-foreground text-lg">
                                Přihlásit se
                            </Link>
                        )}

                        <ThemeSwitcher />
                    </div>
                </div>
            </aside>

            {/* ── Mobile navbar (HeroUI, beze změny) ───────────────────── */}
            <Navbar
                isMenuOpen={isMenuOpen}
                shouldHideOnScroll
                onMenuOpenChange={setIsMenuOpen}
                maxWidth="full"
                className="sm:hidden px-0 shadow-md"
            >
                <NavbarContent>
                    <NavbarBrand className="cursor-pointer" onClick={() => navigate("/")}>
                        <CareTrackerLogo />
                        <p className="font-bold text-xl">CareTracker</p>
                    </NavbarBrand>
                    <ThemeSwitcher className="mr-4" iconSize="size-6.5" />
                    <NavbarMenuToggle
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                        justify="end"
                    />
                </NavbarContent>

                <NavbarMenu className="pt-4 gap-1 flex flex-col max-h-[calc(100dvh-4rem)] overflow-y-auto pb-[env(safe-area-inset-bottom,1rem)]">
                    {filteredMenuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <NavbarMenuItem key={item.path}>
                                <Link
                                    href={item.path}
                                    aria-current={isActive ? "page" : undefined}
                                    color="foreground"
                                    onPress={() => setIsMenuOpen(false)}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors
                                        ${isActive
                                            ? "bg-primary/10 text-primary font-semibold opacity-100"
                                            : "opacity-60"
                                        }`}
                                >
                                    <Icon className="size-5 shrink-0" />
                                    <span className="text-lg">{item.name}</span>
                                </Link>
                            </NavbarMenuItem>
                        );
                    })}

                    {user?.role === "SUPERADMIN" && (
                        <NavbarMenuItem className="mt-auto">
                            <Dropdown className="w-full">
                                <DropdownTrigger>
                                    <Button
                                        startContent={<Building2 className="size-5 opacity-60" />}
                                        endContent={<ChevronDown className="size-5 opacity-60" />}
                                        variant="flat"
                                        className="text-foreground w-full justify-between text-base"
                                    >
                                        <span className="truncate">{superadminOrg?.name ?? "Vyberte organizaci"}</span>
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                    aria-label="Výběr organizace"
                                    selectionMode="single"
                                    selectedKeys={superadminOrg ? new Set([String(superadminOrg.id)]) : new Set()}
                                    onSelectionChange={(keys) => {
                                        handleOrgChange(keys);
                                        setIsMenuOpen(false);
                                    }}
                                    className="max-h-72 overflow-y-auto"
                                >
                                    {organizations.map(org => (
                                        <DropdownItem key={String(org.id)}>{org.name}</DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        </NavbarMenuItem>
                    )}

                    <Divider className={user?.role !== "SUPERADMIN" ? "mt-auto" : null} />

                    {loading ? (
                        <div className="h-10" />
                    ) : user ? (
                        <NavbarMenuItem>
                            <div className="w-full flex items-center justify-between gap-2 py-2 px-2 mb-4">
                                <User
                                    as="button"
                                    onClick={() => {
                                        navigate("/account");
                                        setIsMenuOpen(false);
                                    }}
                                    name={user.username}
                                    description={getRoleLabel(user.role)}
                                    avatarProps={{ className: "hidden" }}
                                    classNames={{
                                        name: "font-bold text-xl",
                                        description: "opacity-75 font-medium text-sm",
                                    }}
                                />
                                <Button
                                    isIconOnly
                                    color="danger"
                                    variant="light"
                                    size="lg"
                                    onPress={() => {
                                        setIsMenuOpen(false);
                                        logout();
                                    }}
                                >
                                    <LogOut className="size-8.5" />
                                </Button>
                            </div>
                        </NavbarMenuItem>
                    ) : (
                        <NavbarMenuItem>
                            <Link
                                className="w-full font-bold py-2 text-foreground text-xl justify-end px-2 mb-4"
                                href="/login"
                                size="lg"
                                onPress={() => setIsMenuOpen(false)}
                            >
                                Přihlásit se
                            </Link>
                        </NavbarMenuItem>
                    )}
                </NavbarMenu>
            </Navbar>
        </>
    );
}
