import {useTheme} from "../contexts/ThemeContext";
import {Button} from "@heroui/react";
import {Moon, Sun} from 'lucide-react'

export const ThemeSwitcher = ({ className = "", iconSize = "size-5.5" }) => {
    const { resolvedTheme, setTheme } = useTheme()

    const isDark = resolvedTheme === "dark"

    return (
        <Button
            isIconOnly
            onPress={() => setTheme(isDark ? 'light' : 'dark')}
            className={`rounded-full group ${className}`}
            size="sm"
            variant="light"
            disableRipple
        >
            <div className={`relative ${iconSize}`}>
                {isDark ? (
                    <>
                        <Moon className={`absolute inset-0 ${iconSize} group-hover:opacity-0 transition-opacity duration-200 ease-in-out`} fill="none" />
                        <Moon className={`absolute inset-0 ${iconSize} opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out`} fill="currentColor" />
                    </>
                ) : (
                    <>
                        <Sun className={`absolute inset-0 ${iconSize} group-hover:opacity-0 transition-opacity duration-200 ease-in-out`} fill="none" />
                        <Sun className={`absolute inset-0 ${iconSize} opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out`} fill="currentColor" />
                    </>
                )}
            </div>
        </Button>
    )
};