import React from "react";
import {Providers} from "./providers";

export default function Layout({children}: {children: React.ReactNode}) {
    return (
        <Providers>
            <div className="min-h-screen flex sm:flex-col text-foreground bg-content2">
                {children}
            </div>
        </Providers>
    );
}
