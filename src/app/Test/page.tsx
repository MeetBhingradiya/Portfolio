// Page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.sass';

const hextoHSL = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = (max + min) / 2;
    let s = (max + min) / 2;
    const l = (max + min) / 2;

    if (max === min) {
        h = s = 0; 
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
            default:
                break;
        }
        h /= 6;
    }

    return [h, s, l];
}

const hextoHSV = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, v = max;

    const d = max - min;

    s = max === 0 ? 0 : d / max;

    if (max !== min) {
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return [h, s, v]; // h in [0,1], s in [0,1], v in [0,1]
}


// Utility to convert color to different formats (HEX, RGB, HSL, etc.)
const convertColor = (color: string) => {
    const hex = color;
    const rgb = `rgb(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)})`;
    const hsl = `hsl(${hextoHSL(color)[0] * 360}, ${hextoHSL(color)[1] * 100}%, ${hextoHSL(color)[2] * 100}%)`;
    const hsv = `hsv(${hextoHSV(color)[0] * 360}, ${hextoHSV(color)[1] * 100}%, ${hextoHSV(color)[2] * 100}%)`;
    return { hex, rgb, hsl, hsv };
};

export default function ColorPalettePage() {
    const [color, setColor] = useState('#ffffff'); // Default color
    const [palettes, setPalettes] = useState<string[]>([]); // List of palettes
    const colorInputRefs = useRef<(HTMLInputElement | null)[]>([]); // Array of refs

    // Load palettes from localStorage when the component mounts
    useEffect(() => {
        const storedPalettes = localStorage.getItem('colorPalettes');
        if (storedPalettes) {
            setPalettes(JSON.parse(storedPalettes));
        }
    }, []);

    // Save palettes to localStorage whenever the palettes state changes
    useEffect(() => {
        localStorage.setItem('colorPalettes', JSON.stringify(palettes));
    }, [palettes]);

    const addPalette = () => {
        if (!palettes.includes(color)) {
            setPalettes([...palettes, color]);
        }
    };

    const removePalette = (index: number) => {
        const newPalettes = [...palettes];
        newPalettes.splice(index, 1);
        setPalettes(newPalettes);
    };

    const modifyPalette = (index: number, newColor: string) => {
        const newPalettes = [...palettes];
        newPalettes[index] = newColor;
        setPalettes(newPalettes);
    };

    const pickColorFromScreen = async () => {
        try {
            const eyeDropper = new (window as any).EyeDropper();
            const result = await eyeDropper.open();
            setColor(result.sRGBHex);
        } catch (error) {
            console.error('EyeDropper API is not supported in this browser');
        }
    };

    const openColorPicker = (index: number) => {
        colorInputRefs.current[index]?.click(); // Click the corresponding color input
    };

    return (
        <div className={styles.ColorPalette}>
            <h1>Color Palette Collection</h1>

            <div className={styles.picker}>
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                />
                <button onClick={addPalette}>Add Palette</button>
                <button onClick={pickColorFromScreen}>Pick Color from Screen</button>
            </div>

            <div className={styles.colorInfo}>
                <p>Selected Color: {color}</p>
                <p>HEX: {convertColor(color).hex}</p>
                <p>RGB: {convertColor(color).rgb}</p>
                <p>HSL: {convertColor(color).hsl}</p>
                <p>HSV: {convertColor(color).hsv}</p>
            </div>

            <div className={styles.palettes}>
                {palettes.map((palette, index) => (
                    <div key={index} className={styles.paletteItem}>
                        <div
                            className={styles.colorBlock}
                            style={{ backgroundColor: palette }}
                            onClick={() => openColorPicker(index)} 
                        ></div>
                        <input
                            ref={(el) => { colorInputRefs.current[index] = el }} 
                            type="color"
                            value={palette}
                            style={{ display: 'none' }}
                            onChange={(e) => modifyPalette(index, e.target.value)}
                        />
                        <button onClick={() => removePalette(index)}>Remove</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
