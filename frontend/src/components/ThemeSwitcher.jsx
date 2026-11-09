import { IconMoon, IconMoonFilled, IconSun, IconSunFilled } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export const ThemeSwitcher = ({ className = "" }) => {
    const { resolvedTheme, setTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [OutlineIcon, FilledIcon] = isDark ? [IconSun, IconSunFilled] : [IconMoon, IconMoonFilled];

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? "Přepnout na světlý motiv" : "Přepnout na tmavý motiv"}
            className={cn("group relative", className)}
        >
            <OutlineIcon className="size-5 transition-opacity duration-base ease-out group-hover:opacity-0" />
            <FilledIcon className="absolute size-5 opacity-0 transition-opacity duration-base ease-out group-hover:opacity-100" />
        </Button>
    );
};
