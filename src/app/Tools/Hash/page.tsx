"use client";

import React, { useState, useRef } from "react";
import {
    ContentCopy,
    Tag,
    Calculate,
    Fingerprint,
    Security,
    Speed,
    Check,
    Clear,
    History,
    Download,
    Upload,
    Compare,
    FileUpload,
    Info,
    CheckCircle,
    SelectAll,
    AutorenewOutlined
} from "@mui/icons-material";
import { 
    Button, 
    Card, 
    CardBody, 
    Textarea, 
    Checkbox, 
    Tabs, 
    Tab, 
    Chip, 
    Tooltip,
    Divider,
    Progress,
    Input,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Select,
    SelectItem,
    Accordion,
    AccordionItem
} from "@heroui/react";
import CryptoJS from "crypto-js";

type HashAlgorithm =
    | "MD5"
    | "SHA1"
    | "SHA256"
    | "SHA512"
    | "SHA3"
    | "RIPEMD160";

interface HashResult {
    algorithm: HashAlgorithm;
    hash: string;
    length: number;
    input: string;
    timestamp: Date;
}

interface HashHistory {
    id: string;
    input: string;
    results: HashResult[];
    timestamp: Date;
}

interface IState {
    text: string;
    results: HashResult[];
    selectedAlgorithms: HashAlgorithm[];
    copied: string | null;
    history: HashHistory[];
    compareMode: boolean;
    compareInput: string;
    compareResults: HashResult[];
    activeTab: "generator" | "compare" | "file" | "history";
    fileContent: string;
    fileName: string;
    batchMode: boolean;
    batchInputs: string[];
}

