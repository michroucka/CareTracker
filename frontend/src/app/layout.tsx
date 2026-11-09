import React from "react";
import {Providers} from "./providers";

export default function Layout({children}: {children: React.ReactNode}) {
    return (
        <Providers>
            <div className="min-h-svh flex flex-col bg-background text-foreground">
                {children}
            </div>
        </Providers>
    );
}
