import React from "react";
import {Providers} from "./providers";

export default function Layout({children}: {children: React.ReactNode}) {
    return (
        <Providers>
            <div className="text-foreground bg-background min-h-screen">
                {children}
            </div>
        </Providers>
    );
}
