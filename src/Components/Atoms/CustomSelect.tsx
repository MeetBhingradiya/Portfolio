/**
 * Custom Select Component
 * Theme-aware dropdown select with animations
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { KeyboardArrowDown } from "@mui/icons-material";

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    value,
    onChange,
    options,
    placeholder = "Select...",
    className = ""
}) => {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className={`relative z-50 ${className}`}>
            <motion.button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 rounded-xl border-none outline-none text-left flex items-center justify-between"
                style={{
                    background: isDark
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.03)",
                    color: palette.textPrimary,
                    cursor: "pointer"
                }}
                whileHover={{
                    background: isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.05)"
                }}
                whileTap={{ scale: 0.98 }}
            >
                <span>{selectedOption?.label || placeholder}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <KeyboardArrowDown style={{ color: palette.textSecondary }} />
                </motion.div>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 w-full mt-2 rounded-xl overflow-hidden shadow-2xl"
                        style={{
                            background: isDark
                                ? "rgba(28, 28, 30, 0.95)"
                                : "rgba(255, 255, 255, 0.95)",
                            backdropFilter: "blur(20px)",
                            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
                            maxHeight: "300px",
                            overflowY: "auto"
                        }}
                    >
                        {options.map((option, index) => (
                            <motion.button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className="w-full px-4 py-3 text-left border-none outline-none cursor-pointer"
                                style={{
                                    background: value === option.value
                                        ? `${palette.accent}20`
                                        : "transparent",
                                    color: value === option.value
                                        ? palette.accent
                                        : palette.textPrimary,
                                    fontWeight: value === option.value
                                        ? isApple ? 600 : 700
                                        : 400,
                                    borderBottom: index < options.length - 1
                                        ? `1px solid ${isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"}`
                                        : "none"
                                }}
                                whileHover={{
                                    background: value === option.value
                                        ? `${palette.accent}30`
                                        : isDark
                                            ? "rgba(255, 255, 255, 0.05)"
                                            : "rgba(0, 0, 0, 0.03)"
                                }}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.15, delay: index * 0.02 }}
                            >
                                {option.label}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
