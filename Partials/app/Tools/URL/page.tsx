"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    IconButton,
    Stack,
    Alert,
    Tooltip,
    Chip,
    Card,
    CardContent,
    Grid,
    Divider,
    Switch,
    FormControlLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";
import {
    ContentCopy as CopyIcon,
    LinkOutlined as LinkIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Clear as ClearIcon,
    Launch as LaunchIcon,
    Code as CodeIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";

interface QueryParameter {
    id: string;
    key: string;
    value: string;
    enabled: boolean;
}

interface URLComponents {
    protocol: string;
    hostname: string;
    port: string;
    pathname: string;
    search: string;
    hash: string;
}

const URLBuilderPage: React.FC = () => {
    const [baseUrl, setBaseUrl] = useState("");
    const [queryParams, setQueryParams] = useState<QueryParameter[]>([]);
    const [newParamKey, setNewParamKey] = useState("");
    const [newParamValue, setNewParamValue] = useState("");
    const [builtUrl, setBuiltUrl] = useState("");
    const [parseUrl, setParseUrl] = useState("");
    const [parsedComponents, setParsedComponents] = useState<URLComponents | null>(null);
    const [parsedParams, setParsedParams] = useState<QueryParameter[]>([]);
    const [copySuccess, setCopySuccess] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [encodeParams, setEncodeParams] = useState(true);

    // Build URL from components
    const buildUrl = useCallback(() => {
        if (!baseUrl) {
            setBuiltUrl("");
            return;
        }

        try {
            const url = new URL(baseUrl);
            
            // Clear existing search params
            url.search = "";
            
            // Add enabled query parameters
            const enabledParams = queryParams.filter(param => param.enabled && param.key);
            enabledParams.forEach(param => {
                if (encodeParams) {
                    url.searchParams.set(param.key, param.value);
                } else {
                    // Manual building for non-encoded params
                    const paramString = enabledParams
                        .map(p => `${p.key}=${p.value}`)
                        .join("&");
                    url.search = paramString ? `?${paramString}` : "";
                    return;
                }
            });
            
            setBuiltUrl(url.toString());
        } catch (error) {
            console.error("Invalid URL:", error);
            setBuiltUrl("");
        }
    }, [baseUrl, queryParams, encodeParams]);

    // Parse URL into components
    const parseUrlFunction = useCallback(() => {
        if (!parseUrl) {
            setParsedComponents(null);
            setParsedParams([]);
            return;
        }

        try {
            const url = new URL(parseUrl);
            
            setParsedComponents({
                protocol: url.protocol,
                hostname: url.hostname,
                port: url.port,
                pathname: url.pathname,
                search: url.search,
                hash: url.hash,
            });

            const params: QueryParameter[] = [];
            url.searchParams.forEach((value, key) => {
                params.push({
                    id: Date.now().toString() + Math.random(),
                    key,
                    value,
                    enabled: true,
                });
            });
            setParsedParams(params);
        } catch (error) {
            console.error("Invalid URL:", error);
            setParsedComponents(null);
            setParsedParams([]);
        }
    }, [parseUrl]);

    // Add new query parameter
    const addQueryParam = () => {
        if (!newParamKey) return;
        
        const newParam: QueryParameter = {
            id: Date.now().toString() + Math.random(),
            key: newParamKey,
            value: newParamValue,
            enabled: true,
        };
        
        setQueryParams(prev => [...prev, newParam]);
        setNewParamKey("");
        setNewParamValue("");
    };

    // Remove query parameter
    const removeQueryParam = (id: string) => {
        setQueryParams(prev => prev.filter(param => param.id !== id));
    };

    // Update query parameter
    const updateQueryParam = (id: string, field: keyof QueryParameter, value: string | boolean) => {
        setQueryParams(prev =>
            prev.map(param =>
                param.id === id ? { ...param, [field]: value } : param
            )
        );
    };

    // Copy to clipboard
    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    // Open URL in new tab
    const openUrl = (url: string) => {
        if (url) {
            window.open(url, "_blank");
        }
    };

    // Load parsed params into builder
    const loadParsedParams = () => {
        setQueryParams(parsedParams);
        if (parsedComponents) {
            const baseUrlWithoutSearch = parseUrl.split("?")[0].split("#")[0];
            setBaseUrl(baseUrlWithoutSearch);
        }
    };

    // Clear all data
    const clearAll = () => {
        setBaseUrl("");
        setQueryParams([]);
        setNewParamKey("");
        setNewParamValue("");
        setBuiltUrl("");
    };

    // Auto-build URL when dependencies change
    useEffect(() => {
        buildUrl();
    }, [buildUrl]);

    // Auto-parse URL when parseUrl changes
    useEffect(() => {
        parseUrlFunction();
    }, [parseUrlFunction]);

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <LinkIcon sx={{ fontSize: 32, color: "primary.main" }} />
                    <Typography variant="h4" component="h1">
                        URL Builder
                    </Typography>
                </Stack>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Build and parse URLs with query parameters. Create clean URLs, add query parameters, 
                    and decode URL components easily. Perfect for web development and API testing.
                </Typography>

                {/* Settings */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={encodeParams}
                                onChange={(e) => setEncodeParams(e.target.checked)}
                            />
                        }
                        label="Encode parameters"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showAdvanced}
                                onChange={(e) => setShowAdvanced(e.target.checked)}
                            />
                        }
                        label="Show advanced options"
                    />
                </Stack>
            </Paper>

            <Grid container spacing={3}>
                {/* URL Builder Section */}
                <Grid size={{ xs: 12, lg: 6 }}>
                    <Paper elevation={3} sx={{ p: 3, height: "fit-content" }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                            <Typography variant="h5">URL Builder</Typography>
                            <Button
                                variant="outlined"
                                startIcon={<ClearIcon />}
                                onClick={clearAll}
                                size="small"
                            >
                                Clear All
                            </Button>
                        </Stack>

                        {/* Base URL */}
                        <TextField
                            fullWidth
                            label="Base URL"
                            placeholder="https://example.com/api/endpoint"
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        {/* Add Query Parameter */}
                        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                            <TextField
                                label="Parameter Key"
                                placeholder="key"
                                value={newParamKey}
                                onChange={(e) => setNewParamKey(e.target.value)}
                                size="small"
                                sx={{ flex: 1 }}
                            />
                            <TextField
                                label="Parameter Value"
                                placeholder="value"
                                value={newParamValue}
                                onChange={(e) => setNewParamValue(e.target.value)}
                                size="small"
                                sx={{ flex: 1 }}
                            />
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={addQueryParam}
                                disabled={!newParamKey}
                            >
                                Add
                            </Button>
                        </Stack>

                        {/* Query Parameters List */}
                        {queryParams.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    Query Parameters
                                </Typography>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Enabled</TableCell>
                                                <TableCell>Key</TableCell>
                                                <TableCell>Value</TableCell>
                                                <TableCell width={48}></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {queryParams.map((param) => (
                                                <TableRow key={param.id}>
                                                    <TableCell>
                                                        <Switch
                                                            checked={param.enabled}
                                                            onChange={(e) =>
                                                                updateQueryParam(param.id, "enabled", e.target.checked)
                                                            }
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            value={param.key}
                                                            onChange={(e) =>
                                                                updateQueryParam(param.id, "key", e.target.value)
                                                            }
                                                            size="small"
                                                            fullWidth
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            value={param.value}
                                                            onChange={(e) =>
                                                                updateQueryParam(param.id, "value", e.target.value)
                                                            }
                                                            size="small"
                                                            fullWidth
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => removeQueryParam(param.id)}
                                                            color="error"
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}

                        {/* Built URL Result */}
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Built URL
                            </Typography>
                            <Box
                                sx={{
                                    p: 2,
                                    backgroundColor: "grey.100",
                                    borderRadius: 1,
                                    border: "1px solid",
                                    borderColor: "grey.300",
                                    minHeight: 60,
                                    fontFamily: "monospace",
                                    fontSize: "0.875rem",
                                    wordBreak: "break-all",
                                    position: "relative",
                                }}
                            >
                                {builtUrl || (
                                    <Typography
                                        variant="body2"
                                        color="text.disabled"
                                        sx={{ fontStyle: "italic" }}
                                    >
                                        Enter a base URL to see the built URL here
                                    </Typography>
                                )}
                                {builtUrl && (
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        sx={{ position: "absolute", top: 8, right: 8 }}
                                    >
                                        <Tooltip title="Copy URL">
                                            <IconButton
                                                size="small"
                                                onClick={() => copyToClipboard(builtUrl)}
                                            >
                                                <CopyIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Open URL">
                                            <IconButton
                                                size="small"
                                                onClick={() => openUrl(builtUrl)}
                                            >
                                                <LaunchIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                )}
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* URL Parser Section */}
                <Grid size={{ xs: 12, lg: 6 }}>
                    <Paper elevation={3} sx={{ p: 3, height: "fit-content" }}>
                        <Typography variant="h5" sx={{ mb: 3 }}>
                            URL Parser
                        </Typography>

                        {/* URL to Parse */}
                        <TextField
                            fullWidth
                            label="URL to Parse"
                            placeholder="https://example.com/api/endpoint?param1=value1&param2=value2"
                            value={parseUrl}
                            onChange={(e) => setParseUrl(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        {/* Parsed Components */}
                        {parsedComponents && (
                            <Box sx={{ mb: 3 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                    <Typography variant="h6">URL Components</Typography>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={loadParsedParams}
                                        startIcon={<LaunchIcon />}
                                    >
                                        Load into Builder
                                    </Button>
                                </Stack>
                                <Grid container spacing={2}>
                                    {Object.entries(parsedComponents).map(([key, value]) => (
                                        <Grid size={{ xs: 12, sm: 6 }} key={key}>
                                            <Card variant="outlined">
                                                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {key.toUpperCase()}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontFamily: "monospace",
                                                            wordBreak: "break-all",
                                                            mt: 0.5,
                                                        }}
                                                    >
                                                        {value || (
                                                            <span style={{ fontStyle: "italic", opacity: 0.5 }}>
                                                                (empty)
                                                            </span>
                                                        )}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}

                        {/* Parsed Query Parameters */}
                        {parsedParams.length > 0 && (
                            <Box>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    Query Parameters
                                </Typography>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Key</TableCell>
                                                <TableCell>Value</TableCell>
                                                <TableCell width={48}></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {parsedParams.map((param) => (
                                                <TableRow key={param.id}>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                                                            {param.key}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                fontFamily: "monospace",
                                                                wordBreak: "break-all",
                                                            }}
                                                        >
                                                            {param.value}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Tooltip title="Copy value">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => copyToClipboard(param.value)}
                                                            >
                                                                <CopyIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}

                        {/* No URL Message */}
                        {!parseUrl && (
                            <Alert severity="info">
                                Enter a URL above to parse its components and query parameters.
                            </Alert>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Success Toast */}
            {copySuccess && (
                <Alert
                    severity="success"
                    sx={{
                        position: "fixed",
                        bottom: 20,
                        right: 20,
                        zIndex: 1000,
                    }}
                >
                    Copied to clipboard!
                </Alert>
            )}
        </Box>
    );
};

export default URLBuilderPage;
