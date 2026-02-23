"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useMemo
} from "react";
import { generateThemePalette, ThemePalette } from "../Utils/themeGenerator";

export type DesignTheme = "apple" | "samsung";
export type ColorMode = "light" | "dark";

interface DesignThemeContextType {
    designTheme: DesignTheme;
    colorMode: ColorMode;
    accentColor: string;
    palette: ThemePalette;
    setDesignTheme: (theme: DesignTheme) => void;
    setColorMode: (mode: ColorMode) => void;
    setAccentColor: (color: string) => void;
    toggleColorMode: () => void;
}

const DesignThemeContext = createContext<DesignThemeContextType | undefined>(
    undefined
);

export function DesignThemeProvider({
    children
}: {
    children: React.ReactNode;
}) {
    const [designTheme, setDesignTheme] = useState<DesignTheme>("samsung");
    const [colorMode, setColorMode] = useState<ColorMode>("dark");
    const [accentColor, setAccentColor] = useState<string>("#5E35B1"); // Samsung Purple

    // Generate theme palette based on accent color
    const palette = useMemo(
        () => generateThemePalette(accentColor, colorMode),
        [accentColor, colorMode]
    );

    // Load saved preferences
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedTheme = localStorage.getItem("designTheme") as DesignTheme;
            const savedMode = localStorage.getItem("colorMode") as ColorMode;
            const savedAccent = localStorage.getItem("accentColor");

            if (savedTheme) setDesignTheme(savedTheme);
            if (savedMode) setColorMode(savedMode);
            if (savedAccent) setAccentColor(savedAccent);
            else {
                // Set default accent colors
                if (savedTheme === "samsung") {
                    setAccentColor("#5E35B1"); // Samsung Purple
                }
            }
        }
    }, []);

    // Listen for theme changes from other components/tabs
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "designTheme" && e.newValue) {
                setDesignTheme(e.newValue as DesignTheme);
            } else if (e.key === "colorMode" && e.newValue) {
                setColorMode(e.newValue as ColorMode);
            } else if (e.key === "accentColor" && e.newValue) {
                setAccentColor(e.newValue);
            }
        };

        // Custom event for same-window updates
        const handleThemeChange = (e: CustomEvent) => {
            if (e.detail.designTheme) setDesignTheme(e.detail.designTheme);
            if (e.detail.colorMode) setColorMode(e.detail.colorMode);
            if (e.detail.accentColor) setAccentColor(e.detail.accentColor);
        };

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("themeChange" as any, handleThemeChange as any);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("themeChange" as any, handleThemeChange as any);
        };
    }, []);

    // Save preferences and apply to DOM
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("designTheme", designTheme);
            localStorage.setItem("colorMode", colorMode);
            localStorage.setItem("accentColor", accentColor);

            // Apply theme attributes to root element
            const root = document.documentElement;
            root.setAttribute("data-design-theme", designTheme);
            root.setAttribute("data-color-mode", colorMode);

            // Apply CSS custom properties for palette
            Object.entries(palette).forEach(([key, value]) => {
                root.style.setProperty(`--${key}`, String(value));
            });

            // Apply dark/light class
            root.classList.remove("light", "dark");
            root.classList.add(colorMode);

            // Dispatch custom event for same-window sync
            window.dispatchEvent(
                new CustomEvent("themeChange", {
                    detail: { designTheme, colorMode, accentColor }
                })
            );
        }
    }, [designTheme, colorMode, accentColor, palette]);

    const toggleColorMode = () => {
        setColorMode((prev) => (prev === "light" ? "dark" : "light"));
    };

    const value: DesignThemeContextType = {
        designTheme,
        colorMode,
        accentColor,
        palette,
        setDesignTheme,
        setColorMode,
        setAccentColor,
        toggleColorMode
    };

    return (
        <DesignThemeContext.Provider value={value}>
            {children}
        </DesignThemeContext.Provider>
    );
}

export function useDesignTheme() {
    const context = useContext(DesignThemeContext);5
    if (context === undefined) {
        throw new Error(
            "useDesignTheme must be used within a DesignThemeProvider"
        );
    }
    return context;
}
