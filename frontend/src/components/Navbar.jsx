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
    DropdownSection,
    User,
} from "@heroui/react";
import logo from "../assets/ct_icon.svg"
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.tsx";
import { Building2, ChevronDown, LogOut, UserRound } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher.jsx";
import { getRoleLabel, ROLES, hasRole } from "../constants/roles.js";
import { useOrganizations } from "../hooks/useOrganizations.jsx";

export const CareTrackerLogo = () => {
    return <img
        src={logo}
        alt="CareTracker Logo"
        className="size-7 me-1.5 select-none"
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
    />;
};

export default function AppNavbar() {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const { user, loading, logout, superadminOrg, setSuperadminOrg } = useAuth();
    const { organizations, fetchOrganizations } = useOrganizations();

    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { name: "Domů", path: "/", allowedRoles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER] },
        { name: "Klienti", path: "/clients", allowedRoles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER] },
        { name: "Provedené úkony", path: "/performed-tasks", allowedRoles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER] },
        { name: "Zaměstnanci", path: "/employees", allowedRoles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER] },
        { name: "Úkony", path: "/tasks", allowedRoles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER] },
        { name: "Střediska", path: "/departments", allowedRoles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
        { name: "Organizace", path: "/organizations", allowedRoles: [ROLES.SUPERADMIN]},
        { name: "Měsíční přehled", path: "/monthly-report", allowedRoles: [ROLES.CLIENT] },
    ];

    const filteredMenuItems = React.useMemo(() => {
        return menuItems.filter((item) => {
            if (!item.allowedRoles) {
                return true;
            }
            if (!user) {
                return false;
            }
            return hasRole(user.role, item.allowedRoles);
        });
    }, [user]);

    React.useEffect(() => {
        if (user?.role === "SUPERADMIN") {
            fetchOrganizations({ status: "true" });
        }
    }, [user]);

    React.useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    const handleOrgChange = React.useCallback((keys) => {
        const id = Number(Array.from(keys)[0]);
        const org = organizations.find(o => o.id === id);
        if (org) setSuperadminOrg({ id: org.id, name: org.name });
    }, [organizations, setSuperadminOrg]);

    const orgSwitcherDesktop = user?.role === "SUPERADMIN" && (
        <NavbarItem>
            <Dropdown>
                <DropdownTrigger>
                    <Button
                        startContent={<Building2 className="size-5 me-2" />}
                        endContent={<ChevronDown className="size-4" />}
                        variant="flat"
                        className="px-2 w-full"
                        isIconOnly
                    />
                </DropdownTrigger>
                <DropdownMenu
                    aria-label="Výběr organizace"
                    selectionMode="single"
                    selectedKeys={superadminOrg ? new Set([String(superadminOrg.id)]) : new Set()}
                    onSelectionChange={handleOrgChange}
                    className="max-h-72 overflow-y-auto"
                >
                    {organizations.map(org => (
                        <DropdownItem key={String(org.id)}>
                            {org.name}
                        </DropdownItem>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </NavbarItem>
    );

    return (
        <Navbar
            isMenuOpen={isMenuOpen}
            shouldHideOnScroll
            onMenuOpenChange={setIsMenuOpen}
            maxWidth="full"
            className="px-0 lg:px-20 xl:px-32 2xl:px-48 shadow-md"
        >
            <NavbarContent>
                <NavbarBrand className="cursor-pointer"
                             onClick={() => (navigate("/"))}>
                    <CareTrackerLogo />
                    <p className="font-bold text-xl">CareTracker</p>
                </NavbarBrand>
                <ThemeSwitcher className="sm:hidden mr-4" iconSize="size-6.5" />
                <NavbarMenuToggle
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    className="sm:hidden"
                    justify="end"
                />
            </NavbarContent>

            {/* Desktop menu */}
            <NavbarContent className="hidden sm:flex gap-6" justify="center">
                {filteredMenuItems.map((item) => (
                    <NavbarItem
                        key={item.path}
                        isActive={location.pathname === item.path}
                    >
                        <Link
                            href={item.path}
                            aria-current={location.pathname === item.path ? "page" : undefined}
                            color="foreground"
                            className={`font-bold ${location.pathname === item.path ? '' : 'opacity-60'}`}
                        >
                            {item.name}
                        </Link>
                    </NavbarItem>
                ))}
            </NavbarContent>
            <NavbarContent className="hidden sm:flex" justify="end">
                {orgSwitcherDesktop}
                {loading ? (
                    <NavbarItem>
                        <div className="w-24 h-10" />
                    </NavbarItem>
                ) : user ? (
                    <NavbarItem>
                        <Dropdown
                            placement="bottom-end"
                            onOpenChange={setIsDropdownOpen}
                        >
                            <DropdownTrigger className="justify-center align-middle items-center">
                                <User
                                    as="button"
                                    avatarProps={{
                                        className: "w-9 h-9",
                                        fallback: <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${ isDropdownOpen ? 'rotate-180' : '' }`} />,
                                        showFallback: true,
                                        classNames: {
                                            base: "bg-transparent m-0",
                                        },
                                    }}
                                    name={user.username}
                                    description={getRoleLabel(user.role)}
                                    className="cursor-pointer transition-transform-opacity duration-300 ease-in-out aria-[expanded=true]:opacity-100 hover:scale-105"
                                    classNames={{
                                        name: "font-bold",
                                        description: "ms-auto opacity-75 font-medium",
                                        base: "gap-1 flex-row-reverse",
                                        wrapper: ""
                                    }}
                                />
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Profile Actions" variant="flat">
                                <DropdownSection showDivider>
                                    <DropdownItem
                                        key="account"
                                        href="/account"
                                        startContent={<UserRound className="size-4" />}
                                        className="text-foreground"
                                    >
                                        Můj účet
                                    </DropdownItem>
                                </DropdownSection>
                                <DropdownSection>
                                    <DropdownItem
                                        key="logout"
                                        color="danger"
                                        onPress={logout}
                                        startContent={<LogOut className="size-4" />}
                                        className="text-danger"
                                    >
                                        Odhlásit se
                                    </DropdownItem>
                                </DropdownSection>
                            </DropdownMenu>
                        </Dropdown>
                    </NavbarItem>
                ) : (
                    <NavbarItem>
                        <Link href="/login"
                                className="font-bold text-foreground">
                            Přihlásit se
                        </Link>
                    </NavbarItem>
                )}
                <ThemeSwitcher />
            </NavbarContent>

            {/* Mobile menu */}
            <NavbarMenu className="pt-6 gap-3 flex flex-col max-h-[calc(100dvh-4rem)] overflow-y-auto pb-[env(safe-area-inset-bottom,1rem)]">
                {filteredMenuItems.map((item) => (
                    <NavbarMenuItem key={item.path}>
                        <Link
                            className={`w-full text-xl font-bold justify-end py-2 ${location.pathname === item.path ? '' : 'opacity-60'}`}
                            href={item.path}
                            aria-current={location.pathname === item.path ? "page" : undefined}
                            color="foreground"
                            onPress={() => setIsMenuOpen(false)}
                        >
                            {item.name}
                        </Link>
                    </NavbarMenuItem>
                ))}

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
                                    <span className="truncate">
                                        {superadminOrg?.name ?? "Vyberte organizaci"}
                                    </span>
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
                                    <DropdownItem key={String(org.id)}>
                                        {org.name}
                                    </DropdownItem>
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
                                avatarProps={{
                                    className: "hidden"
                                }}
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
                            className="w-full font-bold py-2 text-foreground text-xl justify-end py-2 px-2 mb-4"
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
    );
}
