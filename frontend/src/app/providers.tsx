import {HeroUIProvider} from "@heroui/react";
import {ToastProvider} from "@heroui/toast";
import type {NavigateOptions} from "react-router-dom";
import {useNavigate, useHref} from "react-router-dom";
import React from "react";
import {AuthProvider} from "../contexts/AuthContext";
import {ThemeProvider} from "../contexts/ThemeContext";

declare module "@react-types/shared" {
    interface RouterConfig {
        routerOptions: NavigateOptions;
    }
}

export function Providers({children}: {children: React.ReactNode}) {
    const navigate = useNavigate();

    return (
        <ThemeProvider>
            <HeroUIProvider navigate={navigate} useHref={useHref}>
                <AuthProvider>
                    <ToastProvider placement="top-center" toastOffset={70} />
                    {children}
                </AuthProvider>
            </HeroUIProvider>
        </ThemeProvider>
    );
}
