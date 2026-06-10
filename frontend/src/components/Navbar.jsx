import React from "react";
import {
    Button,
    Label,
    Separator,
    Dropdown,
} from "@heroui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.tsx";
import {
    Home, Users, ClipboardCheck, UserRound, ListChecks,
    Building, Building2, BarChart3, ChevronDown, LogOut, Menu, X,
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
            <Button
                variant="tertiary"
                className="w-full justify-start gap-2 px-3"
            >
                <Building2 className="size-4 shrink-0" />
                <span className="truncate text-sm">{superadminOrg?.name ?? "Vyberte organizaci"}</span>
                <ChevronDown className="size-4 shrink-0" />
            </Button>
            <Dropdown.Popover>
                <Dropdown.Menu
                    aria-label="Výběr organizace"
                    selectionMode="single"
                    selectedKeys={superadminOrg ? new Set([String(superadminOrg.id)]) : new Set()}
                    onSelectionChange={handleOrgChange}
                    className="max-h-72 overflow-y-auto"
                >
                    {organizations.map(org => (
                        <Dropdown.Item key={String(org.id)} id={String(org.id)} textValue={org.name}>
                            <Dropdown.ItemIndicator />
                            <Label>{org.name}</Label>
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown.Popover>
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
                            <a
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-lg transition-all ease-in-out duration-200
                                    ${isActive
                                        ? "bg-primary/10 text-primary font-semibold opacity-100"
                                        : "opacity-60 hover:opacity-100 hover:bg-content2"
                                    }`}
                            >
                                <Icon className="size-5.5 shrink-0" />
                                <span>{item.name}</span>
                            </a>
                        );
                    })}
                </nav>

                {/* Bottom: org switcher + separator + user row */}
                <div className="flex flex-col gap-2">
                    {user?.role === "SUPERADMIN" && orgSwitcherDropdown}

                    <Separator />

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
                                    variant="danger-soft"
                                    size="sm"
                                    onPress={logout}
                                >
                                    <LogOut className="size-5" />
                                </Button>
                            </>
                        ) : (
                            <a href="/login" className="flex-1 font-semibold text-foreground text-lg">
                                Přihlásit se
                            </a>
                        )}

                        <ThemeSwitcher />
                    </div>
                </div>
            </aside>

            {/* ── Mobile navbar ───────────────────────────────────────── */}
            <nav className="sm:hidden sticky top-0 z-40 w-full bg-background border-b border-separator shadow-sm">
                <div className="flex h-16 items-center justify-between px-4">
                    <button
                        onClick={() => navigate("/")}
                        className="flex items-center gap-1 cursor-pointer"
                    >
                        <CareTrackerLogo />
                        <p className="font-bold text-xl">CareTracker</p>
                    </button>
                    <div className="flex items-center gap-2">
                        <ThemeSwitcher iconSize="size-6.5" />
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label={isMenuOpen ? "Zavřít menu" : "Otevřít menu"}
                            aria-expanded={isMenuOpen}
                            className="p-2 rounded-lg hover:bg-content2 transition-colors"
                        >
                            {isMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
                        </button>
                    </div>
                </div>

                {isMenuOpen && (
                    <div className="border-t border-separator max-h-[calc(100dvh-4rem)] overflow-y-auto pb-[env(safe-area-inset-bottom,1rem)]">
                        <div className="flex flex-col gap-1 p-3">
                            {filteredMenuItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                const Icon = item.icon;
                                return (
                                    <a
                                        key={item.path}
                                        href={item.path}
                                        aria-current={isActive ? "page" : undefined}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-colors
                                            ${isActive
                                                ? "bg-primary/10 text-primary font-semibold opacity-100"
                                                : "opacity-60"
                                            }`}
                                    >
                                        <Icon className="size-5 shrink-0" />
                                        <span className="text-lg">{item.name}</span>
                                    </a>
                                );
                            })}

                            {user?.role === "SUPERADMIN" && (
                                <div className="mt-auto">
                                    <Dropdown className="w-full">
                                        <Button
                                            variant="tertiary"
                                            className="text-foreground w-full justify-between text-base"
                                        >
                                            <Building2 className="size-5 opacity-60" />
                                            <span className="truncate">{superadminOrg?.name ?? "Vyberte organizaci"}</span>
                                            <ChevronDown className="size-5 opacity-60" />
                                        </Button>
                                        <Dropdown.Popover>
                                            <Dropdown.Menu
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
                                                    <Dropdown.Item key={String(org.id)} id={String(org.id)} textValue={org.name}>
                                                        <Dropdown.ItemIndicator />
                                                        <Label>{org.name}</Label>
                                                    </Dropdown.Item>
                                                ))}
                                            </Dropdown.Menu>
                                        </Dropdown.Popover>
                                    </Dropdown>
                                </div>
                            )}

                            <Separator className={user?.role !== "SUPERADMIN" ? "mt-auto" : undefined} />

                            {loading ? (
                                <div className="h-10" />
                            ) : user ? (
                                <div className="w-full flex items-center justify-between gap-2 py-2 px-2 mb-4">
                                    <button
                                        onClick={() => {
                                            navigate("/account");
                                            setIsMenuOpen(false);
                                        }}
                                        className="flex flex-col items-start cursor-pointer"
                                    >
                                        <span className="font-bold text-xl">{user.username}</span>
                                        <span className="opacity-75 font-medium text-sm">{getRoleLabel(user.role)}</span>
                                    </button>
                                    <Button
                                        isIconOnly
                                        variant="danger-soft"
                                        size="lg"
                                        onPress={() => {
                                            setIsMenuOpen(false);
                                            logout();
                                        }}
                                    >
                                        <LogOut className="size-8.5" />
                                    </Button>
                                </div>
                            ) : (
                                <a
                                    href="/login"
                                    className="w-full font-bold py-2 text-foreground text-xl flex justify-end px-2 mb-4"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Přihlásit se
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </>
    );
}
