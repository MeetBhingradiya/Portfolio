"use client";

import React from "react";
import { 
    Clear, 
    ContentCopy, 
    FormatAlignLeft, 
    Check,
    DataObject,
    Code,
    SwapHoriz,
    History,
    Download,
    Upload,
    Compress,
    UnfoldMore
} from "@mui/icons-material";
import { 
    Button, 
    Card, 
    CardBody, 
    Tabs, 
    Tab, 
    Chip, 
    Tooltip,
    Divider,
    Textarea
} from "@heroui/react";
import MonacoEditor from "@monaco-editor/react";
import { useTheme } from "@Hooks/useTheme";

interface ConversionHistory {
    id: string;
    input: string;
    output: string;
    type: "json-to-object" | "object-to-json";
    timestamp: Date;
}

interface IState {
    json: string;
    object: string;
    error: {
        isERROR: boolean;
        message: string;
        source: "json" | "object" | "";
    };
    copied: {
        json: boolean;
        object: boolean;
    };
    history: ConversionHistory[];
    activeTab: "json" | "object" | "bulk";
}

export default function JSONObject() {
    const { effectiveMode } = useTheme();
    const [state, setState] = React.useState<IState>({
        json: `{
  "name": "John Doe",
  "age": 30,
  "city": "New York",
  "hobbies": ["reading", "coding", "traveling"],
  "address": {
    "street": "123 Main St",
    "zipCode": "10001"
  },
  "isActive": true
}`,
        object: "",
        error: {
            isERROR: false,
            message: "",
            source: ""
        },
        copied: {
            json: false,
            object: false
        },
        history: [],
        activeTab: "json"
    });

    const handleJSONChange = (value: string = "") => {
        if (!value.trim()) {
            setState({
                ...state,
                json: value,
                object: "",
                error: { isERROR: false, message: "", source: "" }
            });
            return;
        }

        try {
            const parsed = JSON.parse(value);
            setState({
                ...state,
                json: value,
                object: JSON.stringify(parsed, null, 2),
                error: { isERROR: false, message: "", source: "" }
            });
        } catch (error: any) {
            setState({
                ...state,
                json: value,
                error: {
                    isERROR: true,
                    message: `Invalid JSON: ${error.message}`,
                    source: "json"
                }
            });
        }
    };

    const handleObjectChange = (value: string = "") => {
        if (!value.trim()) {
            setState({
                ...state,
                object: value,
                json: "",
                error: { isERROR: false, message: "", source: "" }
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
                    error: { isERROR: false, message: "", source: "" }
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
                error: { isERROR: false, message: "", source: "" }
            });
        } catch (error: any) {
            setState({
                ...state,
                object: value,
                error: {
                    isERROR: true,
                    message: `Invalid Object: ${error.message}`,
                    source: "object"
                }
            });
        }
    };

    // Function to copy text to clipboard
    const copyToClipboard = (text: string, type: "json" | "object") => {
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
                setState((prevState) => ({
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
    const formatCode = (type: "json" | "object") => {
        try {
            if (type === "json" && state.json) {
                const formatted = JSON.stringify(
                    JSON.parse(state.json),
                    null,
                    2
                );
                setState({
                    ...state,
                    json: formatted,
                    error: { isERROR: false, message: "", source: "" }
                });
            } else if (type === "object" && state.object) {
                let objectString = state.object;

                try {
                    JSON.parse(objectString);
                } catch (e) {
                    // Not valid JSON, try to convert
                    objectString = objectString
                        .replace(/(\w+):/g, '"$1":')
                        .replace(/'/g, '"');
                }

                const formatted = JSON.stringify(
                    JSON.parse(objectString),
                    null,
                    2
                );
                setState({
                    ...state,
                    object: formatted,
                    error: { isERROR: false, message: "", source: "" }
                });
            }
        } catch (error: any) {
            setState({
                ...state,
                error: {
                    isERROR: true,
                    message: `Cannot format invalid ${type}: ${error.message}`,
                    source: type
                }
            });
        }
    };

    const clearInput = (type: "json" | "object") => {
        if (type === "json") {
            setState(prev => ({
                ...prev,
                json: "",
                object: "",
                error: { isERROR: false, message: "", source: "" }
            }));
        } else {
            setState(prev => ({
                ...prev,
                object: "",
                json: "",
                error: { isERROR: false, message: "", source: "" }
            }));
        }
    };

    const addToHistory = () => {
        if (state.json && state.object) {
            const newEntry: ConversionHistory = {
                id: Date.now().toString(),
                input: state.json,
                output: state.object,
                type: "json-to-object",
                timestamp: new Date()
            };
            setState(prev => ({
                ...prev,
                history: [newEntry, ...prev.history.slice(0, 19)]
            }));
        }
    };

    const exportHistory = () => {
        const data = {
            exported: new Date().toISOString(),
            conversions: state.history
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `json-conversions-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const minifyJSON = () => {
        if (state.json) {
            try {
                const parsed = JSON.parse(state.json);
                const minified = JSON.stringify(parsed);
                setState(prev => ({ ...prev, json: minified }));
            } catch (error: any) {
                setState(prev => ({
                    ...prev,
                    error: {
                        isERROR: true,
                        message: `Cannot minify invalid JSON: ${error.message}`,
                        source: "json"
                    }
                }));
            }
        }
    };

    const swapContent = () => {
        setState(prev => ({
            ...prev,
            json: prev.object,
            object: prev.json,
            error: { isERROR: false, message: "", source: "" }
        }));
    };

    // Initialize with sample conversion
    React.useEffect(() => {
        if (state.json && !state.object) {
            handleJSONChange(state.json);
        }
    }, []);

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-6 pt-45 min-h-max pb-16">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="text-4xl font-bold mb-2 text-white">
                    🔄 JSON ⇄ Object Converter
                </div>
                <div className="text-base text-gray-400 mb-6 max-w-2xl">
                    Convert between JSON and JavaScript Object notation with real-time validation and formatting
                </div>
            </div>

            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Converter */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Quick Actions */}
                    <Card className="bg-black/10 backdrop-blur-lg border border-white/20">
                        <CardBody className="p-4">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <Chip 
                                        size="sm" 
                                        variant="flat" 
                                        color={state.error.isERROR ? "danger" : "success"}
                                        startContent={state.error.isERROR ? "❌" : "✅"}
                                    >
                                        {state.error.isERROR ? "Invalid" : "Valid"}
                                    </Chip>
                                    
                                    {state.json && (
                                        <div className="text-sm text-gray-400">
                                            {state.json.length} characters
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <Tooltip content="Swap JSON ⇄ Object">
                                        <Button
                                            isIconOnly
                                            variant="bordered"
                                            size="sm"
                                            onPress={swapContent}
                                            isDisabled={!state.json && !state.object}
                                        >
                                            <SwapHoriz />
                                        </Button>
                                    </Tooltip>
                                    
                                    <Tooltip content="Minify JSON">
                                        <Button
                                            isIconOnly
                                            variant="bordered"
                                            size="sm"
                                            onPress={minifyJSON}
                                            isDisabled={!state.json}
                                        >
                                            <Compress />
                                        </Button>
                                    </Tooltip>
                                    
                                    <Tooltip content="Add to History">
                                        <Button
                                            isIconOnly
                                            variant="bordered"
                                            size="sm"
                                            onPress={addToHistory}
                                            isDisabled={!state.json || !state.object}
                                        >
                                            <History />
                                        </Button>
                                    </Tooltip>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Error Display */}
                    {state.error.isERROR && (
                        <Card className="bg-red-500/10 border border-red-500/20">
                            <CardBody className="p-4">
                                <div className="flex items-start gap-3 text-red-400">
                                    <span className="text-xl">⚠️</span>
                                    <div>
                                        <div className="font-medium text-sm">Conversion Error</div>
                                        <div className="text-xs mt-1">{state.error.message}</div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    )}

                    {/* Converter Tabs */}
                    <Card className="bg-black/10 backdrop-blur-lg border border-white/20">
                        <CardBody className="p-6">
                            <Tabs 
                                selectedKey={state.activeTab}
                                onSelectionChange={(key) => setState(prev => ({ ...prev, activeTab: key as any }))}
                                variant="underlined"
                                classNames={{
                                    tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                                    cursor: "w-full bg-blue-500",
                                    tab: "max-w-fit px-0 h-12",
                                    tabContent: "group-data-[selected=true]:text-blue-400"
                                }}
                            >
                                <Tab 
                                    key="json" 
                                    title={
                                        <div className="flex items-center gap-2">
                                            <DataObject />
                                            <span>JSON</span>
                                        </div>
                                    }
                                >
                                    <div className="mt-6 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-medium text-gray-300">JSON Input</h4>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="bordered"
                                                    startContent={<FormatAlignLeft />}
                                                    onPress={() => formatCode("json")}
                                                    isDisabled={!state.json || (state.error.isERROR && state.error.source === "json")}
                                                >
                                                    Format
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="bordered"
                                                    startContent={state.copied.json ? <Check /> : <ContentCopy />}
                                                    onPress={() => copyToClipboard(state.json, "json")}
                                                    isDisabled={!state.json}
                                                    color={state.copied.json ? "success" : "default"}
                                                >
                                                    {state.copied.json ? "Copied!" : "Copy"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="bordered"
                                                    startContent={<Clear />}
                                                    onPress={() => clearInput("json")}
                                                    isDisabled={!state.json}
                                                >
                                                    Clear
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-gray-900 rounded-lg border border-white/10 h-96">
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
                                                    wordWrap: "on",
                                                    roundedSelection: false,
                                                    padding: { top: 16 },
                                                    scrollbar: {
                                                        verticalScrollbarSize: 8,
                                                        horizontalScrollbarSize: 8
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </Tab>

                                <Tab 
                                    key="object" 
                                    title={
                                        <div className="flex items-center gap-2">
                                            <Code />
                                            <span>Object</span>
                                        </div>
                                    }
                                >
                                    <div className="mt-6 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-medium text-gray-300">JavaScript Object</h4>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="bordered"
                                                    startContent={<FormatAlignLeft />}
                                                    onPress={() => formatCode("object")}
                                                    isDisabled={!state.object || (state.error.isERROR && state.error.source === "object")}
                                                >
                                                    Format
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="bordered"
                                                    startContent={state.copied.object ? <Check /> : <ContentCopy />}
                                                    onPress={() => copyToClipboard(state.object, "object")}
                                                    isDisabled={!state.object}
                                                    color={state.copied.object ? "success" : "default"}
                                                >
                                                    {state.copied.object ? "Copied!" : "Copy"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="bordered"
                                                    startContent={<Clear />}
                                                    onPress={() => clearInput("object")}
                                                    isDisabled={!state.object}
                                                >
                                                    Clear
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-gray-900 rounded-lg border border-white/10 h-96">
                                            <MonacoEditor
                                                height="100%"
                                                language="javascript"
                                                value={state.object}
                                                onChange={handleObjectChange}
                                                theme={effectiveMode === "dark" ? "vs-dark" : "vs-light"}
                                                options={{
                                                    minimap: { enabled: false },
                                                    fontSize: 14,
                                                    lineNumbers: "on",
                                                    scrollBeyondLastLine: false,
                                                    automaticLayout: true,
                                                    wordWrap: "on",
                                                    roundedSelection: false,
                                                    padding: { top: 16 },
                                                    scrollbar: {
                                                        verticalScrollbarSize: 8,
                                                        horizontalScrollbarSize: 8
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </Tab>

                                <Tab 
                                    key="bulk" 
                                    title={
                                        <div className="flex items-center gap-2">
                                            <UnfoldMore />
                                            <span>Bulk</span>
                                        </div>
                                    }
                                >
                                    <div className="mt-6 space-y-4">
                                        <div className="text-center py-8 text-gray-400">
                                            <Code className="mx-auto text-4xl mb-4 opacity-50" />
                                            <h4 className="text-lg font-medium mb-2">Bulk Conversion</h4>
                                            <p className="text-sm">Convert multiple JSON objects at once</p>
                                            <Button
                                                className="mt-4"
                                                color="primary"
                                                variant="shadow"
                                                startContent={<Upload />}
                                            >
                                                Upload JSON Files
                                            </Button>
                                        </div>
                                    </div>
                                </Tab>
                            </Tabs>
                        </CardBody>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Conversion History */}
                    <Card className="bg-black/10 backdrop-blur-lg border border-white/20">
                        <CardBody className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <History className="text-blue-400" />
                                    History
                                </h3>
                                <Chip size="sm" variant="flat">
                                    {state.history.length}
                                </Chip>
                            </div>
                            
                            <div className="space-y-2 max-h-80 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                                {state.history.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <DataObject className="mx-auto text-4xl mb-2 opacity-50" />
                                        <p className="text-sm">No conversions yet</p>
                                    </div>
                                ) : (
                                    state.history.map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all duration-200 group cursor-pointer"
                                            onClick={() => {
                                                setState(prev => ({
                                                    ...prev,
                                                    json: item.input,
                                                    object: item.output
                                                }));
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-mono text-xs text-white truncate">
                                                        {item.input.substring(0, 30)}...
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Chip size="sm" variant="flat" color="primary">
                                                            {item.type === "json-to-object" ? "JSON→OBJ" : "OBJ→JSON"}
                                                        </Chip>
                                                        <span className="text-xs text-gray-400">
                                                            {item.timestamp.toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Tooltip content="Copy Input">
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        onPress={() => copyToClipboard(item.input, "json")}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <ContentCopy className="text-gray-400" />
                                                    </Button>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {state.history.length > 0 && (
                                <div className="flex gap-2 mt-4">
                                    <Button
                                        size="sm"
                                        variant="bordered"
                                        startContent={<Download />}
                                        onPress={exportHistory}
                                        fullWidth
                                    >
                                        Export
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="bordered"
                                        color="danger"
                                        onPress={() => setState(prev => ({ ...prev, history: [] }))}
                                        fullWidth
                                    >
                                        Clear
                                    </Button>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* JSON Guide */}
                    <Card className="bg-black/10 backdrop-blur-lg border border-white/20">
                        <CardBody className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <span>📋</span>
                                JSON Rules
                            </h3>
                            
                            <div className="space-y-3 text-sm">
                                <div className="flex items-start gap-3">
                                    <span className="text-green-400">✓</span>
                                    <div className="text-gray-300">Use double quotes for strings</div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                    <span className="text-green-400">✓</span>
                                    <div className="text-gray-300">Property names must be quoted</div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                    <span className="text-green-400">✓</span>
                                    <div className="text-gray-300">No trailing commas allowed</div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                    <span className="text-green-400">✓</span>
                                    <div className="text-gray-300">Boolean: true/false (lowercase)</div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                    <span className="text-red-400">✗</span>
                                    <div className="text-gray-300">No comments allowed in JSON</div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Quick Examples */}
                    <Card className="bg-black/10 backdrop-blur-lg border border-white/20">
                        <CardBody className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <span>💡</span>
                                Examples
                            </h3>
                            
                            <div className="space-y-3">
                                <Button
                                    size="sm"
                                    variant="bordered"
                                    fullWidth
                                    className="justify-start text-left"
                                    onPress={() => {
                                        const example = '{"user": {"name": "Alice", "age": 25}}';
                                        handleJSONChange(example);
                                    }}
                                >
                                    <span className="truncate">Simple Object</span>
                                </Button>
                                
                                <Button
                                    size="sm"
                                    variant="bordered"
                                    fullWidth
                                    className="justify-start text-left"
                                    onPress={() => {
                                        const example = '[{"id": 1, "name": "Item 1"}, {"id": 2, "name": "Item 2"}]';
                                        handleJSONChange(example);
                                    }}
                                >
                                    <span className="truncate">Array of Objects</span>
                                </Button>
                                
                                <Button
                                    size="sm"
                                    variant="bordered"
                                    fullWidth
                                    className="justify-start text-left"
                                    onPress={() => {
                                        const example = '{"config": {"debug": true, "timeout": 5000, "features": ["auth", "api"]}}';
                                        handleJSONChange(example);
                                    }}
                                >
                                    <span className="truncate">Nested Config</span>
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}
