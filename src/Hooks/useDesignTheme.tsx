"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useMemo
} from "react";
import { generateThemePalette, ThemePalette } from "@Utils/Theme_Palette_Generation";

export type DesignTheme = "apple" | "samsung";
export type ColorMode = "light" | "dark" | "system";

interface DesignThemeContextType {
    designTheme: DesignTheme;
    colorMode: ColorMode;
    actualColorMode: "light" | "dark";
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
    const [isInitialized, setIsInitialized] = useState(false);
    const [designTheme, setDesignTheme] = useState<DesignTheme>("samsung");
    const [colorMode, setColorMode] = useState<ColorMode>("dark");
    const [accentColor, setAccentColor] = useState<string>("#5E35B1"); // Samsung Purple

    // Get actual color mode (resolve "system" to "light" or "dark")
    const actualColorMode = useMemo(() => {
        if (colorMode !== "system") return colorMode;
        if (typeof window === "undefined") return "dark";
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }, [colorMode]);

    // Generate theme palette based on accent color
    const palette = useMemo(
        () => generateThemePalette(accentColor, actualColorMode),
        [accentColor, actualColorMode]
    );

    // Load saved preferences
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedTheme = localStorage.getItem("designTheme") as DesignTheme;
            const savedMode = localStorage.getItem("colorMode") as ColorMode;
            const savedAccent = localStorage.getItem("accentColor");

            // Load theme first
            const currentTheme = savedTheme || "samsung";
            setDesignTheme(currentTheme);
            
            // Load color mode
            const currentMode = savedMode || "system";
            setColorMode(currentMode);
            
            // Load or set accent color
            if (savedAccent) {
                setAccentColor(savedAccent);
            } else {
                // Set default accent colors based on theme
                if (currentTheme === "samsung") {
                    setAccentColor("#5E35B1"); // Samsung Purple
                } else if (currentTheme === "apple") {
                    setAccentColor("#007AFF"); // Apple Blue
                }
            }
            
            setIsInitialized(true);
        }
    }, []);

    // Listen for system color scheme changes
    useEffect(() => {
        if (typeof window === "undefined") return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            if (colorMode === "system") {
                // Force re-render by toggling state
                setColorMode("system");
            }
        };

        // Use both 'change' and 'addListener' for broader compatibility
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", handleChange);
        } else if (mediaQuery.addListener) {
            mediaQuery.addListener(handleChange);
        }

        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener("change", handleChange);
            } else if (mediaQuery.removeListener) {
                mediaQuery.removeListener(handleChange);
            }
        };
    }, [colorMode]);

    // Get system accent color
    useEffect(() => {
        if (typeof window === "undefined" || !CSS.supports("color", "AccentColor")) return;

        const getSystemAccentColor = () => {
            try {
                // Try to get Windows accent color from meta theme-color or computed styles
                const metaTheme = document.querySelector('meta[name="theme-color"]');
                if (metaTheme) {
                    const color = metaTheme.getAttribute("content");
                    if (color) return color;
                }

                // Try to get from CSS custom property if set by system
                const rootStyle = getComputedStyle(document.documentElement);
                const systemColor = rootStyle.getPropertyValue("--system-accent-color");
                if (systemColor) return systemColor.trim();

                // Try AccentColor if supported
                const accentColor = rootStyle.getPropertyValue("accent-color");
                if (accentColor && accentColor !== "auto") return accentColor.trim();
            } catch (error) {
                console.log("Could not detect system accent color");
            }
            return null;
        };

        const systemColor = getSystemAccentColor();
        if (systemColor && colorMode === "system") {
            const savedAccent = localStorage.getItem("accentColor");
            const savedColorMode = localStorage.getItem("colorMode");
            
            // Only apply system color if user hasn't manually set one
            if (!savedAccent || savedColorMode === "system") {
                setAccentColor(systemColor);
            }
        }
    }, [colorMode]);

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
        if (typeof window !== "undefined" && isInitialized) {
            localStorage.setItem("designTheme", designTheme);
            localStorage.setItem("colorMode", colorMode);
            localStorage.setItem("accentColor", accentColor);

            // Dispatch custom event for same-window sync
            window.dispatchEvent(
                new CustomEvent("themeChange", {
                    detail: { designTheme, colorMode, accentColor }
                })
            );
        }
    }, [designTheme, colorMode, accentColor, isInitialized]);

    // Apply to DOM (runs always, even before initialized)
    useEffect(() => {
        if (typeof window !== "undefined") {
            // Apply theme attributes to root element
            const root = document.documentElement;
            root.setAttribute("data-design-theme", designTheme);
            root.setAttribute("data-color-mode", colorMode);
            root.setAttribute("data-actual-color-mode", actualColorMode);

            // Apply CSS custom properties for palette
            Object.entries(palette).forEach(([key, value]) => {
                root.style.setProperty(`--${key}`, String(value));
            });

            // Apply dark/light class based on actual mode
            root.classList.remove("light", "dark");
            root.classList.add(actualColorMode);

            // Set meta theme-color for mobile browsers
            let metaTheme = document.querySelector('meta[name="theme-color"]');
            if (!metaTheme) {
                metaTheme = document.createElement("meta");
                metaTheme.setAttribute("name", "theme-color");
                document.head.appendChild(metaTheme);
            }
            metaTheme.setAttribute("content", palette.background);
        }
    }, [designTheme, colorMode, actualColorMode, palette]);

    const toggleColorMode = () => {
        setColorMode((prev) => {
            if (prev === "light") return "dark";
            if (prev === "dark") return "system";
            return "light";
        });
    };

    const value: DesignThemeContextType = {
        designTheme,
        colorMode,
        actualColorMode,
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
