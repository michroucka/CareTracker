import {HeroUIProvider} from "@heroui/react";
import {ToastProvider} from "@heroui/toast";
import type {NavigateOptions} from "react-router-dom";
import {useNavigate, useHref} from "react-router-dom";
import React from "react";
import {AuthProvider} from "../contexts/AuthContext";
import {ThemeProvider} from "../contexts/ThemeContext";
import {I18nProvider} from "@react-aria/i18n";

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
                <I18nProvider locale="cs-CZ-u-ca-gregory">
                    <AuthProvider>
                        <ToastProvider placement="top-center" toastOffset={70} />
                        {children}
                    </AuthProvider>
                </I18nProvider>
            </HeroUIProvider>
        </ThemeProvider>
    );
}
