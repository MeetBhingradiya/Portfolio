"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { THEME_PRESET_COLORS } from "@Static/Theme_Preset_Colors";
import { Palette, LightMode, DarkMode, SettingsBrightness, Apple, PhoneAndroid, Check, Close } from "@mui/icons-material";

export default function ThemeSwitcher() {
    const { designTheme, colorMode, actualColorMode, accentColor, palette, setDesignTheme, setColorMode, setAccentColor, toggleColorMode } =
        useDesignTheme();

    const [isOpen, setIsOpen] = useState(false);
    const [systemAccentColor, setSystemAccentColor] = useState<string | null>(null);

    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const themeColors = React.useMemo(
        () => (designTheme === "apple" ? Object.values(THEME_PRESET_COLORS.apple) : Object.values(THEME_PRESET_COLORS.samsung)),
        [designTheme]
    );

    // Memoize styles
    const buttonStyles = React.useMemo(
        () => ({
            background: isApple
                ? isDark
                    ? "linear-gradient(180deg, rgba(58, 58, 60, 0.72) 0%, rgba(44, 44, 46, 0.68) 50%, rgba(28, 28, 30, 0.72) 100%)"
                    : "linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(250, 250, 250, 0.6) 50%, rgba(255, 255, 255, 0.7) 100%)"
                : palette.backgroundSecondary,
            backdropFilter: isApple ? "blur(30px) saturate(200%)" : "none",
            WebkitBackdropFilter: isApple ? "blur(30px) saturate(200%)" : "none",
            border: isApple
                ? isDark
                    ? "0.5px solid rgba(255, 255, 255, 0.18)"
                    : "0.5px solid rgba(255, 255, 255, 0.8)"
                : `1px solid ${palette.border}`,
            boxShadow: isApple
                ? isDark
                    ? "0 8px 32px rgba(0, 0, 0, 0.48), 0 0 0 0.5px rgba(255, 255, 255, 0.1) inset, 0 1px 0 0 rgba(255, 255, 255, 0.15) inset, 0 -1px 0 0 rgba(0, 0, 0, 0.3) inset"
                    : "0 4px 24px rgba(0, 0, 0, 0.1), 0 0 0 0.5px rgba(255, 255, 255, 1) inset, 0 1px 2px 0 rgba(255, 255, 255, 1) inset, 0 -1px 1px 0 rgba(0, 0, 0, 0.04) inset"
                : "none",
            color: palette.textPrimary
        }),
        [isApple, isDark, palette]
    );

    const panelStyles = React.useMemo(
        () => ({
            width: "320px",
            maxWidth: "90vw",
            backdropFilter: isApple ? "blur(60px) saturate(200%) brightness(1.05)" : "none",
            WebkitBackdropFilter: isApple ? "blur(60px) saturate(200%) brightness(1.05)" : "none",
            background: isApple
                ? isDark
                    ? "linear-gradient(180deg, rgba(44, 44, 46, 0.78) 0%, rgba(36, 36, 38, 0.72) 40%, rgba(28, 28, 30, 0.78) 100%)"
                    : "linear-gradient(180deg, rgba(255, 255, 255, 0.72) 0%, rgba(252, 252, 252, 0.65) 40%, rgba(250, 250, 250, 0.72) 100%)"
                : palette.surfaceElevated,
            border: isApple
                ? isDark
                    ? "0.5px solid rgba(255, 255, 255, 0.18)"
                    : "0.5px solid rgba(255, 255, 255, 0.9)"
                : `1px solid ${palette.border}`,
            borderRadius: isApple ? "20px" : "28px",
            boxShadow: isApple
                ? isDark
                    ? "0 24px 72px rgba(0, 0, 0, 0.64), 0 0 0 0.5px rgba(255, 255, 255, 0.08) inset, 0 1px 2px 0 rgba(255, 255, 255, 0.15) inset, 0 -1px 2px 0 rgba(0, 0, 0, 0.4) inset"
                    : "0 12px 48px rgba(0, 0, 0, 0.15), 0 0 0 0.5px rgba(255, 255, 255, 1) inset, 0 2px 4px 0 rgba(255, 255, 255, 1) inset, 0 -1px 2px 0 rgba(0, 0, 0, 0.05) inset"
                : palette.shadowLg,
            overflow: "hidden"
        }),
        [isApple, isDark, palette]
    );

    // Detect system accent color
    React.useEffect(() => {
        if (typeof window === "undefined") return;

        const detectSystemColor = () => {
            try {
                const testDiv = document.createElement("div");
                testDiv.style.accentColor = "auto";
                document.body.appendChild(testDiv);
                const color = window.getComputedStyle(testDiv).accentColor;
                document.body.removeChild(testDiv);

                if (color && color !== "auto" && color !== "transparent") {
                    setSystemAccentColor(color);
                    return;
                }

                const link = document.createElement("a");
                link.href = "#";
                link.style.color = "LinkText";
                document.body.appendChild(link);
                const linkColor = window.getComputedStyle(link).color;
                document.body.removeChild(link);

                if (linkColor && linkColor !== "rgb(0, 0, 238)") {
                    setSystemAccentColor(linkColor);
                }
            } catch (error) {
                console.log("Could not detect system accent color");
            }
        };

        detectSystemColor();
    }, []);

    const handleThemeChange = React.useCallback(
        (theme: typeof designTheme) => {
            setDesignTheme(theme);
            setAccentColor(THEME_PRESET_COLORS[theme].blue);
        },
        [setDesignTheme, setAccentColor]
    );

    return (
        <div className="relative">
            {/* Toggle Button */}
            <motion.button
                className={`${isApple ? "p-3" : "p-4"} rounded-full flex items-center gap-2 relative overflow-hidden`}
                style={buttonStyles}
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                {isApple && (
                    <>
                        {/* Glass refraction - top highlight */}
                        <div
                            className="absolute inset-x-0 top-0 pointer-events-none"
                            style={{
                                height: "45%",
                                background: isDark
                                    ? "linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 30%, rgba(255, 255, 255, 0.02) 60%, transparent 100%)"
                                    : "linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.6) 30%, rgba(255, 255, 255, 0.2) 60%, transparent 100%)",
                                borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
                                mixBlendMode: isDark ? "screen" : "overlay"
                            }}
                        />
                        <div
                            className="absolute pointer-events-none"
                            style={{
                                top: "15%",
                                left: "25%",
                                width: "50%",
                                height: "30%",
                                background: isDark
                                    ? "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 40%, transparent 70%)"
                                    : "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.4) 40%, transparent 70%)",
                                borderRadius: "50%",
                                filter: "blur(4px)"
                            }}
                        />
                        <div
                            className="absolute inset-x-0 bottom-0 pointer-events-none"
                            style={{
                                height: "35%",
                                background: isDark
                                    ? "linear-gradient(0deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.08) 50%, transparent 100%)"
                                    : "linear-gradient(0deg, rgba(0, 0, 0, 0.03) 0%, rgba(0, 0, 0, 0.01) 50%, transparent 100%)",
                                borderRadius: "0 0 50% 50% / 0 0 100% 100%"
                            }}
                        />
                    </>
                )}
                <Palette className="relative z-10" />
            </motion.button>

            {/* Theme Switcher Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            className="absolute bottom-full right-0 mb-4 z-50"
                            style={panelStyles}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}>
                            {isApple && (
                                <>
                                    <div
                                        className="absolute inset-x-0 top-0 pointer-events-none"
                                        style={{
                                            height: "40%",
                                            background: isDark
                                                ? "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 25%, rgba(255, 255, 255, 0.02) 50%, transparent 100%)"
                                                : "linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.7) 25%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)",
                                            borderRadius: "20px 20px 60% 60% / 20px 20px 15% 15%",
                                            mixBlendMode: isDark ? "screen" : "overlay"
                                        }}
                                    />
                                    <div
                                        className="absolute pointer-events-none"
                                        style={{
                                            top: "8%",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            width: "60%",
                                            height: "25%",
                                            background: isDark
                                                ? "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.04) 40%, transparent 70%)"
                                                : "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.5) 40%, transparent 70%)",
                                            borderRadius: "50%",
                                            filter: "blur(8px)"
                                        }}
                                    />
                                    <div
                                        className="absolute inset-x-0 top-0 pointer-events-none"
                                        style={{
                                            height: "1px",
                                            background: isDark
                                                ? "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.25) 50%, transparent 100%)"
                                                : "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 1) 50%, transparent 100%)",
                                            borderRadius: "20px 20px 0 0"
                                        }}
                                    />
                                    <div
                                        className="absolute inset-x-0 bottom-0 pointer-events-none"
                                        style={{
                                            height: "30%",
                                            background: isDark
                                                ? "linear-gradient(0deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.06) 50%, transparent 100%)"
                                                : "linear-gradient(0deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.01) 50%, transparent 100%)",
                                            borderRadius: "0 0 20px 20px"
                                        }}
                                    />
                                </>
                            )}
                            <div className={isApple ? "p-4" : "p-6"}>
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <h3
                                        className={`${isApple ? "text-lg font-bold" : "text-xl font-black"}`}
                                        style={{ color: palette.textPrimary }}>
                                        Theme Settings
                                    </h3>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 rounded-lg"
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        <Close />
                                    </button>
                                </div>

                                {/* Design Theme Selection */}
                                <div className="mb-6">
                                    <label
                                        className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"} block mb-3`}
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        Design System
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <motion.button
                                            className={`${isApple ? "p-4 rounded-xl" : "p-5 rounded-2xl"} flex flex-col items-center gap-2 relative`}
                                            style={{
                                                background: designTheme === "apple" ? palette.accentSubtle : palette.backgroundSecondary,
                                                border: `2px solid ${designTheme === "apple" ? palette.accent : "transparent"}`
                                            }}
                                            onClick={() => handleThemeChange("apple")}
                                            whileTap={{ scale: 0.95 }}>
                                            {designTheme === "apple" && (
                                                <div
                                                    className="absolute top-2 right-2"
                                                    style={{
                                                        color: palette.accent
                                                    }}>
                                                    <Check className="text-lg" />
                                                </div>
                                            )}
                                            <Apple
                                                className="text-3xl"
                                                style={{
                                                    color: designTheme === "apple" ? palette.accent : palette.textSecondary
                                                }}
                                            />
                                            <span
                                                className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"}`}
                                                style={{
                                                    color: designTheme === "apple" ? palette.accent : palette.textSecondary
                                                }}>
                                                Apple
                                            </span>
                                        </motion.button>

                                        <motion.button
                                            className={`${isApple ? "p-4 rounded-xl" : "p-5 rounded-2xl"} flex flex-col items-center gap-2 relative`}
                                            style={{
                                                background: designTheme === "samsung" ? palette.accentSubtle : palette.backgroundSecondary,
                                                border: `2px solid ${designTheme === "samsung" ? palette.accent : "transparent"}`
                                            }}
                                            onClick={() => handleThemeChange("samsung")}
                                            whileTap={{ scale: 0.95 }}>
                                            {designTheme === "samsung" && (
                                                <div
                                                    className="absolute top-2 right-2"
                                                    style={{
                                                        color: palette.accent
                                                    }}>
                                                    <Check className="text-lg" />
                                                </div>
                                            )}
                                            <PhoneAndroid
                                                className="text-3xl"
                                                style={{
                                                    color: designTheme === "samsung" ? palette.accent : palette.textSecondary
                                                }}
                                            />
                                            <span
                                                className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"}`}
                                                style={{
                                                    color: designTheme === "samsung" ? palette.accent : palette.textSecondary
                                                }}>
                                                Samsung
                                            </span>
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Color Mode Toggle */}
                                <div className="mb-6">
                                    <label
                                        className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"} block mb-3`}
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        Appearance
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <motion.button
                                            className={`${isApple ? "p-3 rounded-xl" : "p-4 rounded-2xl"} flex flex-col items-center gap-2`}
                                            style={{
                                                background: colorMode === "light" ? palette.accentSubtle : palette.backgroundSecondary,
                                                border: `2px solid ${colorMode === "light" ? palette.accent : "transparent"}`
                                            }}
                                            onClick={() => setColorMode("light")}
                                            whileTap={{ scale: 0.95 }}>
                                            <LightMode
                                                className="text-2xl"
                                                style={{
                                                    color: colorMode === "light" ? palette.accent : palette.textSecondary
                                                }}
                                            />
                                            <span
                                                className={`${isApple ? "text-xs font-semibold" : "text-sm font-bold"}`}
                                                style={{
                                                    color: colorMode === "light" ? palette.accent : palette.textSecondary
                                                }}>
                                                Light
                                            </span>
                                        </motion.button>

                                        <motion.button
                                            className={`${isApple ? "p-3 rounded-xl" : "p-4 rounded-2xl"} flex flex-col items-center gap-2`}
                                            style={{
                                                background: colorMode === "dark" ? palette.accentSubtle : palette.backgroundSecondary,
                                                border: `2px solid ${colorMode === "dark" ? palette.accent : "transparent"}`
                                            }}
                                            onClick={() => setColorMode("dark")}
                                            whileTap={{ scale: 0.95 }}>
                                            <DarkMode
                                                className="text-2xl"
                                                style={{
                                                    color: colorMode === "dark" ? palette.accent : palette.textSecondary
                                                }}
                                            />
                                            <span
                                                className={`${isApple ? "text-xs font-semibold" : "text-sm font-bold"}`}
                                                style={{
                                                    color: colorMode === "dark" ? palette.accent : palette.textSecondary
                                                }}>
                                                Dark
                                            </span>
                                        </motion.button>

                                        <motion.button
                                            className={`${isApple ? "p-3 rounded-xl" : "p-4 rounded-2xl"} flex flex-col items-center gap-2`}
                                            style={{
                                                background: colorMode === "system" ? palette.accentSubtle : palette.backgroundSecondary,
                                                border: `2px solid ${colorMode === "system" ? palette.accent : "transparent"}`
                                            }}
                                            onClick={() => setColorMode("system")}
                                            whileTap={{ scale: 0.95 }}>
                                            <SettingsBrightness
                                                className="text-2xl"
                                                style={{
                                                    color: colorMode === "system" ? palette.accent : palette.textSecondary
                                                }}
                                            />
                                            <span
                                                className={`${isApple ? "text-xs font-semibold" : "text-sm font-bold"}`}
                                                style={{
                                                    color: colorMode === "system" ? palette.accent : palette.textSecondary
                                                }}>
                                                System
                                            </span>
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Accent Color Picker */}
                                <div>
                                    <label
                                        className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"} block mb-3`}
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        Accent Color
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {/* System Color Option (if available) */}
                                        {systemAccentColor && (
                                            <motion.button
                                                className={`${isApple ? "w-10 h-10" : "w-12 h-12"} rounded-full relative overflow-hidden`}
                                                style={{
                                                    background: `conic-gradient(from 0deg, ${systemAccentColor}, ${systemAccentColor})`,
                                                    border: `3px solid ${accentColor === systemAccentColor ? palette.textPrimary : palette.border}`,
                                                    position: "relative"
                                                }}
                                                onClick={() => setAccentColor(systemAccentColor)}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                title="System Accent Color">
                                                {accentColor === systemAccentColor ? (
                                                    <Check
                                                        className="absolute inset-0 m-auto"
                                                        style={{
                                                            color: "white"
                                                        }}
                                                    />
                                                ) : (
                                                    <SettingsBrightness
                                                        className="absolute inset-0 m-auto text-sm"
                                                        style={{
                                                            color: "white",
                                                            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))"
                                                        }}
                                                    />
                                                )}
                                            </motion.button>
                                        )}

                                        {/* Theme Preset Colors */}
                                        {themeColors.map((color) => (
                                            <motion.button
                                                key={color}
                                                className={`${isApple ? "w-10 h-10" : "w-12 h-12"} rounded-full relative`}
                                                style={{
                                                    background: color,
                                                    border: `3px solid ${accentColor === color ? palette.textPrimary : "transparent"}`
                                                }}
                                                onClick={() => setAccentColor(color)}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}>
                                                {accentColor === color && (
                                                    <Check
                                                        className="absolute inset-0 m-auto"
                                                        style={{
                                                            color: "white"
                                                        }}
                                                    />
                                                )}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
