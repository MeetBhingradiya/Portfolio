/**
 * Theme Switcher Component
 * Allows switching between Apple Liquid Glass and Samsung One UI 7 themes
 * Also toggles between light and dark modes
 */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "../../Hooks/useDesignTheme";
import { PRESET_COLORS } from "../../Utils/themeGenerator";
import {
    Palette,
    LightMode,
    DarkMode,
    Apple,
    PhoneAndroid,
    Check,
    Close
} from "@mui/icons-material";

export default function ThemeSwitcher() {
    const {
        designTheme,
        colorMode,
        accentColor,
        palette,
        setDesignTheme,
        setColorMode,
        setAccentColor,
        toggleColorMode
    } = useDesignTheme();

    const [isOpen, setIsOpen] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

    const isApple = designTheme === "apple";

    const appleColors = Object.values(PRESET_COLORS.apple);
    const samsungColors = Object.values(PRESET_COLORS.samsung);

    return (
        <div className="relative">
            {/* Toggle Button */}
            <motion.button
                className={`${isApple ? "p-3" : "p-4"} rounded-full flex items-center gap-2`}
                style={{
                    background: isApple
                        ? palette.glassBg
                        : palette.backgroundSecondary,
                    backdropFilter: isApple ? palette.glassBlur : "none",
                    border: `1px solid ${palette.border}`,
                    color: palette.textPrimary
                }}
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Palette />
                {!isApple && (
                    <span className="text-sm font-bold">Theme</span>
                )}
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
                            style={{
                                width: "320px",
                                maxWidth: "90vw",
                                backdropFilter: isApple
                                    ? "blur(40px) saturate(180%)"
                                    : "none",
                                background: isApple
                                    ? colorMode === "light"
                                        ? "rgba(255, 255, 255, 0.95)"
                                        : "rgba(28, 28, 30, 0.95)"
                                    : palette.surfaceElevated,
                                border: `1px solid ${palette.border}`,
                                borderRadius: isApple ? "20px" : "28px",
                                boxShadow: palette.shadowLg,
                                overflow: "hidden"
                            }}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className={isApple ? "p-4" : "p-6"}>
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <h3
                                        className={`${isApple ? "text-lg font-bold" : "text-xl font-black"}`}
                                        style={{ color: palette.textPrimary }}
                                    >
                                        Theme Settings
                                    </h3>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 rounded-lg"
                                        style={{ color: palette.textSecondary }}
                                    >
                                        <Close />
                                    </button>
                                </div>

                                {/* Design Theme Selection */}
                                <div className="mb-6">
                                    <label
                                        className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"} block mb-3`}
                                        style={{ color: palette.textSecondary }}
                                    >
                                        Design Theme
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <motion.button
                                            className={`${isApple ? "p-4 rounded-xl" : "p-5 rounded-2xl"} flex flex-col items-center gap-2 relative`}
                                            style={{
                                                background:
                                                    designTheme === "apple"
                                                        ? palette.accentSubtle
                                                        : palette.backgroundSecondary,
                                                border: `2px solid ${designTheme === "apple" ? palette.accent : "transparent"}`
                                            }}
                                            onClick={() => {
                                                setDesignTheme("apple");
                                                setAccentColor(PRESET_COLORS.apple.blue);
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {designTheme === "apple" && (
                                                <div
                                                    className="absolute top-2 right-2"
                                                    style={{ color: palette.accent }}
                                                >
                                                    <Check className="text-lg" />
                                                </div>
                                            )}
                                            <Apple
                                                className="text-3xl"
                                                style={{
                                                    color:
                                                        designTheme === "apple"
                                                            ? palette.accent
                                                            : palette.textSecondary
                                                }}
                                            />
                                            <span
                                                className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"}`}
                                                style={{
                                                    color:
                                                        designTheme === "apple"
                                                            ? palette.accent
                                                            : palette.textSecondary
                                                }}
                                            >
                                                Apple
                                            </span>
                                        </motion.button>

                                        <motion.button
                                            className={`${isApple ? "p-4 rounded-xl" : "p-5 rounded-2xl"} flex flex-col items-center gap-2 relative`}
                                            style={{
                                                background:
                                                    designTheme === "samsung"
                                                        ? palette.accentSubtle
                                                        : palette.backgroundSecondary,
                                                border: `2px solid ${designTheme === "samsung" ? palette.accent : "transparent"}`
                                            }}
                                            onClick={() => {
                                                setDesignTheme("samsung");
                                                setAccentColor(PRESET_COLORS.samsung.blue);
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {designTheme === "samsung" && (
                                                <div
                                                    className="absolute top-2 right-2"
                                                    style={{ color: palette.accent }}
                                                >
                                                    <Check className="text-lg" />
                                                </div>
                                            )}
                                            <PhoneAndroid
                                                className="text-3xl"
                                                style={{
                                                    color:
                                                        designTheme === "samsung"
                                                            ? palette.accent
                                                            : palette.textSecondary
                                                }}
                                            />
                                            <span
                                                className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"}`}
                                                style={{
                                                    color:
                                                        designTheme === "samsung"
                                                            ? palette.accent
                                                            : palette.textSecondary
                                                }}
                                            >
                                                Samsung
                                            </span>
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Color Mode Toggle */}
                                <div className="mb-6">
                                    <label
                                        className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"} block mb-3`}
                                        style={{ color: palette.textSecondary }}
                                    >
                                        Appearance
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <motion.button
                                            className={`${isApple ? "p-4 rounded-xl" : "p-5 rounded-2xl"} flex flex-col items-center gap-2`}
                                            style={{
                                                background:
                                                    colorMode === "light"
                                                        ? palette.accentSubtle
                                                        : palette.backgroundSecondary,
                                                border: `2px solid ${colorMode === "light" ? palette.accent : "transparent"}`
                                            }}
                                            onClick={() => setColorMode("light")}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <LightMode
                                                className="text-2xl"
                                                style={{
                                                    color:
                                                        colorMode === "light"
                                                            ? palette.accent
                                                            : palette.textSecondary
                                                }}
                                            />
                                            <span
                                                className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"}`}
                                                style={{
                                                    color:
                                                        colorMode === "light"
                                                            ? palette.accent
                                                            : palette.textSecondary
                                                }}
                                            >
                                                Light
                                            </span>
                                        </motion.button>

                                        <motion.button
                                            className={`${isApple ? "p-4 rounded-xl" : "p-5 rounded-2xl"} flex flex-col items-center gap-2`}
                                            style={{
                                                background:
                                                    colorMode === "dark"
                                                        ? palette.accentSubtle
                                                        : palette.backgroundSecondary,
                                                border: `2px solid ${colorMode === "dark" ? palette.accent : "transparent"}`
                                            }}
                                            onClick={() => setColorMode("dark")}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <DarkMode
                                                className="text-2xl"
                                                style={{
                                                    color:
                                                        colorMode === "dark"
                                                            ? palette.accent
                                                            : palette.textSecondary
                                                }}
                                            />
                                            <span
                                                className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"}`}
                                                style={{
                                                    color:
                                                        colorMode === "dark"
                                                            ? palette.accent
                                                            : palette.textSecondary
                                                }}
                                            >
                                                Dark
                                            </span>
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Accent Color Picker */}
                                <div>
                                    <label
                                        className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"} block mb-3`}
                                        style={{ color: palette.textSecondary }}
                                    >
                                        Accent Color
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {(designTheme === "apple"
                                            ? appleColors
                                            : samsungColors
                                        ).map((color) => (
                                            <motion.button
                                                key={color}
                                                className={`${isApple ? "w-10 h-10" : "w-12 h-12"} rounded-full relative`}
                                                style={{
                                                    background: color,
                                                    border: `3px solid ${accentColor === color ? palette.textPrimary : "transparent"}`
                                                }}
                                                onClick={() => setAccentColor(color)}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                {accentColor === color && (
                                                    <Check
                                                        className="absolute inset-0 m-auto"
                                                        style={{ color: "white" }}
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
