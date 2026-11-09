import React from "react";
import {AuthProvider} from "../contexts/AuthContext";
import {ThemeProvider} from "../contexts/ThemeContext";
import {MotionConfig} from "motion/react";
import {TooltipProvider} from "@/components/ui/tooltip";
import {Toaster} from "@/components/ui/sonner";

export function Providers({children}: {children: React.ReactNode}) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <MotionConfig reducedMotion="user">
                    <TooltipProvider>
                        <Toaster position="top-center" />
                        {children}
                    </TooltipProvider>
                </MotionConfig>
            </AuthProvider>
        </ThemeProvider>
    );
}
