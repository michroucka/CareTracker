import {HeroUIProvider} from "@heroui/react";
import {ToastProvider} from "@heroui/toast";
import type {NavigateOptions} from "react-router-dom";
import {useNavigate, useHref} from "react-router-dom";
import React from "react";

declare module "@react-types/shared" {
    interface RouterConfig {
        routerOptions: NavigateOptions;
    }
}

export function Providers({children}: {children: React.ReactNode}) {
    const navigate = useNavigate();

    return (
        <HeroUIProvider navigate={navigate} useHref={useHref}>
            <ToastProvider />
            {children}
        </HeroUIProvider>
    );
}
