"use client";

import React, { useState, useEffect, useRef } from "react";
import "@Styles/Tools-ColourConvert.sass";
import { ContentCopy } from "@mui/icons-material";

// Type definitions
interface ColorObject {
    r: number;
    g: number;
    b: number;
    a: number;
    h: number;
    s: number;
    v: number;
}

interface ValidationResult {
    isValid: boolean;
    value: string;
}

// Utility functions for color conversions
function hexToRgba(hex: string): { r: number, g: number, b: number, a: number } | null {
    // Handle different hex formats: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
    hex = hex.replace(/^#/, '');
    
    let r, g, b, a = 1;
    
    if (hex.length === 3) {
        // #RGB format
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 4) {
        // #RGBA format
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
        a = parseInt(hex[3] + hex[3], 16) / 255;
    } else if (hex.length === 6) {
        // #RRGGBB format
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    } else if (hex.length === 8) {
        // #RRGGBBAA format
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
        a = parseInt(hex.substring(6, 8), 16) / 255;
    } else {
        return null; // Invalid hex color
    }
    
    return { r, g, b, a };
}

function rgbaToHex(r: number, g: number, b: number, a: number = 1): string {
    const toHex = (value: number) => {
        const hex = Math.round(value).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    
    const alphaHex = a < 1 ? toHex(Math.round(a * 255)) : '';
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`;
}

function rgbaToHsva(r: number, g: number, b: number, a: number = 1): { h: number, s: number, v: number, a: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    let h = 0;
    let s = max === 0 ? 0 : delta / max;
    let v = max;
    
    if (delta !== 0) {
        if (max === r) {
            h = ((g - b) / delta) % 6;
        } else if (max === g) {
            h = (b - r) / delta + 2;
        } else {
            h = (r - g) / delta + 4;
        }
        
        h *= 60;
        
        if (h < 0) {
            h += 360;
        }
    }
    
    return { h, s, v, a };
}

function hsvaToRgba(h: number, s: number, v: number, a: number = 1): { r: number, g: number, b: number, a: number } {
    h = h % 360;
    if (h < 0) h += 360;
    
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    
    let r = 0, g = 0, b = 0;
    
    if (h >= 0 && h < 60) {
        r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
        r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
        r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
        r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
        r = x; g = 0; b = c;
    } else {
        r = c; g = 0; b = x;
    }
    
    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255),
        a
    };
}

function rgbaToHsla(r: number, g: number, b: number, a: number = 1): { h: number, s: number, l: number, a: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    let h = 0;
    let l = (max + min) / 2;
    let s = 0;
    
    if (delta !== 0) {
        s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
        
        if (max === r) {
            h = ((g - b) / delta) % 6;
        } else if (max === g) {
            h = (b - r) / delta + 2;
        } else {
            h = (r - g) / delta + 4;
        }
        
        h *= 60;
        
        if (h < 0) {
            h += 360;
        }
    }
    
    return { h, s, l, a };
}

function hslaToRgba(h: number, s: number, l: number, a: number = 1): { r: number, g: number, b: number, a: number } {
    h = h % 360;
    if (h < 0) h += 360;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (h >= 0 && h < 60) {
        r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
        r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
        r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
        r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
        r = x; g = 0; b = c;
    } else {
        r = c; g = 0; b = x;
    }
    
    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255),
        a
    };
}

function rgbaToCmyk(r: number, g: number, b: number): { c: number, m: number, y: number, k: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const k = 1 - Math.max(r, g, b);
    
    if (k === 1) {
        return { c: 0, m: 0, y: 0, k: 1 };
    }
    
    const c = (1 - r - k) / (1 - k);
    const m = (1 - g - k) / (1 - k);
    const y = (1 - b - k) / (1 - k);
    
    return { c, m, y, k };
}

// Format validation functions
function validateHex(value: string): ValidationResult {
    // Validate hex pattern and normalize
    const regex = /^#?([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
    const isValid = regex.test(value);
    
    // Normalize by ensuring it has a # prefix
    let normalizedValue = value;
    if (isValid && !value.startsWith('#')) {
        normalizedValue = '#' + value;
    }
    
    return { isValid, value: normalizedValue };
}

function validateRgba(value: string): ValidationResult {
    // Validate rgba pattern: rgba(r, g, b, a) or rgb(r, g, b)
    const rgbaRegex = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\s*\)$/;
    const match = value.match(rgbaRegex);
    
    if (!match) {
        return { isValid: false, value };
    }
    
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    const a = match[4] ? parseFloat(match[4]) : 1;
    
    // Check if values are within valid ranges
    const isValid = r >= 0 && r <= 255 && 
                    g >= 0 && g <= 255 && 
                    b >= 0 && b <= 255 && 
                    a >= 0 && a <= 1;
    
    return { isValid, value };
}

function validateHsla(value: string): ValidationResult {
    // Validate hsla pattern: hsla(h, s%, l%, a) or hsl(h, s%, l%)
    const hslaRegex = /^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%(?:\s*,\s*([0-9.]+))?\s*\)$/;
    const match = value.match(hslaRegex);
    
    if (!match) {
        return { isValid: false, value };
    }
    
    const h = parseInt(match[1], 10);
    const s = parseInt(match[2], 10);
    const l = parseInt(match[3], 10);
    const a = match[4] ? parseFloat(match[4]) : 1;
    
    // Check if values are within valid ranges
    const isValid = h >= 0 && h <= 360 && 
                    s >= 0 && s <= 100 && 
                    l >= 0 && l <= 100 && 
                    a >= 0 && a <= 1;
    
    return { isValid, value };
}

function validateHsva(value: string): ValidationResult {
    // Validate hsva pattern: hsva(h, s%, v%, a) or hsv(h, s%, v%)
    const hsvaRegex = /^hsva?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%(?:\s*,\s*([0-9.]+))?\s*\)$/;
    const match = value.match(hsvaRegex);
    
    if (!match) {
        return { isValid: false, value };
    }
    
    const h = parseInt(match[1], 10);
    const s = parseInt(match[2], 10);
    const v = parseInt(match[3], 10);
    const a = match[4] ? parseFloat(match[4]) : 1;
    
    // Check if values are within valid ranges
    const isValid = h >= 0 && h <= 360 && 
                    s >= 0 && s <= 100 && 
                    v >= 0 && v <= 100 && 
                    a >= 0 && a <= 1;
    
    return { isValid, value };
}

// Format strings generation
function formatHex(color: ColorObject): string {
    return rgbaToHex(color.r, color.g, color.b, color.a);
}

function formatRgba(color: ColorObject): string {
    if (color.a < 1) {
        return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${color.a.toFixed(2)})`;
    } else {
        return `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;
    }
}

function formatHsla(color: ColorObject): string {
    const hsla = rgbaToHsla(color.r, color.g, color.b, color.a);
    if (color.a < 1) {
        return `hsla(${Math.round(hsla.h)}, ${Math.round(hsla.s * 100)}%, ${Math.round(hsla.l * 100)}%, ${hsla.a.toFixed(2)})`;
    } else {
        return `hsl(${Math.round(hsla.h)}, ${Math.round(hsla.s * 100)}%, ${Math.round(hsla.l * 100)}%)`;
    }
}

function formatHsva(color: ColorObject): string {
    if (color.a < 1) {
        return `hsva(${Math.round(color.h)}, ${Math.round(color.s * 100)}%, ${Math.round(color.v * 100)}%, ${color.a.toFixed(2)})`;
    } else {
        return `hsv(${Math.round(color.h)}, ${Math.round(color.s * 100)}%, ${Math.round(color.v * 100)}%)`;
    }
}

function formatCmyk(color: ColorObject): string {
    const cmyk = rgbaToCmyk(color.r, color.g, color.b);
    return `cmyk(${Math.round(cmyk.c * 100)}%, ${Math.round(cmyk.m * 100)}%, ${Math.round(cmyk.y * 100)}%, ${Math.round(cmyk.k * 100)}%)`;
}

function formatCss(color: ColorObject): string {
    // For CSS variables naming
    return formatHex(color).replace('#', '');
}

// Main component
export default function ColourConverter() {
    // Default color: purple with full opacity
    const [color, setColor] = useState<ColorObject>({
        r: 128, g: 0, b: 128, a: 1,  // RGB values
        h: 300, s: 1, v: 0.5         // HSV values
    });
    
    // Format states
    const [hexValue, setHexValue] = useState<string>(formatHex(color));
    const [rgbValue, setRgbValue] = useState<string>(formatRgba(color));
    const [hslValue, setHslValue] = useState<string>(formatHsla(color));
    const [hsvValue, setHsvValue] = useState<string>(formatHsva(color));
    const [cmykValue, setCmykValue] = useState<string>(formatCmyk(color));
    
    // Format validation states
    const [hexValid, setHexValid] = useState<boolean>(true);
    const [rgbValid, setRgbValid] = useState<boolean>(true);
    const [hslValid, setHslValid] = useState<boolean>(true);
    const [hsvValid, setHsvValid] = useState<boolean>(true);
    
    // Picker refs and states
    const saturationRef = useRef<HTMLDivElement>(null);
    const hueRef = useRef<HTMLDivElement>(null);
    const alphaRef = useRef<HTMLDivElement>(null);
    
    const [isDraggingSaturation, setIsDraggingSaturation] = useState<boolean>(false);
    const [isDraggingHue, setIsDraggingHue] = useState<boolean>(false);
    const [isDraggingAlpha, setIsDraggingAlpha] = useState<boolean>(false);
    
    // Saturation field background color (pure hue)
    const hueColor = hsvaToRgba(color.h, 1, 1);
    
    // Update all format string representations when color changes
    useEffect(() => {
        setHexValue(formatHex(color));
        setRgbValue(formatRgba(color));
        setHslValue(formatHsla(color));
        setHsvValue(formatHsva(color));
        setCmykValue(formatCmyk(color));
    }, [color]);
    
    // Update color from hex input
    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setHexValue(value);
        
        const validation = validateHex(value);
        setHexValid(validation.isValid);
        
        if (validation.isValid) {
            const rgba = hexToRgba(validation.value);
            if (rgba) {
                const hsva = rgbaToHsva(rgba.r, rgba.g, rgba.b, rgba.a);
                setColor({
                    ...rgba,
                    h: hsva.h,
                    s: hsva.s,
                    v: hsva.v,
                });
            }
        }
    };
    
    // Update color from rgb input
    const handleRgbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setRgbValue(value);
        
        const validation = validateRgba(value);
        setRgbValid(validation.isValid);
        
        if (validation.isValid) {
            const match = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\s*\)$/);
            if (match) {
                const r = parseInt(match[1], 10);
                const g = parseInt(match[2], 10);
                const b = parseInt(match[3], 10);
                const a = match[4] ? parseFloat(match[4]) : 1;
                
                const hsva = rgbaToHsva(r, g, b, a);
                setColor({
                    r, g, b, a,
                    h: hsva.h,
                    s: hsva.s,
                    v: hsva.v,
                });
            }
        }
    };
    
    // Update color from hsl input
    const handleHslChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setHslValue(value);
        
        const validation = validateHsla(value);
        setHslValid(validation.isValid);
        
        if (validation.isValid) {
            const match = value.match(/^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%(?:\s*,\s*([0-9.]+))?\s*\)$/);
            if (match) {
                const h = parseInt(match[1], 10);
                const s = parseInt(match[2], 10) / 100;
                const l = parseInt(match[3], 10) / 100;
                const a = match[4] ? parseFloat(match[4]) : 1;
                
                const rgba = hslaToRgba(h, s, l, a);
                const hsva = rgbaToHsva(rgba.r, rgba.g, rgba.b, rgba.a);
                
                setColor({
                    ...rgba,
                    h: hsva.h,
                    s: hsva.s,
                    v: hsva.v,
                });
            }
        }
    };
    
    // Update color from hsv input
    const handleHsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setHsvValue(value);
        
        const validation = validateHsva(value);
        setHsvValid(validation.isValid);
        
        if (validation.isValid) {
            const match = value.match(/^hsva?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%(?:\s*,\s*([0-9.]+))?\s*\)$/);
            if (match) {
                const h = parseInt(match[1], 10);
                const s = parseInt(match[2], 10) / 100;
                const v = parseInt(match[3], 10) / 100;
                const a = match[4] ? parseFloat(match[4]) : 1;
                
                const rgba = hsvaToRgba(h, s, v, a);
                
                setColor({
                    ...rgba,
                    h, s, v,
                });
            }
        }
    };
    
    // Saturation field handling
    const handleSaturationMouseDown = (e: React.MouseEvent) => {
        setIsDraggingSaturation(true);
        handleSaturationChange(e);
    };
    
    const handleSaturationChange = (e: React.MouseEvent | MouseEvent) => {
        if (!saturationRef.current) return;
        
        const rect = saturationRef.current.getBoundingClientRect();
        
        // Calculate normalized coordinates (0 to 1)
        let x = (e.clientX - rect.left) / rect.width;
        let y = (e.clientY - rect.top) / rect.height;
        
        // Clamp values
        x = Math.max(0, Math.min(1, x));
        y = Math.max(0, Math.min(1, y));
        
        // Update saturation and value (brightness)
        const newS = x;
        const newV = 1 - y;
        
        // Update color while maintaining current hue and alpha
        const rgba = hsvaToRgba(color.h, newS, newV, color.a);
        
        setColor({
            ...rgba,
            h: color.h,
            s: newS,
            v: newV,
        });
    };
    
    // Hue slider handling
    const handleHueMouseDown = (e: React.MouseEvent) => {
        setIsDraggingHue(true);
        handleHueChange(e);
    };
    
    const handleHueChange = (e: React.MouseEvent | MouseEvent) => {
        if (!hueRef.current) return;
        
        const rect = hueRef.current.getBoundingClientRect();
        
        // Calculate normalized x coordinate (0 to 1)
        let x = (e.clientX - rect.left) / rect.width;
        
        // Clamp value
        x = Math.max(0, Math.min(1, x));
        
        // Convert to hue angle (0 to 360)
        const newHue = x * 360;
        
        // Update color while maintaining current saturation, value and alpha
        const rgba = hsvaToRgba(newHue, color.s, color.v, color.a);
        
        setColor({
            ...rgba,
            h: newHue,
            s: color.s,
            v: color.v,
        });
    };
    
    // Alpha slider handling
    const handleAlphaMouseDown = (e: React.MouseEvent) => {
        setIsDraggingAlpha(true);
        handleAlphaChange(e);
    };
    
    const handleAlphaChange = (e: React.MouseEvent | MouseEvent) => {
        if (!alphaRef.current) return;
        
        const rect = alphaRef.current.getBoundingClientRect();
        
        // Calculate normalized x coordinate (0 to 1)
        let x = (e.clientX - rect.left) / rect.width;
        
        // Clamp value
        x = Math.max(0, Math.min(1, x));
        
        // Update color while maintaining current hue, saturation and value
        const rgba = hsvaToRgba(color.h, color.s, color.v, x);
        
        setColor({
            ...rgba,
            h: color.h,
            s: color.s,
            v: color.v,
        });
    };
    
    // Global mouse events for dragging
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingSaturation) {
                handleSaturationChange(e);
            } else if (isDraggingHue) {
                handleHueChange(e);
            } else if (isDraggingAlpha) {
                handleAlphaChange(e);
            }
        };
        
        const handleMouseUp = () => {
            setIsDraggingSaturation(false);
            setIsDraggingHue(false);
            setIsDraggingAlpha(false);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingSaturation, isDraggingHue, isDraggingAlpha]);
    
    // Copy to clipboard function
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };
    
    return (
        <div className="Page ColourConverter">
            <h1 className="title">Colour Converter & Picker</h1>
            <p className="description">Convert colours between different formats with real-time preview</p>
            
            <div className="converter-container">
                {/* Colour Picker Section */}
                <div className="picker-section glass">
                    <div className="picker-header">
                        <h2>Colour Picker</h2>
                    </div>
                    
                    <div className="picker-content">
                        {/* Colour Preview */}
                        <div className="color-preview">
                            <div className="transparent-bg"></div>
                            <div 
                                className="color-display" 
                                style={{ 
                                    backgroundColor: formatRgba(color) 
                                }}
                            ></div>
                        </div>
                        
                        {/* Color Picker Controls */}
                        <div className="color-picker">
                            {/* Saturation/Value Field */}
                            <div 
                                className="saturation-field" 
                                ref={saturationRef}
                                onMouseDown={handleSaturationMouseDown}
                                style={{ 
                                    background: `rgb(${hueColor.r}, ${hueColor.g}, ${hueColor.b})` 
                                }}
                            >
                                <div className="saturation-overlay"></div>
                                <div 
                                    className="saturation-thumb" 
                                    style={{ 
                                        left: `${color.s * 100}%`, 
                                        top: `${(1 - color.v) * 100}%` 
                                    }}
                                ></div>
                            </div>
                            
                            {/* Hue Slider */}
                            <div 
                                className="hue-slider" 
                                ref={hueRef}
                                onMouseDown={handleHueMouseDown}
                            >
                                <div 
                                    className="hue-thumb" 
                                    style={{ 
                                        left: `${(color.h / 360) * 100}%` 
                                    }}
                                ></div>
                            </div>
                            
                            {/* Alpha Slider */}
                            <div 
                                className="alpha-slider" 
                                ref={alphaRef}
                                onMouseDown={handleAlphaMouseDown}
                            >
                                <div className="transparent-bg"></div>
                                <div 
                                    className="alpha-gradient" 
                                    style={{ 
                                        background: `linear-gradient(to right, transparent, rgb(${color.r}, ${color.g}, ${color.b}))` 
                                    }}
                                ></div>
                                <div 
                                    className="alpha-thumb" 
                                    style={{ 
                                        left: `${color.a * 100}%` 
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Colour Formats Section */}
                <div className="formats-section glass">
                    <div className="formats-header">
                        <h2>Colour Formats</h2>
                    </div>
                    
                    <div className="formats-content">
                        {/* HEX Format */}
                        <div className="format-item">
                            <div className="format-label">
                                <span>HEX</span>
                                <span 
                                    className="copy-button" 
                                    onClick={() => copyToClipboard(hexValue)}
                                    title="Copy to clipboard"
                                >
                                    <ContentCopy fontSize="small" />
                                </span>
                            </div>
                            <input 
                                type="text" 
                                className={`format-input ${!hexValid ? 'invalid' : ''}`}
                                value={hexValue}
                                onChange={handleHexChange}
                            />
                        </div>
                        
                        {/* RGB Format */}
                        <div className="format-item">
                            <div className="format-label">
                                <span>RGB / RGBA</span>
                                <span 
                                    className="copy-button" 
                                    onClick={() => copyToClipboard(rgbValue)}
                                    title="Copy to clipboard"
                                >
                                    <ContentCopy fontSize="small" />
                                </span>
                            </div>
                            <input 
                                type="text" 
                                className={`format-input ${!rgbValid ? 'invalid' : ''}`}
                                value={rgbValue}
                                onChange={handleRgbChange}
                            />
                        </div>
                        
                        {/* HSL Format */}
                        <div className="format-item">
                            <div className="format-label">
                                <span>HSL / HSLA</span>
                                <span 
                                    className="copy-button" 
                                    onClick={() => copyToClipboard(hslValue)}
                                    title="Copy to clipboard"
                                >
                                    <ContentCopy fontSize="small" />
                                </span>
                            </div>
                            <input 
                                type="text" 
                                className={`format-input ${!hslValid ? 'invalid' : ''}`}
                                value={hslValue}
                                onChange={handleHslChange}
                            />
                        </div>
                        
                        {/* HSV Format */}
                        <div className="format-item">
                            <div className="format-label">
                                <span>HSV / HSVA</span>
                                <span 
                                    className="copy-button" 
                                    onClick={() => copyToClipboard(hsvValue)}
                                    title="Copy to clipboard"
                                >
                                    <ContentCopy fontSize="small" />
                                </span>
                            </div>
                            <input 
                                type="text" 
                                className={`format-input ${!hsvValid ? 'invalid' : ''}`}
                                value={hsvValue}
                                onChange={handleHsvChange}
                            />
                        </div>
                        
                        {/* CMYK Format (read-only) */}
                        <div className="format-item">
                            <div className="format-label">
                                <span>CMYK</span>
                                <span 
                                    className="copy-button" 
                                    onClick={() => copyToClipboard(cmykValue)}
                                    title="Copy to clipboard"
                                >
                                    <ContentCopy fontSize="small" />
                                </span>
                            </div>
                            <input 
                                type="text" 
                                className="format-input"
                                value={cmykValue}
                                readOnly
                            />
                        </div>
                        
                        {/* CSS Variable Name (read-only) */}
                        <div className="format-item">
                            <div className="format-label">
                                <span>CSS Variable</span>
                                <span 
                                    className="copy-button" 
                                    onClick={() => copyToClipboard(`--color: ${hexValue};`)}
                                    title="Copy to clipboard"
                                >
                                    <ContentCopy fontSize="small" />
                                </span>
                            </div>
                            <input 
                                type="text" 
                                className="format-input"
                                value={`--color: ${hexValue};`}
                                readOnly
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
