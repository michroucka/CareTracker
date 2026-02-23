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
import logo from "../assets/ct_icon.png"
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.tsx";
import { ChevronDown, LogOut } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher.jsx";
import { getRoleLabel, ROLES, hasRole } from "../constants/roles.js";

export const CareTrackerLogo = () => {
    return <img
        src={logo}
        alt="CareTracker Logo"
        className="h-8 w-8 mr-1 select-none"
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
    />;
};

export default function AppNavbar() {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const { user, loading, logout } = useAuth();

    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { name: "Domů", path: "/" },
        { name: "Klienti", path: "/clients", allowedRoles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER] },
        { name: "Provedené úkony", path: "/performed-tasks", allowedRoles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER] },
        { name: "Zaměstnanci", path: "/employees", allowedRoles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER] },
        { name: "Úkony", path: "/tasks", allowedRoles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER] },
    ];

    // Filtrování menu položek podle role uživatele
    const filteredMenuItems = React.useMemo(() => {
        return menuItems.filter((item) => {
            // Pokud položka nemá definované allowedRoles, je veřejná
            if (!item.allowedRoles) {
                return true;
            }
            // Pokud není přihlášený uživatel, skryj chráněné položky
            if (!user) {
                return false;
            }
            // Zkontroluj, zda má uživatel potřebnou roli
            return hasRole(user.role, item.allowedRoles);
        });
    }, [user]);

    React.useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

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
                                    <DropdownItem key="account">Můj účet</DropdownItem>
                                </DropdownSection>
                                <DropdownSection>
                                    <DropdownItem
                                        key="logout"
                                        color="danger"
                                        onPress={logout}
                                        startContent={<LogOut className="h-4 w-4" />}
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

                <Divider className="mt-auto" />

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
