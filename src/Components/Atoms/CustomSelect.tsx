/**
 * Custom Select Component
 * Theme-aware dropdown select with animations
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
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

export const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, placeholder = "Select...", className = "" }) => {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({
        top: 0,
        left: 0,
        width: 0
    });
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const insideContainer = containerRef.current?.contains(target);
            const insideDropdown = dropdownRef.current?.contains(target);
            if (!insideContainer && !insideDropdown) {
                setIsOpen(false);
            }
        };
        const handleScroll = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDropdownPos({
                    top: rect.bottom + 6,
                    left: rect.left,
                    width: rect.width
                });
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("scroll", handleScroll, true);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, [isOpen]);

    const handleOpen = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 6,
                left: rect.left,
                width: rect.width
            });
        }
        setIsOpen((v) => !v);
    };

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const dropdown =
        mounted && isOpen
            ? createPortal(
                  <AnimatePresence>
                      <motion.div
                          key="select-dropdown"
                          className={`custom-select-dropdown ${isDark ? "cs-dark" : "cs-light"}`}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.15 }}
                          ref={dropdownRef}
                          style={{
                              position: "fixed",
                              top: dropdownPos.top,
                              left: dropdownPos.left,
                              width: dropdownPos.width,
                              zIndex: 9999,
                              background: isDark ? "rgba(28,28,30,0.98)" : "rgba(255,255,255,0.98)",
                              backdropFilter: "blur(20px)",
                              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                              borderRadius: 14,
                              boxShadow: "0 8px 32px rgba(0,0,0,0.24)",
                              maxHeight: 300,
                              overflowY: "auto",
                              scrollbarWidth: "thin",
                              scrollbarColor: isDark ? "rgba(255,255,255,0.20) transparent" : "rgba(0,0,0,0.22) transparent"
                          }}>
                          {options.map((option, index) => (
                              <motion.button
                                  key={option.value}
                                  type="button"
                                  onClick={() => handleSelect(option.value)}
                                  className="w-full px-4 py-3 text-left border-none outline-none cursor-pointer"
                                  style={{
                                      background: value === option.value ? `${palette.accent}20` : "transparent",
                                      color: value === option.value ? palette.accent : palette.textPrimary,
                                      fontWeight: value === option.value ? (isApple ? 600 : 700) : 400,
                                      borderBottom:
                                          index < options.length - 1
                                              ? `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`
                                              : "none"
                                  }}
                                  whileHover={{
                                      background:
                                          value === option.value
                                              ? `${palette.accent}30`
                                              : isDark
                                                ? "rgba(255,255,255,0.05)"
                                                : "rgba(0,0,0,0.03)"
                                  }}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{
                                      duration: 0.12,
                                      delay: index * 0.02
                                  }}>
                                  {option.label}
                              </motion.button>
                          ))}
                      </motion.div>
                  </AnimatePresence>,
                  document.body
              )
            : null;

    return (
        <div
            ref={containerRef}
            className={`relative ${className}`}>
            <motion.button
                type="button"
                onClick={handleOpen}
                className="w-full px-4 py-3 rounded-xl border-none outline-none text-left flex items-center justify-between"
                style={{
                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                    color: palette.textPrimary,
                    cursor: "pointer"
                }}
                whileHover={{
                    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"
                }}
                whileTap={{ scale: 0.98 }}>
                <span>{selectedOption?.label || placeholder}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}>
                    <KeyboardArrowDown style={{ color: palette.textSecondary }} />
                </motion.div>
            </motion.button>
            {dropdown}
            <style
                jsx
                global>{`
                .custom-select-dropdown::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }

                .custom-select-dropdown::-webkit-scrollbar-track {
                    background: transparent;
                }

                .custom-select-dropdown.cs-dark::-webkit-scrollbar-thumb {
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.18);
                }

                .custom-select-dropdown.cs-dark::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.28);
                }

                .custom-select-dropdown.cs-light::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.2);
                }

                .custom-select-dropdown.cs-light::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 0, 0, 0.3);
                }
            `}</style>
        </div>
    );
};
