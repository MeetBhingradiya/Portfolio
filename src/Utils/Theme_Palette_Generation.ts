/**
 * Theme Palette Generator
 * Generates a complete color palette from a single accent color
 * Supports both Apple Liquid Glass and Samsung One UI 7 Book themes
 */

export interface ThemePalette {
    // Primary colors
    accent: string;
    accentLight: string;
    accentDark: string;
    accentSubtle: string;

    // Backgrounds
    background: string;
    backgroundElevated: string;
    backgroundSecondary: string;
    backgroundTertiary: string;

    // Surfaces (for cards, modals, etc.)
    surface: string;
    surfaceElevated: string;
    surfaceSecondary: string;

    // Text colors
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    textOnAccent: string;

    // Borders
    border: string;
    borderSubtle: string;

    // Shadows
    shadowSm: string;
    shadowMd: string;
    shadowLg: string;

    // Special effects
    glassBg: string;
    glassBlur: string;
    liquidGlow: string;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16)
          }
        : { r: 0, g: 0, b: 0 };
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Lighten a color by a percentage
 */
function lighten(hex: string, percent: number): string {
    const rgb = hexToRgb(hex);
    const r = Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * percent));
    const g = Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * percent));
    const b = Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * percent));
    return rgbToHex(r, g, b);
}

/**
 * Darken a color by a percentage
 */
function darken(hex: string, percent: number): string {
    const rgb = hexToRgb(hex);
    const r = Math.max(0, Math.floor(rgb.r * (1 - percent)));
    const g = Math.max(0, Math.floor(rgb.g * (1 - percent)));
    const b = Math.max(0, Math.floor(rgb.b * (1 - percent)));
    return rgbToHex(r, g, b);
}

/**
 * Add alpha channel to hex color
 */
function addAlpha(hex: string, alpha: number): string {
    const rgb = hexToRgb(hex);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Generate complete theme palette from accent color
 */
export function generateThemePalette(accentColor: string, mode: "light" | "dark"): ThemePalette {
    const isLight = mode === "light";

    // Generate accent variations
    const accentLight = lighten(accentColor, 0.3);
    const accentDark = darken(accentColor, 0.2);
    const accentSubtle = addAlpha(accentColor, 0.1);

    if (isLight) {
        // Light mode palette
        return {
            accent: accentColor,
            accentLight,
            accentDark,
            accentSubtle,

            background: "#FFFFFF",
            backgroundElevated: "#F9FAFB",
            backgroundSecondary: "#F3F4F6",
            backgroundTertiary: "#E5E7EB",

            surface: "#FFFFFF",
            surfaceElevated: "#FAFBFC",
            surfaceSecondary: "#F5F6F7",

            textPrimary: "#1A1C1E",
            textSecondary: "#5F6368",
            textTertiary: "#80868B",
            textOnAccent: "#FFFFFF",

            border: "rgba(0, 0, 0, 0.08)",
            borderSubtle: "rgba(0, 0, 0, 0.04)",

            shadowSm: "0 1px 2px rgba(0, 0, 0, 0.04)",
            shadowMd: "0 4px 16px rgba(0, 0, 0, 0.08)",
            shadowLg: "0 12px 48px rgba(0, 0, 0, 0.12)",

            glassBg: "rgba(255, 255, 255, 0.7)",
            glassBlur: "blur(20px)",
            liquidGlow: addAlpha(accentColor, 0.15)
        };
    } else {
        // Dark mode palette
        return {
            accent: accentColor,
            accentLight,
            accentDark,
            accentSubtle,

            background: "#000000",
            backgroundElevated: "#1C1C1E",
            backgroundSecondary: "#2C2C2E",
            backgroundTertiary: "#3A3A3C",

            surface: "#1C1C1E",
            surfaceElevated: "#2C2C2E",
            surfaceSecondary: "#3A3A3C",

            textPrimary: "#FFFFFF",
            textSecondary: "#EBEBF5",
            textTertiary: "#8E8E93",
            textOnAccent: "#FFFFFF",

            border: "rgba(255, 255, 255, 0.12)",
            borderSubtle: "rgba(255, 255, 255, 0.06)",

            shadowSm: "0 1px 2px rgba(0, 0, 0, 0.5)",
            shadowMd: "0 4px 16px rgba(0, 0, 0, 0.6)",
            shadowLg: "0 12px 48px rgba(0, 0, 0, 0.7)",

            glassBg: "rgba(28, 28, 30, 0.7)",
            glassBlur: "blur(20px)",
            liquidGlow: addAlpha(accentColor, 0.2)
        };
    }
}
