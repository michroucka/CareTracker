import React from "react";
import {Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenuToggle, NavbarMenu, NavbarMenuItem, Link, Button} from "@heroui/react";
import logo from "../assets/ct_icon.png"
import {useLocation} from "react-router-dom";

export const CareTrackerLogo = () => {
    return <img src={logo} alt="CareTracker Logo" className="h-8 w-8 mr-1"/>;
};

export default function AppNavbar() {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const location = useLocation();

    const menuItems = [
        { name: "Home", path: "/"},
        { name: "About", path: "/about" },
        { name: "Test", path: "/test" },
    ];

    return (
        <Navbar onMenuOpenChange={setIsMenuOpen} maxWidth="full" className="px-0 lg:px-20 xl:px-32 2xl:px-48">
            <NavbarContent>
                <NavbarMenuToggle
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    className="sm:hidden"
                />
                <NavbarBrand>
                    <CareTrackerLogo />
                    <p className="font-bold text-xl">CareTracker</p>
                </NavbarBrand>
            </NavbarContent>

            {/* Desktop menu */}
            <NavbarContent className="hidden sm:flex gap-4">
                {menuItems.map((item) => (
                    <NavbarItem
                        key={item.path}
                        isActive={location.pathname === item.path}
                    >
                        <Link
                            href={item.path}
                            aria-current={location.pathname === item.path ? "page" : undefined}
                            color={location.pathname === item.path ? "primary" : "foreground"}
                        >
                            {item.name}
                        </Link>
                    </NavbarItem>
                ))}
            </NavbarContent>
            <NavbarContent justify="end">
                <NavbarItem>
                    <Button as={Link} color="primary" href="#" variant="flat">
                        Login
                    </Button>
                </NavbarItem>
            </NavbarContent>
            <NavbarMenu>
                {menuItems.map((item) => (
                    <NavbarMenuItem key={item.path}>
                        <Link
                            className="w-full"
                            href={item.path}
                            aria-current={location.pathname === item.path ? "page" : undefined}
                            color={location.pathname === item.path ? "primary" : "foreground"}
                            size="lg"
                        >
                            {item.name}
                        </Link>
                    </NavbarMenuItem>
                ))}
            </NavbarMenu>
        </Navbar>
    );
}
