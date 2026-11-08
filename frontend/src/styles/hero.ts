import { heroui } from "@heroui/react";

export default heroui ({
    prefix: "heroui", // prefix for themes variables
    addCommonColors: false, // override common colors (e.g. "blue", "green", "pink").
    defaultTheme: "light", // default theme from the themes object
    defaultExtendTheme: "light", // default theme to extend on custom themes
    layout: { // common layout tokens (applied to all themes)
        radius: { small: "8px", medium: "10px", large: "14px" },
    },
    themes: {
        light: {
            layout: { // light theme layout tokens
                "disabledOpacity": "0.5"
            },
            colors: { // light theme colors
                "default": {
                    "50": "#F7F5F9",
                    "100": "#EFEBF3",
                    "200": "#E2DCE8",
                    "300": "#CFC7D7",
                    "400": "#A79EB2",
                    "500": "#847B8F",
                    "600": "#645C6E",
                    "700": "#4D4557",
                    "800": "#332D3B",
                    "900": "#1E1A24",
                    "foreground": "#1E1A24",
                    "DEFAULT": "#CFC7D7"
                },
                "primary": {
                    "50": "#F7F3F9",
                    "100": "#ECE3F2",
                    "200": "#DAC7E6",
                    "300": "#C2A4D6",
                    "400": "#A679C3",
                    "500": "#8A4FB0",
                    "600": "#6E3F8D",
                    "700": "#4A2B5E",
                    "800": "#372046",
                    "900": "#24152E",
                    "foreground": "#FFFFFF",
                    "DEFAULT": "#4A2B5E"
                },
                "secondary": {
                    "50": "#F7F3F9",
                    "100": "#ECE3F2",
                    "200": "#DAC7E6",
                    "300": "#C2A4D6",
                    "400": "#A679C3",
                    "500": "#8A4FB0",
                    "600": "#6E3F8D",
                    "700": "#4A2B5E",
                    "800": "#372046",
                    "900": "#24152E",
                    "foreground": "#4A2B5E",
                    "DEFAULT": "#ECE3F2"
                },
                "success": {
                    "50": "#e3f0e9",
                    "100": "#bcdbcb",
                    "200": "#94c6ad",
                    "300": "#6db18f",
                    "400": "#459c70",
                    "500": "#1e8752",
                    "600": "#196f44",
                    "700": "#145835",
                    "800": "#0e4027",
                    "900": "#092919",
                    "foreground": "#fff",
                    "DEFAULT": "#1e8752"
                },
                "warning": {
                    "50": "#fcf6e4",
                    "100": "#f8e8be",
                    "200": "#f3db97",
                    "300": "#efce71",
                    "400": "#eac04b",
                    "500": "#e6b325",
                    "600": "#be941f",
                    "700": "#967418",
                    "800": "#6d5512",
                    "900": "#45360b",
                    "foreground": "#000",
                    "DEFAULT": "#e6b325"
                },
                "danger": {
                    "50": "#FAEBED",
                    "100": "#F2CDD3",
                    "200": "#E7A5B0",
                    "300": "#DC7C8D",
                    "400": "#D15469",
                    "500": "#C9364F",
                    "600": "#AF3249",
                    "700": "#892436",
                    "800": "#6B2737",
                    "900": "#49212F",
                    "foreground": "#FFFFFF",
                    "DEFAULT": "#C9364F"
                },
                "background": "#F7F5F9",
                "foreground": "#1E1A24",
                "content1": {
                    "DEFAULT": "#FFFFFF",
                    "foreground": "#1E1A24"
                },
                "content2": {
                    "DEFAULT": "#F7F3F9",
                    "foreground": "#1E1A24"
                },
                "content3": {
                    "DEFAULT": "#EFEBF3",
                    "foreground": "#1E1A24"
                },
                "content4": {
                    "DEFAULT": "#E2DCE8",
                    "foreground": "#1E1A24"
                },
                "focus": "#E26A35",
                "overlay": "#1E1A24"
            },
        },
        dark: {
            layout: { // dark theme layout tokens
                "disabledOpacity": "0.5"
            },
            colors: { // dark theme colors
                "default": {
                    "50": "#17131C",
                    "100": "#211B28",
                    "200": "#352D3E",
                    "300": "#4D4557",
                    "400": "#645C6E",
                    "500": "#A79EB2",
                    "600": "#C9C0D3",
                    "700": "#E2DCE8",
                    "800": "#EFEBF3",
                    "900": "#F7F5F9",
                    "foreground": "#F1EDF5",
                    "DEFAULT": "#352D3E"
                },
                "primary": {
                    "50": "#24152E",
                    "100": "#372046",
                    "200": "#4A2B5E",
                    "300": "#6E3F8D",
                    "400": "#8A4FB0",
                    "500": "#A679C3",
                    "600": "#C2A4D6",
                    "700": "#DAC7E6",
                    "800": "#ECE3F2",
                    "900": "#F7F3F9",
                    "foreground": "#1E1A24",
                    "DEFAULT": "#C2A4D6"
                },
                "secondary": {
                    "50": "#24152E",
                    "100": "#372046",
                    "200": "#4A2B5E",
                    "300": "#6E3F8D",
                    "400": "#8A4FB0",
                    "500": "#A679C3",
                    "600": "#C2A4D6",
                    "700": "#DAC7E6",
                    "800": "#ECE3F2",
                    "900": "#F7F3F9",
                    "foreground": "#F1EDF5",
                    "DEFAULT": "#3B2D4A"
                },
                "success": {
                    "50": "#092919",
                    "100": "#0e4027",
                    "200": "#145835",
                    "300": "#196f44",
                    "400": "#1e8752",
                    "500": "#459c70",
                    "600": "#6db18f",
                    "700": "#94c6ad",
                    "800": "#bcdbcb",
                    "900": "#e3f0e9",
                    "foreground": "#1E1A24",
                    "DEFAULT": "#6DB18F"
                },
                "warning": {
                    "50": "#45360b",
                    "100": "#6d5512",
                    "200": "#967418",
                    "300": "#be941f",
                    "400": "#e6b325",
                    "500": "#eac04b",
                    "600": "#efce71",
                    "700": "#f3db97",
                    "800": "#f8e8be",
                    "900": "#fcf6e4",
                    "foreground": "#000",
                    "DEFAULT": "#EFCE71"
                },
                "danger": {
                    "50": "#49212F",
                    "100": "#6B2737",
                    "200": "#892436",
                    "300": "#AF3249",
                    "400": "#C9364F",
                    "500": "#D15469",
                    "600": "#DC7C8D",
                    "700": "#E7A5B0",
                    "800": "#F2CDD3",
                    "900": "#FAEBED",
                    "foreground": "#1E1A24",
                    "DEFAULT": "#DE8292"
                },
                "background": "#17131C",
                "foreground": "#F1EDF5",
                "content1": {
                    "DEFAULT": "#211B28",
                    "foreground": "#F1EDF5"
                },
                "content2": {
                    "DEFAULT": "#2A2332",
                    "foreground": "#F1EDF5"
                },
                "content3": {
                    "DEFAULT": "#352D3E",
                    "foreground": "#F1EDF5"
                },
                "content4": {
                    "DEFAULT": "#4D4557",
                    "foreground": "#F1EDF5"
                },
                "focus": "#E78255",
                "overlay": "#000000"
            },
        },
        // ... custom themes
    },
});