export default function HashGenerator() {
    const [state, setState] = useState<IState>({
        text: "Hello, World!",
        results: [],
        selectedAlgorithms: ["MD5", "SHA1", "SHA256", "SHA512"],
        copied: null,
        history: [],
        compareMode: false,
        compareInput: "",
        compareResults: [],
        activeTab: "generator",
        fileContent: "",
        fileName: "",
        batchMode: false,
        batchInputs: [""]
    });

    const { isOpen: isHistoryOpen, onOpen: onHistoryOpen, onOpenChange: onHistoryOpenChange } = useDisclosure();
    const { isOpen: isInfoOpen, onOpen: onInfoOpen, onOpenChange: onInfoOpenChange } = useDisclosure();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const algorithms: {
        value: HashAlgorithm;
        label: string;
        description: string;
        security: "Low" | "Medium" | "High";
        speed: "Fast" | "Medium" | "Slow";
    }[] = [
        {
            value: "MD5",
            label: "MD5",
            description:
                "128-bit hash function, widely used but cryptographically broken",
            security: "Low",
            speed: "Fast"
        },
        {
            value: "SHA1",
            label: "SHA-1",
            description:
                "160-bit hash function, deprecated for cryptographic use",
            security: "Low",
            speed: "Fast"
        },
        {
            value: "SHA256",
            label: "SHA-256",
            description:
                "256-bit hash function, part of SHA-2 family, widely used and secure",
            security: "High",
            speed: "Medium"
        },
        {
            value: "SHA512",
            label: "SHA-512",
            description:
                "512-bit hash function, part of SHA-2 family, very secure",
            security: "High",
            speed: "Medium"
        },
        {
            value: "SHA3",
            label: "SHA-3",
            description: "Latest SHA standard, 256-bit output, highly secure",
            security: "High",
            speed: "Slow"
        },
        {
            value: "RIPEMD160",
            label: "RIPEMD-160",
            description: "160-bit hash function, used in Bitcoin addresses",
            security: "Medium",
            speed: "Medium"
        }
    ];

    const generateHashes = (inputText: string = state.text) => {
        if (!inputText.trim()) {
            return [];
        }

        const results: HashResult[] = [];
        const timestamp = new Date();

        state.selectedAlgorithms.forEach((algorithm) => {
            try {
                let hash = "";

                switch (algorithm) {
                    case "MD5":
                        hash = CryptoJS.MD5(inputText).toString();
                        break;
                    case "SHA1":
                        hash = CryptoJS.SHA1(inputText).toString();
                        break;
                    case "SHA256":
                        hash = CryptoJS.SHA256(inputText).toString();
                        break;
                    case "SHA512":
                        hash = CryptoJS.SHA512(inputText).toString();
                        break;
                    case "SHA3":
                        hash = CryptoJS.SHA3(inputText, {
                            outputLength: 256
                        }).toString();
                        break;
                    case "RIPEMD160":
                        hash = CryptoJS.RIPEMD160(inputText).toString();
                        break;
                }

                results.push({
                    algorithm,
                    hash,
                    length: hash.length,
                    input: inputText,
                    timestamp
                });
            } catch (error) {
                console.error(`Error generating ${algorithm} hash:`, error);
            }
        });

        return results;
    };

    const addToHistory = (results: HashResult[]) => {
        if (results.length > 0) {
            const historyItem: HashHistory = {
                id: Date.now().toString(),
                input: state.text,
                results,
                timestamp: new Date()
            };
            setState(prev => ({
                ...prev,
                history: [historyItem, ...prev.history.slice(0, 19)]
            }));
        }
    };

    const handleGenerate = () => {
        const results = generateHashes();
        setState(prev => ({ ...prev, results }));
        addToHistory(results);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setState(prev => ({
                    ...prev,
                    fileContent: content,
                    fileName: file.name,
                    text: content
                }));
            };
            reader.readAsText(file);
        }
    };

    const handleCompare = () => {
        const compareResults = generateHashes(state.compareInput);
        setState(prev => ({ ...prev, compareResults }));
    };

    const addBatchInput = () => {
        setState(prev => ({
            ...prev,
            batchInputs: [...prev.batchInputs, ""]
        }));
    };

    const updateBatchInput = (index: number, value: string) => {
        setState(prev => ({
            ...prev,
            batchInputs: prev.batchInputs.map((input, i) => i === index ? value : input)
        }));
    };

    const removeBatchInput = (index: number) => {
        setState(prev => ({
            ...prev,
            batchInputs: prev.batchInputs.filter((_, i) => i !== index)
        }));
    };

    const generateBatchHashes = () => {
        const allResults: HashResult[] = [];
        state.batchInputs.forEach((input, index) => {
            if (input.trim()) {
                const results = generateHashes(input);
                allResults.push(...results);
            }
        });
        setState(prev => ({ ...prev, results: allResults }));
        if (allResults.length > 0) {
            addToHistory(allResults);
        }
    };

    const loadFromHistory = (historyItem: HashHistory) => {
        setState(prev => ({
            ...prev,
            text: historyItem.input,
            results: historyItem.results
        }));
        onHistoryOpenChange();
    };

    const clearHistory = () => {
        setState(prev => ({ ...prev, history: [] }));
    };

    const exportHistory = () => {
        const data = {
            exported: new Date().toISOString(),
            hashes: state.history
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `hash-history-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = (text: string, algorithm: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setState({ ...state, copied: algorithm });

            setTimeout(() => {
                setState((prevState) => ({ ...prevState, copied: null }));
            }, 2000);
        });
    };

    const toggleAlgorithm = (algorithm: HashAlgorithm) => {
        const newSelected = state.selectedAlgorithms.includes(algorithm)
            ? state.selectedAlgorithms.filter((a) => a !== algorithm)
            : [...state.selectedAlgorithms, algorithm];

        setState({ ...state, selectedAlgorithms: newSelected });
    };

    const selectAllAlgorithms = () => {
        setState({
            ...state,
            selectedAlgorithms: algorithms.map((a) => a.value)
        });
    };

    const deselectAllAlgorithms = () => {
        setState({ ...state, selectedAlgorithms: [] });
    };

    const clearAll = () => {
        setState({
            ...state,
            text: "",
            results: []
        });
    };

    const getSecurityIcon = (security: string) => {
        switch (security) {
            case "High":
                return <Security style={{ color: "#22c55e" }} />;
            case "Medium":
                return <Security style={{ color: "#f59e0b" }} />;
            case "Low":
                return <Security style={{ color: "#ef4444" }} />;
            default:
                return <Security />;
        }
    };

    const getSpeedIcon = (speed: string) => {
        switch (speed) {
            case "Fast":
                return <Speed style={{ color: "#22c55e" }} />;
            case "Medium":
                return <Speed style={{ color: "#f59e0b" }} />;
            case "Slow":
                return <Speed style={{ color: "#ef4444" }} />;
            default:
                return <Speed />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                            <Fingerprint className="w-8 h-8 text-purple-300" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                            Hash Generator
                        </h1>
                    </div>
                    <p className="text-white/70 text-lg max-w-2xl mx-auto">
                        Generate secure hash values using multiple cryptographic algorithms with advanced features
                    </p>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Column - Input & Controls */}
                    <div className="lg:col-span-3 space-y-6">
                        <Tabs 
                            selectedKey={state.activeTab} 
                            onSelectionChange={(key) => setState(prev => ({ ...prev, activeTab: key as any }))}
                            classNames={{
                                tabList: "bg-white/10 backdrop-blur-sm border border-white/20",
                                tab: "text-white/70 data-[selected=true]:text-white",
                                tabContent: "text-white/70 data-[selected=true]:text-white",
                                cursor: "bg-white/20 backdrop-blur-sm",
                                panel: "pt-4"
                            }}
                        >
                            <Tab key="generator" title={
                                <div className="flex items-center gap-2">
                                    <Calculate className="w-4 h-4" />
                                    Generator
                                </div>
                            }>
                                <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl">
                                    <CardBody className="p-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-semibold text-white">Input Text</h3>
                                                <Chip 
                                                    size="sm" 
                                                    variant="flat" 
                                                    className="bg-white/20 text-white"
                                                >
                                                    {state.text.length} characters
                                                </Chip>
                                            </div>
                                            <Textarea
                                                value={state.text}
                                                onValueChange={(value) => setState(prev => ({ ...prev, text: value }))}
                                                placeholder="Enter the text you want to hash..."
                                                minRows={6}
                                                maxRows={12}
                                                classNames={{
                                                    base: "w-full",
                                                    input: "bg-white/5 text-white placeholder:text-white/50",
                                                    inputWrapper: "bg-white/5 border border-white/20 data-[hover=true]:border-white/30"
                                                }}
                                            />
                                            
                                            {!state.batchMode && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        onPress={() => setState(prev => ({ ...prev, batchMode: true }))}
                                                        variant="flat"
                                                        size="sm"
                                                        className="bg-white/10 text-white border border-white/20"
                                                        startContent={<SelectAll className="w-4 h-4" />}
                                                    >
                                                        Batch Mode
                                                    </Button>
                                                    <Button
                                                        onPress={() => fileInputRef.current?.click()}
                                                        variant="flat"
                                                        size="sm"
                                                        className="bg-white/10 text-white border border-white/20"
                                                        startContent={<Upload className="w-4 h-4" />}
                                                    >
                                                        Upload File
                                                    </Button>
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept=".txt,.json,.md,.js,.ts,.py,.java,.cpp,.c,.html,.css,.xml,.log"
                                                        onChange={handleFileUpload}
                                                        className="hidden"
                                                    />
                                                </div>
                                            )}

                                            {state.batchMode && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-sm font-medium text-white/80">Batch Inputs</h4>
                                                        <Button
                                                            onPress={() => setState(prev => ({ ...prev, batchMode: false }))}
                                                            variant="flat"
                                                            size="sm"
                                                            className="bg-white/10 text-white border border-white/20"
                                                        >
                                                            Exit Batch
                                                        </Button>
                                                    </div>
                                                    {state.batchInputs.map((input, index) => (
                                                        <div key={index} className="flex gap-2">
                                                            <Input
                                                                value={input}
                                                                onValueChange={(value) => updateBatchInput(index, value)}
                                                                placeholder={`Input ${index + 1}...`}
                                                                classNames={{
                                                                    input: "bg-white/5 text-white placeholder:text-white/50",
                                                                    inputWrapper: "bg-white/5 border border-white/20"
                                                                }}
                                                            />
                                                            {state.batchInputs.length > 1 && (
                                                                <Button
                                                                    onPress={() => removeBatchInput(index)}
                                                                    isIconOnly
                                                                    variant="flat"
                                                                    size="sm"
                                                                    className="bg-red-500/20 text-red-300 border border-red-500/30"
                                                                >
                                                                    <Clear className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <Button
                                                        onPress={addBatchInput}
                                                        variant="flat"
                                                        size="sm"
                                                        className="bg-white/10 text-white border border-white/20"
                                                    >
                                                        Add Input
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>
                            </Tab>

                            <Tab key="compare" title={
                                <div className="flex items-center gap-2">
                                    <Compare className="w-4 h-4" />
                                    Compare
                                </div>
                            }>
                                <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl">
                                    <CardBody className="p-6">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-white">Compare Hashes</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-white/80 mb-2">Original Text</label>
                                                    <Textarea
                                                        value={state.text}
                                                        onValueChange={(value) => setState(prev => ({ ...prev, text: value }))}
                                                        placeholder="Original text..."
                                                        minRows={4}
                                                        classNames={{
                                                            input: "bg-white/5 text-white placeholder:text-white/50",
                                                            inputWrapper: "bg-white/5 border border-white/20"
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-white/80 mb-2">Compare Text</label>
                                                    <Textarea
                                                        value={state.compareInput}
                                                        onValueChange={(value) => setState(prev => ({ ...prev, compareInput: value }))}
                                                        placeholder="Text to compare..."
                                                        minRows={4}
                                                        classNames={{
                                                            input: "bg-white/5 text-white placeholder:text-white/50",
                                                            inputWrapper: "bg-white/5 border border-white/20"
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                onPress={handleCompare}
                                                color="primary"
                                                className="bg-gradient-to-r from-purple-500 to-blue-500"
                                                startContent={<Compare className="w-4 h-4" />}
                                            >
                                                Compare Hashes
                                            </Button>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Tab>

                            <Tab key="file" title={
                                <div className="flex items-center gap-2">
                                    <FileUpload className="w-4 h-4" />
                                    File
                                </div>
                            }>
                                <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl">
                                    <CardBody className="p-6">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-white">File Hash</h3>
                                            <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center">
                                                <FileUpload className="w-12 h-12 text-white/50 mx-auto mb-4" />
                                                <p className="text-white/70 mb-4">Drag and drop a file or click to browse</p>
                                                <Button
                                                    onPress={() => fileInputRef.current?.click()}
                                                    color="primary"
                                                    className="bg-gradient-to-r from-purple-500 to-blue-500"
                                                >
                                                    Choose File
                                                </Button>
                                            </div>
                                            {state.fileName && (
                                                <div className="p-4 bg-white/5 rounded-lg border border-white/20">
                                                    <p className="text-white font-medium">Selected: {state.fileName}</p>
                                                    <p className="text-white/70 text-sm">Content length: {state.fileContent.length} characters</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>
                            </Tab>
                        </Tabs>

                        {/* Algorithm Selection */}
                        <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl">
                            <CardBody className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-white">Hash Algorithms</h3>
                                    <div className="flex gap-2">
                                        <Button
                                            onPress={selectAllAlgorithms}
                                            variant="flat"
                                            size="sm"
                                            className="bg-white/10 text-white border border-white/20"
                                        >
                                            Select All
                                        </Button>
                                        <Button
                                            onPress={deselectAllAlgorithms}
                                            variant="flat"
                                            size="sm"
                                            className="bg-white/10 text-white border border-white/20"
                                        >
                                            Clear All
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {algorithms.map((algo) => (
                                        <div
                                            key={algo.value}
                                            className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                                state.selectedAlgorithms.includes(algo.value)
                                                    ? "bg-purple-500/20 border-purple-400/50"
                                                    : "bg-white/5 border-white/20 hover:border-white/30"
                                            }`}
                                            onClick={() => toggleAlgorithm(algo.value)}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        isSelected={state.selectedAlgorithms.includes(algo.value)}
                                                        onChange={() => toggleAlgorithm(algo.value)}
                                                        size="sm"
                                                    />
                                                    <span className="font-medium text-white">{algo.label}</span>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Tooltip content={`Security: ${algo.security}`}>
                                                        <div>{getSecurityIcon(algo.security)}</div>
                                                    </Tooltip>
                                                    <Tooltip content={`Speed: ${algo.speed}`}>
                                                        <div>{getSpeedIcon(algo.speed)}</div>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                            <p className="text-white/70 text-sm mb-2">{algo.description}</p>
                                            <div className="flex gap-2">
                                                <Chip size="sm" variant="flat" className={`
                                                    ${algo.security === 'High' ? 'bg-green-500/20 text-green-300' : ''}
                                                    ${algo.security === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' : ''}
                                                    ${algo.security === 'Low' ? 'bg-red-500/20 text-red-300' : ''}
                                                `}>
                                                    {algo.security} Security
                                                </Chip>
                                                <Chip size="sm" variant="flat" className="bg-white/10 text-white/70">
                                                    {algo.speed} Speed
                                                </Chip>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <Button
                                onPress={state.batchMode ? generateBatchHashes : handleGenerate}
                                color="primary"
                                size="lg"
                                className="bg-gradient-to-r from-purple-500 to-blue-500 flex-1"
                                startContent={<Calculate className="w-5 h-5" />}
                                isDisabled={state.selectedAlgorithms.length === 0}
                            >
                                {state.batchMode ? "Generate Batch Hashes" : "Generate Hashes"}
                            </Button>
                            <Button
                                onPress={clearAll}
                                variant="flat"
                                size="lg"
                                className="bg-red-500/20 text-red-300 border border-red-500/30"
                                startContent={<Clear className="w-5 h-5" />}
                            >
                                Clear
                            </Button>
                        </div>

                        {/* Results */}
                        {(state.results.length > 0 || state.compareResults.length > 0) && (
                            <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl">
                                <CardBody className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-white">Hash Results</h3>
                                        <div className="flex gap-2">
                                            <Chip variant="flat" className="bg-white/20 text-white">
                                                {state.results.length} hash{state.results.length !== 1 ? 'es' : ''}
                                            </Chip>
                                            <Button
                                                onPress={exportHistory}
                                                variant="flat"
                                                size="sm"
                                                className="bg-white/10 text-white border border-white/20"
                                                startContent={<Download className="w-4 h-4" />}
                                            >
                                                Export
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {state.results.map((result, index) => (
                                            <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/20">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Tag className="w-4 h-4 text-purple-300" />
                                                        <span className="font-medium text-white">{result.algorithm}</span>
                                                        <Chip size="sm" variant="flat" className="bg-white/10 text-white/70">
                                                            {result.length} chars
                                                        </Chip>
                                                    </div>
                                                    <Button
                                                        onPress={() => copyToClipboard(result.hash, result.algorithm)}
                                                        isIconOnly
                                                        variant="flat"
                                                        size="sm"
                                                        className={`${
                                                            state.copied === result.algorithm
                                                                ? "bg-green-500/20 text-green-300"
                                                                : "bg-white/10 text-white/70"
                                                        } border border-white/20`}
                                                    >
                                                        {state.copied === result.algorithm ? 
                                                            <CheckCircle className="w-4 h-4" /> : 
                                                            <ContentCopy className="w-4 h-4" />
                                                        }
                                                    </Button>
                                                </div>
                                                <div className="p-3 bg-black/20 rounded-md">
                                                    <code className="text-green-300 text-sm font-mono break-all">
                                                        {result.hash}
                                                    </code>
                                                </div>
                                            </div>
                                        ))}

                                        {state.compareResults.length > 0 && (
                                            <div className="mt-6">
                                                <h4 className="text-md font-semibold text-white mb-3">Comparison Results</h4>
                                                {state.compareResults.map((result, index) => (
                                                    <div key={index} className="p-4 bg-blue-500/10 rounded-lg border border-blue-400/30">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-medium text-white">{result.algorithm}</span>
                                                            <div className="flex items-center gap-2">
                                                                {state.results.find(r => r.algorithm === result.algorithm && r.hash === result.hash) ? (
                                                                    <Chip size="sm" className="bg-green-500/20 text-green-300">
                                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                                        Match
                                                                    </Chip>
                                                                ) : (
                                                                    <Chip size="sm" className="bg-red-500/20 text-red-300">
                                                                        Different
                                                                    </Chip>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="p-3 bg-black/20 rounded-md">
                                                            <code className="text-blue-300 text-sm font-mono break-all">
                                                                {result.hash}
                                                            </code>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl">
                            <CardBody className="p-4">
                                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                                <div className="space-y-2">
                                    <Button
                                        onPress={onHistoryOpen}
                                        variant="flat"
                                        className="w-full bg-white/10 text-white border border-white/20 justify-start"
                                        startContent={<History className="w-4 h-4" />}
                                    >
                                        View History ({state.history.length})
                                    </Button>
                                    <Button
                                        onPress={onInfoOpen}
                                        variant="flat"
                                        className="w-full bg-white/10 text-white border border-white/20 justify-start"
                                        startContent={<Info className="w-4 h-4" />}
                                    >
                                        Hash Info
                                    </Button>
                                    <Button
                                        onPress={exportHistory}
                                        variant="flat"
                                        className="w-full bg-white/10 text-white border border-white/20 justify-start"
                                        startContent={<Download className="w-4 h-4" />}
                                        isDisabled={state.history.length === 0}
                                    >
                                        Export History
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Algorithm Stats */}
                        <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl">
                            <CardBody className="p-4">
                                <h3 className="text-lg font-semibold text-white mb-4">Selected Algorithms</h3>
                                <div className="space-y-3">
                                    {state.selectedAlgorithms.map(algo => {
                                        const algoInfo = algorithms.find(a => a.value === algo);
                                        return (
                                            <div key={algo} className="flex items-center justify-between p-2 bg-white/5 rounded">
                                                <span className="text-white text-sm">{algoInfo?.label}</span>
                                                <div className="flex gap-1">
                                                    {getSecurityIcon(algoInfo?.security || '')}
                                                    {getSpeedIcon(algoInfo?.speed || '')}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {state.selectedAlgorithms.length === 0 && (
                                        <p className="text-white/50 text-sm">No algorithms selected</p>
                                    )}
                                </div>
                            </CardBody>
                        </Card>

                        {/* Security Tips */}
                        <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl">
                            <CardBody className="p-4">
                                <h3 className="text-lg font-semibold text-white mb-4">Security Tips</h3>
                                <div className="space-y-3 text-sm text-white/70">
                                    <div className="flex items-start gap-2">
                                        <Security className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                        <span>Use SHA-256 or SHA-512 for secure applications</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Security className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                        <span>Avoid MD5 and SHA-1 for cryptographic purposes</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Security className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <span>Hash functions are one-way; they cannot be reversed</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Security className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                        <span>For passwords, use bcrypt, scrypt, or Argon2</span>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>

            {/* History Modal */}
            <Modal 
                isOpen={isHistoryOpen} 
                onOpenChange={onHistoryOpenChange}
                size="3xl"
                classNames={{
                    backdrop: "bg-black/50 backdrop-blur-sm",
                    base: "bg-white/10 backdrop-blur-md border border-white/20",
                    header: "text-white border-b border-white/20",
                    body: "text-white",
                    footer: "border-t border-white/20"
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>
                                <div className="flex items-center gap-2">
                                    <History className="w-5 h-5" />
                                    Hash History ({state.history.length})
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                <div className="max-h-96 overflow-y-auto space-y-3">
                                    {state.history.length === 0 ? (
                                        <p className="text-white/50 text-center py-8">No history available</p>
                                    ) : (
                                        state.history.map((item) => (
                                            <div 
                                                key={item.id} 
                                                className="p-4 bg-white/5 rounded-lg border border-white/20 cursor-pointer hover:bg-white/10 transition-colors"
                                                onClick={() => loadFromHistory(item)}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm text-white/70">
                                                        {item.timestamp.toLocaleString()}
                                                    </span>
                                                    <Chip size="sm" variant="flat" className="bg-white/20 text-white">
                                                        {item.results.length} hash{item.results.length !== 1 ? 'es' : ''}
                                                    </Chip>
                                                </div>
                                                <p className="text-white text-sm truncate mb-2">
                                                    Input: {item.input.substring(0, 100)}
                                                    {item.input.length > 100 && '...'}
                                                </p>
                                                <div className="flex flex-wrap gap-1">
                                                    {item.results.map((result, idx) => (
                                                        <Chip key={idx} size="sm" variant="flat" className="bg-purple-500/20 text-purple-300">
                                                            {result.algorithm}
                                                        </Chip>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button 
                                    color="danger" 
                                    variant="flat" 
                                    onPress={clearHistory}
                                    isDisabled={state.history.length === 0}
                                >
                                    Clear History
                                </Button>
                                <Button color="primary" onPress={onClose}>
                                    Close
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Info Modal */}
            <Modal 
                isOpen={isInfoOpen} 
                onOpenChange={onInfoOpenChange}
                size="4xl"
                classNames={{
                    backdrop: "bg-black/50 backdrop-blur-sm",
                    base: "bg-white/10 backdrop-blur-md border border-white/20",
                    header: "text-white border-b border-white/20",
                    body: "text-white",
                    footer: "border-t border-white/20"
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>
                                <div className="flex items-center gap-2">
                                    <Info className="w-5 h-5" />
                                    Hash Functions Guide
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                <div className="space-y-6">
                                    <Accordion>
                                        <AccordionItem key="what-are-hashes" title="What are Hash Functions?">
                                            <p className="text-white/70">
                                                Hash functions are mathematical algorithms that take input data of any size and produce a 
                                                fixed-size string of characters, which is typically a hexadecimal number. The output is 
                                                called a hash value, hash code, digest, or simply hash.
                                            </p>
                                        </AccordionItem>
                                        
                                        <AccordionItem key="common-uses" title="Common Uses">
                                            <ul className="text-white/70 space-y-1">
                                                <li>• Data integrity verification</li>
                                                <li>• Password storage (with salt)</li>
                                                <li>• Digital signatures</li>
                                                <li>• Blockchain and cryptocurrency</li>
                                                <li>• File deduplication</li>
                                                <li>• Checksums for error detection</li>
                                            </ul>
                                        </AccordionItem>
                                        
                                        <AccordionItem key="security" title="Security Considerations">
                                            <div className="space-y-2 text-white/70">
                                                <p><strong className="text-red-300">MD5 & SHA-1:</strong> Cryptographically broken, avoid for security purposes</p>
                                                <p><strong className="text-green-300">SHA-256 & SHA-512:</strong> Currently secure and widely used</p>
                                                <p><strong className="text-blue-300">SHA-3:</strong> Latest standard, designed to be quantum-resistant</p>
                                                <p><strong className="text-yellow-300">RIPEMD-160:</strong> Less common but still considered secure</p>
                                            </div>
                                        </AccordionItem>
                                        
                                        <AccordionItem key="properties" title="Properties of Good Hash Functions">
                                            <ul className="text-white/70 space-y-1">
                                                <li>• <strong>Deterministic:</strong> Same input always produces same output</li>
                                                <li>• <strong>Fast computation:</strong> Quick to calculate</li>
                                                <li>• <strong>Avalanche effect:</strong> Small input changes cause large output changes</li>
                                                <li>• <strong>Pre-image resistance:</strong> Hard to reverse the hash</li>
                                                <li>• <strong>Collision resistance:</strong> Hard to find two inputs with same hash</li>
                                            </ul>
                                        </AccordionItem>
                                    </Accordion>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="primary" onPress={onClose}>
                                    Close
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
