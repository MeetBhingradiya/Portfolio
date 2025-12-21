"use client";

import React, { useState, useCallback } from "react";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Card,
    CardContent,
    Grid,
    IconButton,
    Stack,
    Alert,
    Tooltip,
    Chip,
    Divider,
} from "@mui/material";
import {
    ContentCopy as CopyIcon,
    TextFields as TextFieldsIcon,
    Clear as ClearIcon,
} from "@mui/icons-material";

interface CaseConversion {
    name: string;
    description: string;
    example: string;
    convert: (text: string) => string;
}

const CaseChangerPage: React.FC = () => {
    const [inputText, setInputText] = useState("");
    const [copySuccess, setCopySuccess] = useState<string | null>(null);

    // Case conversion functions
    const caseConversions: CaseConversion[] = [
        {
            name: "camelCase",
            description: "First word lowercase, subsequent words capitalized",
            example: "helloWorldExample",
            convert: (text: string) => {
                return text
                    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
                        return index === 0 ? word.toLowerCase() : word.toUpperCase();
                    })
                    .replace(/\s+/g, "")
                    .replace(/[^\w]/g, "");
            },
        },
        {
            name: "PascalCase",
            description: "All words capitalized, no spaces",
            example: "HelloWorldExample",
            convert: (text: string) => {
                return text
                    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
                        return word.toUpperCase();
                    })
                    .replace(/\s+/g, "")
                    .replace(/[^\w]/g, "");
            },
        },
        {
            name: "snake_case",
            description: "All lowercase with underscores",
            example: "hello_world_example",
            convert: (text: string) => {
                return text
                    .replace(/\W+/g, " ")
                    .split(/ |\B(?=[A-Z])/)
                    .map(word => word.toLowerCase())
                    .join("_")
                    .replace(/_+/g, "_")
                    .replace(/^_|_$/g, "");
            },
        },
        {
            name: "SCREAMING_SNAKE_CASE",
            description: "All uppercase with underscores",
            example: "HELLO_WORLD_EXAMPLE",
            convert: (text: string) => {
                return text
                    .replace(/\W+/g, " ")
                    .split(/ |\B(?=[A-Z])/)
                    .map(word => word.toUpperCase())
                    .join("_")
                    .replace(/_+/g, "_")
                    .replace(/^_|_$/g, "");
            },
        },
        {
            name: "kebab-case",
            description: "All lowercase with hyphens",
            example: "hello-world-example",
            convert: (text: string) => {
                return text
                    .replace(/\W+/g, " ")
                    .split(/ |\B(?=[A-Z])/)
                    .map(word => word.toLowerCase())
                    .join("-")
                    .replace(/-+/g, "-")
                    .replace(/^-|-$/g, "");
            },
        },
        {
            name: "SCREAMING-KEBAB-CASE",
            description: "All uppercase with hyphens",
            example: "HELLO-WORLD-EXAMPLE",
            convert: (text: string) => {
                return text
                    .replace(/\W+/g, " ")
                    .split(/ |\B(?=[A-Z])/)
                    .map(word => word.toUpperCase())
                    .join("-")
                    .replace(/-+/g, "-")
                    .replace(/^-|-$/g, "");
            },
        },
        {
            name: "Title Case",
            description: "First letter of each word capitalized",
            example: "Hello World Example",
            convert: (text: string) => {
                return text.replace(/\w\S*/g, (txt) => {
                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                });
            },
        },
        {
            name: "Sentence case",
            description: "First letter capitalized, rest lowercase",
            example: "Hello world example",
            convert: (text: string) => {
                return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
            },
        },
        {
            name: "lowercase",
            description: "All characters in lowercase",
            example: "hello world example",
            convert: (text: string) => text.toLowerCase(),
        },
        {
            name: "UPPERCASE",
            description: "All characters in uppercase",
            example: "HELLO WORLD EXAMPLE",
            convert: (text: string) => text.toUpperCase(),
        },
        {
            name: "iNvErSe CaSe",
            description: "Alternating upper and lower case",
            example: "hElLo WoRlD eXaMpLe",
            convert: (text: string) => {
                return text
                    .split("")
                    .map((char, index) => {
                        return index % 2 === 0 ? char.toLowerCase() : char.toUpperCase();
                    })
                    .join("");
            },
        },
        {
            name: "dot.case",
            description: "All lowercase with dots",
            example: "hello.world.example",
            convert: (text: string) => {
                return text
                    .replace(/\W+/g, " ")
                    .split(/ |\B(?=[A-Z])/)
                    .map(word => word.toLowerCase())
                    .join(".")
                    .replace(/\.+/g, ".")
                    .replace(/^\.|\.$/, "");
            },
        },
    ];

    // Copy to clipboard function
    const copyToClipboard = useCallback(async (text: string, caseName: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopySuccess(caseName);
            setTimeout(() => setCopySuccess(null), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    }, []);

    // Clear input
    const clearInput = () => {
        setInputText("");
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <TextFieldsIcon sx={{ fontSize: 32, color: "primary.main" }} />
                    <Typography variant="h4" component="h1">
                        Case Changer
                    </Typography>
                </Stack>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Convert text between different cases: camelCase, PascalCase, snake_case, kebab-case, and more.
                    Enter your text below and see it transformed into various naming conventions.
                </Typography>

                {/* Input Section */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Enter your text"
                        placeholder="Type or paste your text here..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        variant="outlined"
                    />
                    <Stack spacing={1}>
                        <Tooltip title="Clear text">
                            <IconButton
                                onClick={clearInput}
                                disabled={!inputText}
                                size="large"
                                sx={{
                                    backgroundColor: "action.hover",
                                    "&:hover": { backgroundColor: "action.selected" },
                                }}
                            >
                                <ClearIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>

                {/* Statistics */}
                {inputText && (
                    <Box sx={{ mb: 3 }}>
                        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                            <Chip
                                label={`${inputText.length} characters`}
                                size="small"
                                variant="outlined"
                            />
                            <Chip
                                label={`${inputText.trim().split(/\s+/).filter(word => word.length > 0).length} words`}
                                size="small"
                                variant="outlined"
                            />
                            <Chip
                                label={`${inputText.split("\n").length} lines`}
                                size="small"
                                variant="outlined"
                            />
                        </Stack>
                    </Box>
                )}
            </Paper>

            {/* Conversion Results */}
            {inputText && (
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h5" sx={{ mb: 3 }}>
                        Conversion Results
                    </Typography>
                    
                    <Grid container spacing={2}>
                        {caseConversions.map((conversion, index) => {
                            const convertedText = conversion.convert(inputText);
                            const isSuccess = copySuccess === conversion.name;
                            
                            return (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                    <Card
                                        sx={{
                                            height: "100%",
                                            transition: "all 0.2s",
                                            "&:hover": {
                                                boxShadow: 3,
                                                transform: "translateY(-2px)",
                                            },
                                        }}
                                    >
                                        <CardContent>
                                            <Stack spacing={2}>
                                                <Stack
                                                    direction="row"
                                                    justifyContent="space-between"
                                                    alignItems="center"
                                                >
                                                    <Typography
                                                        variant="h6"
                                                        color="primary"
                                                        sx={{ fontFamily: "monospace" }}
                                                    >
                                                        {conversion.name}
                                                    </Typography>
                                                    <Tooltip title={isSuccess ? "Copied!" : "Copy to clipboard"}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => copyToClipboard(convertedText, conversion.name)}
                                                            color={isSuccess ? "success" : "default"}
                                                        >
                                                            <CopyIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                                
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ minHeight: 40 }}
                                                >
                                                    {conversion.description}
                                                </Typography>
                                                
                                                <Divider />
                                                
                                                <Box>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{ display: "block", mb: 1 }}
                                                    >
                                                        Example: {conversion.example}
                                                    </Typography>
                                                    <Box
                                                        sx={{
                                                            p: 2,
                                                            backgroundColor: "grey.100",
                                                            borderRadius: 1,
                                                            border: "1px solid",
                                                            borderColor: "grey.300",
                                                            minHeight: 60,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            fontFamily: "monospace",
                                                            fontSize: "0.875rem",
                                                            wordBreak: "break-all",
                                                            overflowWrap: "break-word",
                                                        }}
                                                    >
                                                        {convertedText || (
                                                            <Typography
                                                                variant="body2"
                                                                color="text.disabled"
                                                                sx={{ fontStyle: "italic" }}
                                                            >
                                                                Result will appear here
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Paper>
            )}

            {/* No input message */}
            {!inputText && (
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Alert severity="info">
                        Enter some text above to see it converted into different cases. Perfect for converting between
                        naming conventions used in programming, such as camelCase for JavaScript or snake_case for Python.
                    </Alert>
                </Paper>
            )}

            {/* Success Toast */}
            {copySuccess && (
                <Alert
                    severity="success"
                    sx={{
                        position: "fixed",
                        bottom: 20,
                        right: 20,
                        zIndex: 1000,
                        minWidth: 200,
                    }}
                >
                    {copySuccess} copied to clipboard!
                </Alert>
            )}
        </Box>
    );
};

export default CaseChangerPage;
