import { heroui } from "@heroui/react";

export default heroui ({
    prefix: "heroui", // prefix for themes variables
    addCommonColors: false, // override common colors (e.g. "blue", "green", "pink").
    defaultTheme: "light", // default theme from the themes object
    defaultExtendTheme: "light", // default theme to extend on custom themes
    layout: {}, // common layout tokens (applied to all themes)
    themes: {
        light: {
            layout: { // light theme layout tokens
                "disabledOpacity": "0.5"
            },
            colors: { // light theme colors
                "default": {
                    "50": "#ffffff",
                    "100": "#fafafa",
                    "200": "#f4f4f5",
                    "300": "#ececee",
                    "400": "#e4e4e7",
                    "500": "#d4d4d8",
                    "600": "#a1a1aa",
                    "700": "#71717a",
                    "800": "#52525b",
                    "900": "#3f3f46",
                    "foreground": "#1B2A41",
                    "DEFAULT": "#d4d4d8"
                },
                "primary": {
                    "50": "#e3f4eb",
                    "100": "#bce3cf",
                    "200": "#96d3b3",
                    "300": "#6fc396",
                    "400": "#48b37a",
                    "500": "#21a35e",
                    "600": "#1b864e",
                    "700": "#156a3d",
                    "800": "#104d2d",
                    "900": "#0a311c",
                    "foreground": "#fff",
                    "DEFAULT": "#21a35e"
                },
                "secondary": {
                    "50": "#e3eef6",
                    "100": "#bcd6ea",
                    "200": "#96bedd",
                    "300": "#6fa6d1",
                    "400": "#488ec4",
                    "500": "#2176b8",
                    "600": "#1b6198",
                    "700": "#154d78",
                    "800": "#103857",
                    "900": "#0a2337",
                    "foreground": "#fff",
                    "DEFAULT": "#2176b8"
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
                    "50": "#fae8e8",
                    "100": "#f3c7c7",
                    "200": "#eca7a7",
                    "300": "#e48686",
                    "400": "#dd6666",
                    "500": "#d64545",
                    "600": "#b13939",
                    "700": "#8b2d2d",
                    "800": "#662121",
                    "900": "#401515",
                    "foreground": "#fff",
                    "DEFAULT": "#d64545"
                },
                "background": "#ffffff",
                "foreground": "#1B2A41",
                "content1": {
                    "DEFAULT": "#ffffff",
                    "foreground": "#1B2A41"
                },
                "content2": {
                    "DEFAULT": "#f4f4f5",
                    "foreground": "#1B2A41"
                },
                "content3": {
                    "DEFAULT": "#e4e4e7",
                    "foreground": "#1B2A41"
                },
                "content4": {
                    "DEFAULT": "#d4d4d8",
                    "foreground": "#1B2A41"
                },
                "focus": "#006FEE",
                "overlay": "#000000"
            },
        },
        dark: {
            layout: { // dark theme layout tokens
                "disabledOpacity": "0.5"
            },
            colors: { // dark theme colors
                "default": {
                    "50": "#18181b",
                    "100": "#1e1e20",
                    "200": "#27272a",
                    "300": "#3a3a3c",
                    "400": "#52525b",
                    "500": "#71717a",
                    "600": "#a1a1aa",
                    "700": "#d4d4d8",
                    "800": "#e4e4e7",
                    "900": "#ececee",
                    "foreground": "#fff",
                    "DEFAULT": "#3a3a3c"
                },
                "primary": {
                    "50": "#0a311c",
                    "100": "#104d2d",
                    "200": "#156a3d",
                    "300": "#1b864e",
                    "400": "#21a35e",
                    "500": "#48b37a",
                    "600": "#6fc396",
                    "700": "#96d3b3",
                    "800": "#bce3cf",
                    "900": "#e3f4eb",
                    "foreground": "#fff",
                    "DEFAULT": "#21a35e"
                },
                "secondary": {
                    "50": "#0a2337",
                    "100": "#103857",
                    "200": "#154d78",
                    "300": "#1b6198",
                    "400": "#2176b8",
                    "500": "#488ec4",
                    "600": "#6fa6d1",
                    "700": "#96bedd",
                    "800": "#bcd6ea",
                    "900": "#e3eef6",
                    "foreground": "#fff",
                    "DEFAULT": "#2176b8"
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
                    "foreground": "#fff",
                    "DEFAULT": "#1e8752"
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
                    "DEFAULT": "#e6b325"
                },
                "danger": {
                    "50": "#401515",
                    "100": "#662121",
                    "200": "#8b2d2d",
                    "300": "#b13939",
                    "400": "#d64545",
                    "500": "#dd6666",
                    "600": "#e48686",
                    "700": "#eca7a7",
                    "800": "#f3c7c7",
                    "900": "#fae8e8",
                    "foreground": "#fff",
                    "DEFAULT": "#d64545"
                },
                "background": "#18181b",
                "foreground": "#ffffff",
                "content1": {
                    "DEFAULT": "#18181b",
                    "foreground": "#fff"
                },
                "content2": {
                    "DEFAULT": "#27272a",
                    "foreground": "#fff"
                },
                "content3": {
                    "DEFAULT": "#3a3a3c",
                    "foreground": "#fff"
                },
                "content4": {
                    "DEFAULT": "#52525b",
                    "foreground": "#fff"
                },
                "focus": "#006FEE",
                "overlay": "#3a3a3c"
            },
        },
        // ... custom themes
    },
});

