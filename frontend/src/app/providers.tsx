import {Toast} from "@heroui/react";
import React from "react";
import {AuthProvider} from "../contexts/AuthContext";
import {ThemeProvider} from "../contexts/ThemeContext";
import {I18nProvider} from "@react-aria/i18n";

export function Providers({children}: {children: React.ReactNode}) {
    return (
        <ThemeProvider>
            <I18nProvider locale="cs-CZ-u-ca-gregory">
                <AuthProvider>
                    <Toast.Provider placement="top" />
                    {children}
                </AuthProvider>
            </I18nProvider>
        </ThemeProvider>
    );
}
