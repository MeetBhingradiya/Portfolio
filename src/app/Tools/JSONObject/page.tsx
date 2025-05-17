"use client";

import React from "react";
import "@Styles/Tools-JSONObject.sass";
import {
    Clear,
    ContentCopy,
    FormatAlignLeft
} from "@mui/icons-material";
import { Button } from "@heroui/react";
import MonacoEditor from "@monaco-editor/react";
import { useTheme } from "@Hooks/useTheme";

interface IState {
    json: string;
    object: string;
    error: {
        isERROR: boolean;
        message: string;
        source: 'json' | 'object' | '';
    };
    copied: {
        json: boolean;
        object: boolean;
    };
}

export default function JSONObject() {
    const { effectiveMode } = useTheme();
    const [state, setState] = React.useState<IState>({
        json: "",
        object: "",
        error: {
            isERROR: false,
            message: "",
            source: '',
        },
        copied: {
            json: false,
            object: false,
        }
    });

    const handleJSONChange = (value: string = "") => {
        if (!value.trim()) {
            setState({
                ...state,
                json: value,
                object: "",
                error: { isERROR: false, message: "", source: '' },
            });
            return;
        }

        try {
            const parsed = JSON.parse(value);
            setState({
                ...state,
                json: value,
                object: JSON.stringify(parsed, null, 2),
                error: { isERROR: false, message: "", source: '' },
            });
        } catch (error: any) {
            setState({
                ...state,
                json: value,
                error: {
                    isERROR: true,
                    message: `Invalid JSON: ${error.message}`,
                    source: 'json'
                },
            });
        }
    };

    const handleObjectChange = (value: string = "") => {
        if (!value.trim()) {
            setState({
                ...state,
                object: value,
                json: "",
                error: { isERROR: false, message: "", source: '' },
            });
            return;
        }

        try {
            let objectString = value;

            try {
                const parsed = JSON.parse(objectString);
                setState({
                    ...state,
                    object: value,
                    json: JSON.stringify(parsed),
                    error: { isERROR: false, message: "", source: '' },
                });
                return;
            } catch (e) {
                // Not valid JSON, try to convert
            }

            objectString = objectString
                .replace(/(\w+):/g, '"$1":')
                .replace(/'/g, '"');

            const parsed = JSON.parse(objectString);

            setState({
                ...state,
                object: value,
                json: JSON.stringify(parsed),
                error: { isERROR: false, message: "", source: '' },
            });
        } catch (error: any) {
            setState({
                ...state,
                object: value,
                error: {
                    isERROR: true,
                    message: `Invalid Object: ${error.message}`,
                    source: 'object'
                },
            });
        }
    };

    // Function to copy text to clipboard
    const copyToClipboard = (text: string, type: 'json' | 'object') => {
        navigator.clipboard.writeText(text).then(() => {
            setState({
                ...state,
                copied: {
                    ...state.copied,
                    [type]: true
                }
            });

            // Reset copied state after 2 seconds
            setTimeout(() => {
                setState(prevState => ({
                    ...prevState,
                    copied: {
                        ...prevState.copied,
                        [type]: false
                    }
                }));
            }, 2000);
        });
    };

    // Function to format the JSON/Object
    const formatCode = (type: 'json' | 'object') => {
        try {
            if (type === 'json' && state.json) {
                const formatted = JSON.stringify(JSON.parse(state.json), null, 2);
                setState({
                    ...state,
                    json: formatted,
                    error: { isERROR: false, message: "", source: '' },
                });
            } else if (type === 'object' && state.object) {
                let objectString = state.object;

                try {
                    JSON.parse(objectString);
                } catch (e) {
                    // Not valid JSON, try to convert
                    objectString = objectString
                        .replace(/(\w+):/g, '"$1":')
                        .replace(/'/g, '"');
                }

                const formatted = JSON.stringify(JSON.parse(objectString), null, 2);
                setState({
                    ...state,
                    object: formatted,
                    error: { isERROR: false, message: "", source: '' },
                });
            }
        } catch (error: any) {
            setState({
                ...state,
                error: {
                    isERROR: true,
                    message: `Cannot format invalid ${type}: ${error.message}`,
                    source: type
                },
            });
        }
    };

    const clearInput = (type: 'json' | 'object') => {
        if (type === 'json') {
            setState({
                ...state,
                json: "",
                object: "",
                error: { isERROR: false, message: "", source: '' },
            });
        } else {
            setState({
                ...state,
                object: "",
                json: "",
                error: { isERROR: false, message: "", source: '' },
            });
        }
    };

    return (
        <div className="Page JSONObject">
            <h1 className="title">JSON ⇄ Object Converter</h1>
            <p className="description">Convert between JSON and JavaScript Object notation in real-time</p>

            <div className="converter-container">
                <div className="converter-box glass">
                    <div className="converter-header">
                        <h2>JSON</h2>
                        <div className="converter-actions">
                            <Button
                                onPress={() => formatCode('json')}
                                disabled={!state.json || (state.error.isERROR && state.error.source === 'json')}
                                title="Format JSON"
                                variant="ghost"
                                isIconOnly
                            >
                                <FormatAlignLeft />
                            </Button>
                            <Button
                                onPress={() => copyToClipboard(state.json, 'json')}
                                disabled={!state.json}
                                title="Copy to clipboard"
                                variant="ghost"
                                isIconOnly
                            >
                                <ContentCopy />
                            </Button>
                            <Button
                                onPress={() => clearInput('json')}
                                disabled={!state.json}
                                title="Clear input"
                                variant="ghost"
                                isIconOnly
                            >
                                <Clear />
                            </Button>
                        </div>
                    </div>
                    <div className="editor-container">
                        <MonacoEditor
                            height="100%"
                            language="json"
                        value={state.json}
                            onChange={handleJSONChange}
                            theme={effectiveMode === "dark" ? "vs-dark" : "vs-light"}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: "on",
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                wordWrap: "on"
                            }}
                        />
                    </div>
                    {state.error.isERROR && state.error.source === 'json' && (
                        <div className="error-message">{state.error.message}</div>
                    )}
                </div>

                <div className="converter-box glass">
                    <div className="converter-header">
                        <h2>Object</h2>
                        <div className="converter-actions">
                            <Button
                                onPress={() => formatCode('object')}
                                disabled={!state.object || (state.error.isERROR && state.error.source === 'object')}
                                title="Format Object"
                                variant="ghost"
                                isIconOnly
                            >
                                <FormatAlignLeft />
                            </Button>
                            <Button
                                onPress={() => copyToClipboard(state.object, 'object')}
                                disabled={!state.object}
                                title="Copy to clipboard"
                                variant="ghost"
                                isIconOnly
                            >
                                <ContentCopy />
                            </Button>
                            <Button
                                onPress={() => clearInput('object')}
                                disabled={!state.object}
                                title="Clear input"
                                variant="ghost"
                                isIconOnly
                            >
                                <Clear />
                            </Button>
                        </div>
                    </div>
                    <div className="editor-container">
                        <MonacoEditor
                            height="100%"
                            defaultLanguage="javascript"
                            defaultValue={state.object}
                        value={state.object}
                            onChange={handleObjectChange}
                            theme={effectiveMode === "dark" ? "vs-dark" : "vs-light"}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: "on",
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                wordWrap: "on"
                            }}
                        />
                    </div>
                    {state.error.isERROR && state.error.source === 'object' && (
                        <div className="error-message">{state.error.message}</div>
                    )}
                </div>
            </div>
        </div>
    );
}