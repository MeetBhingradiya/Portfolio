"use client";

import React, { useState, useCallback } from "react";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    IconButton,
    Grid,
    Card,
    CardContent,
    Chip,
    Stack,
    Alert,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Slider,
} from "@mui/material";
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    ContentCopy as CopyIcon,
    Palette as PaletteIcon,
    Download as DownloadIcon,
    Upload as UploadIcon,
    Shuffle as ShuffleIcon,
    ColorLens as ColorLensIcon,
} from "@mui/icons-material";

interface Color {
    id: string;
    hex: string;
    name?: string;
}

interface ColorPalette {
    id: string;
    name: string;
    colors: Color[];
    createdAt: Date;
}

const ColourPalettePage: React.FC = () => {
    const [palettes, setPalettes] = useState<ColorPalette[]>([]);
    const [currentPalette, setCurrentPalette] = useState<ColorPalette | null>(null);
    const [newColorHex, setNewColorHex] = useState("#ffffff");
    const [newColorName, setNewColorName] = useState("");
    const [paletteName, setPaletteName] = useState("");
    const [copySuccess, setCopySuccess] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [harmonicCount, setHarmonicCount] = useState(5);

    // Generate a random hex color
    const generateRandomColor = useCallback((): string => {
        return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
    }, []);

    // Generate harmonic colors based on color theory
    const generateHarmonicColors = useCallback((baseColor: string, count: number): Color[] => {
        const hex = baseColor.replace("#", "");
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);

        const colors: Color[] = [];
        
        for (let i = 0; i < count; i++) {
            const angle = (360 / count) * i;
            const hsl = rgbToHsl(r, g, b);
            const newHue = (hsl[0] + angle) % 360;
            const newRgb = hslToRgb(newHue, hsl[1], hsl[2]);
            const newHex = "#" + newRgb.map(x => x.toString(16).padStart(2, "0")).join("");
            
            colors.push({
                id: Date.now().toString() + i,
                hex: newHex,
                name: `Color ${i + 1}`,
            });
        }

        return colors;
    }, []);

    // Color utility functions
    const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [h * 360, s, l];
    };

    const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
        h /= 360;
        
        const hue2rgb = (p: number, q: number, t: number): number => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    };

    // Create a new palette
    const createNewPalette = () => {
        if (!paletteName.trim()) return;
        
        const newPalette: ColorPalette = {
            id: Date.now().toString(),
            name: paletteName,
            colors: [],
            createdAt: new Date(),
        };
        
        setPalettes(prev => [...prev, newPalette]);
        setCurrentPalette(newPalette);
        setPaletteName("");
    };

    // Add color to current palette
    const addColorToPalette = () => {
        if (!currentPalette || !newColorHex) return;
        
        const newColor: Color = {
            id: Date.now().toString(),
            hex: newColorHex,
            name: newColorName || `Color ${currentPalette.colors.length + 1}`,
        };
        
        const updatedPalette = {
            ...currentPalette,
            colors: [...currentPalette.colors, newColor],
        };
        
        setCurrentPalette(updatedPalette);
        setPalettes(prev => prev.map(p => p.id === updatedPalette.id ? updatedPalette : p));
        setNewColorName("");
        setNewColorHex(generateRandomColor());
    };

    // Remove color from palette
    const removeColor = (colorId: string) => {
        if (!currentPalette) return;
        
        const updatedPalette = {
            ...currentPalette,
            colors: currentPalette.colors.filter(c => c.id !== colorId),
        };
        
        setCurrentPalette(updatedPalette);
        setPalettes(prev => prev.map(p => p.id === updatedPalette.id ? updatedPalette : p));
    };

    // Copy color to clipboard
    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    // Export palette as JSON
    const exportPalette = () => {
        if (!currentPalette) return;
        
        const dataStr = JSON.stringify(currentPalette, null, 2);
        const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `${currentPalette.name.replace(/\s+/g, "_")}_palette.json`;
        
        const linkElement = document.createElement("a");
        linkElement.setAttribute("href", dataUri);
        linkElement.setAttribute("download", exportFileDefaultName);
        linkElement.click();
    };

    // Generate harmonic palette
    const generateHarmonicPalette = () => {
        if (!currentPalette) return;
        
        const baseColor = newColorHex;
        const harmonicColors = generateHarmonicColors(baseColor, harmonicCount);
        
        const updatedPalette = {
            ...currentPalette,
            colors: [...currentPalette.colors, ...harmonicColors],
        };
        
        setCurrentPalette(updatedPalette);
        setPalettes(prev => prev.map(p => p.id === updatedPalette.id ? updatedPalette : p));
        setDialogOpen(false);
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <PaletteIcon sx={{ fontSize: 32, color: "primary.main" }} />
                    <Typography variant="h4" component="h1">
                        Colour Palette Generator
                    </Typography>
                </Stack>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Create and manage custom color palettes with advanced color tools. Generate harmonious color schemes and export your palettes.
                </Typography>

                {/* Create New Palette */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <TextField
                        label="Palette Name"
                        value={paletteName}
                        onChange={(e) => setPaletteName(e.target.value)}
                        size="small"
                        sx={{ flexGrow: 1 }}
                    />
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={createNewPalette}
                        disabled={!paletteName.trim()}
                    >
                        Create Palette
                    </Button>
                </Stack>

                {/* Palette Selector */}
                {palettes.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Your Palettes
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {palettes.map((palette) => (
                                <Chip
                                    key={palette.id}
                                    label={palette.name}
                                    onClick={() => setCurrentPalette(palette)}
                                    variant={currentPalette?.id === palette.id ? "filled" : "outlined"}
                                    color="primary"
                                />
                            ))}
                        </Stack>
                    </Box>
                )}
            </Paper>

            {/* Current Palette Editor */}
            {currentPalette && (
                <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                        <Typography variant="h5">
                            {currentPalette.name}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <Button
                                variant="outlined"
                                startIcon={<ShuffleIcon />}
                                onClick={() => setDialogOpen(true)}
                                size="small"
                            >
                                Generate Harmonic
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={exportPalette}
                                size="small"
                            >
                                Export
                            </Button>
                        </Stack>
                    </Stack>

                    {/* Add New Color */}
                    <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <input
                                type="color"
                                value={newColorHex}
                                onChange={(e) => setNewColorHex(e.target.value)}
                                style={{ width: 50, height: 40, border: "none", borderRadius: 4 }}
                            />
                            <TextField
                                label="Hex Color"
                                value={newColorHex}
                                onChange={(e) => setNewColorHex(e.target.value)}
                                size="small"
                                sx={{ width: 120 }}
                            />
                        </Box>
                        <TextField
                            label="Color Name (optional)"
                            value={newColorName}
                            onChange={(e) => setNewColorName(e.target.value)}
                            size="small"
                            sx={{ flexGrow: 1 }}
                        />
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={addColorToPalette}
                        >
                            Add Color
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<ShuffleIcon />}
                            onClick={() => setNewColorHex(generateRandomColor())}
                        >
                            Random
                        </Button>
                    </Stack>

                    {/* Color Grid */}
                    {currentPalette.colors.length > 0 ? (
                        <Grid container spacing={2}>
                            {currentPalette.colors.map((color) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={color.id}>
                                    <Card>
                                        <Box
                                            sx={{
                                                height: 80,
                                                backgroundColor: color.hex,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <Stack direction="row" spacing={1}>
                                                <Tooltip title="Copy hex code">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => copyToClipboard(color.hex)}
                                                        sx={{
                                                            backgroundColor: "rgba(255,255,255,0.8)",
                                                            "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" },
                                                        }}
                                                    >
                                                        <CopyIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Remove color">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => removeColor(color.id)}
                                                        sx={{
                                                            backgroundColor: "rgba(255,255,255,0.8)",
                                                            "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" },
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Box>
                                        <CardContent sx={{ p: 2 }}>
                                            <Typography variant="body2" fontWeight="bold">
                                                {color.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {color.hex.toUpperCase()}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Alert severity="info">
                            No colors in this palette yet. Add some colors to get started!
                        </Alert>
                    )}
                </Paper>
            )}

            {/* Success Message */}
            {copySuccess && (
                <Alert severity="success" sx={{ position: "fixed", bottom: 20, right: 20, zIndex: 1000 }}>
                    Color copied to clipboard!
                </Alert>
            )}

            {/* Harmonic Color Generator Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Generate Harmonic Colors</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Typography gutterBottom>
                            Base Color: {newColorHex}
                        </Typography>
                        <Box
                            sx={{
                                width: "100%",
                                height: 60,
                                backgroundColor: newColorHex,
                                borderRadius: 1,
                                mb: 3,
                            }}
                        />
                        <Typography gutterBottom>
                            Number of colors to generate: {harmonicCount}
                        </Typography>
                        <Slider
                            value={harmonicCount}
                            onChange={(_, value) => setHarmonicCount(value as number)}
                            min={3}
                            max={12}
                            marks
                            valueLabelDisplay="auto"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={generateHarmonicPalette} variant="contained">
                        Generate
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ColourPalettePage;
