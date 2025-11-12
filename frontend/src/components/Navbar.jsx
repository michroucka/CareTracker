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
    Divider
} from "@heroui/react";
import logo from "../assets/ct_icon.png"
import {useLocation, useNavigate} from "react-router-dom";
import {ThemeSwitcher} from "./ThemeSwitcher.jsx"

export const CareTrackerLogo = () => {
    return <img src={logo} alt="CareTracker Logo" className="h-8 w-8 mr-1"/>;
};

export default function AppNavbar() {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { name: "Home", path: "/"},
        { name: "About", path: "/about" },
        { name: "Test", path: "/test" },
    ];

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
                    <p className="font-bold text-xl text-foreground">CareTracker</p>
                </NavbarBrand>
                <NavbarMenuToggle
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    className="sm:hidden"
                    justify="end"
                />
            </NavbarContent>

            {/* Desktop menu */}
            <NavbarContent className="hidden sm:flex gap-4" justify="center">
                {menuItems.map((item) => (
                    <NavbarItem
                        key={item.path}
                        isActive={location.pathname === item.path}
                    >
                        <Link
                            href={item.path}
                            aria-current={location.pathname === item.path ? "page" : undefined}
                            color={location.pathname === item.path ? "secondary" : "foreground"}
                            className="font-semibold"
                        >
                            {item.name}
                        </Link>
                    </NavbarItem>
                ))}
            </NavbarContent>
            <NavbarContent className="hidden sm:flex" justify="end">
                {/*<NavbarItem>*/}
                {/*    <ThemeSwitcher />*/}
                {/*</NavbarItem>*/}
                <NavbarItem>
                    <Button as={Link} color="primary" href="/login" variant="ghost" className="font-semibold">
                        Přihlášení
                    </Button>
                </NavbarItem>
            </NavbarContent>
            <NavbarMenu>
                {menuItems.map((item) => (
                    <NavbarMenuItem key={item.path}>
                        <Link
                            className="w-full justify-end font-semibold"
                            href={item.path}
                            aria-current={location.pathname === item.path ? "page" : undefined}
                            color={location.pathname === item.path ? "secondary" : "foreground"}
                            size="lg"
                            onPress={() => setIsMenuOpen(false)}
                        >
                            {item.name}
                        </Link>
                    </NavbarMenuItem>
                ))}
                <Divider className="ml-auto w-1/4" />
                <NavbarMenuItem key="/login">
                    <Link
                        className="w-full justify-end font-semibold"
                        href="/login"
                        color="primary"
                        size="lg"
                        onPress={() => setIsMenuOpen(false)}
                    >
                        Přihlášení
                    </Link>
                </NavbarMenuItem>
            </NavbarMenu>
        </Navbar>
    );
}
