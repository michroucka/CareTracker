import {useTheme} from "../contexts/ThemeContext";
import {Button} from "@heroui/react";
import {MoonIcon as MoonOutline, SunIcon as SunOutline} from '@heroicons/react/24/outline'
import {MoonIcon as MoonSolid, SunIcon as SunSolid} from '@heroicons/react/24/solid'

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
                        <MoonOutline className={`absolute inset-0 ${iconSize} group-hover:opacity-0 transition-opacity duration-200 ease-in-out`} />
                        <MoonSolid className={`absolute inset-0 ${iconSize} opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out`} />
                    </>
                ) : (
                    <>
                        <SunOutline className={`absolute inset-0 ${iconSize} group-hover:opacity-0 transition-opacity duration-200 ease-in-out`} />
                        <SunSolid className={`absolute inset-0 ${iconSize} opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out`} />
                    </>
                )}
            </div>
        </Button>
    )
};