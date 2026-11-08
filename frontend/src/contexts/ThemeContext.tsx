import React, {createContext, useContext, useState, useEffect} from "react";
import { usePrefersDarkMode } from "../hooks/useMediaQuery";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return context;
}

export function ThemeProvider({children}: {children: React.ReactNode}) {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem("theme") as Theme;
        return saved || "system";
    });

    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

    const prefersDarkMode = usePrefersDarkMode();

    useEffect(() => {
        const updateThemeColor = (currentTheme: "light" | "dark") => {
            // index.html has one tag per prefers-color-scheme; the user's choice overrides both
            const themeColor = currentTheme === "dark" ? "#17131C" : "#F7F5F9";
            document.querySelectorAll("meta[name='theme-color']").forEach((meta) => {
                meta.setAttribute("content", themeColor);
            });
        };

        const systemTheme = prefersDarkMode ? "dark" : "light";
        const newResolvedTheme = theme === "system" ? systemTheme : theme;

        setResolvedTheme(newResolvedTheme);

        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(newResolvedTheme);
        updateThemeColor(newResolvedTheme);
        localStorage.setItem("theme", theme);
    }, [theme, prefersDarkMode]);

    return (
        <ThemeContext.Provider value={{theme, setTheme, resolvedTheme}}>
            {children}
        </ThemeContext.Provider>
    );
}
