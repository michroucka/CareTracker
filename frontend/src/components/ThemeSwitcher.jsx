import {useTheme} from "@heroui/use-theme";
import {Switch} from "@heroui/react";
import {MoonIcon, SunIcon} from '@heroicons/react/24/solid'

export const ThemeSwitcher = () => {
    const { theme, setTheme } = useTheme()

    const isDark = theme === 'dark';

    return (
    <Switch
        onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
        color="default"
        size="md"
        thumbIcon={({isSelected, className}) =>
            isSelected ? <MoonIcon className={`${className} size-4`} /> : <SunIcon className={`${className} size-4`} />
        }
    />
    )
};