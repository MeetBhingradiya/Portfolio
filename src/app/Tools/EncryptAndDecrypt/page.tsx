"use client";

import React, { useState, useRef } from "react";
import {
    ContentCopy,
    Key,
    VpnKey,
    Lock,
    LockOpen,
    Refresh,
    Visibility,
    VisibilityOff,
    Security,
    Info,
    History,
    Download,
    Upload,
    Clear,
    CheckCircle,
    Warning,
    Shuffle,
    SwapHoriz,
    FileUpload
} from "@mui/icons-material";
import {
    Button,
    Card,
    CardBody,
    Textarea,
    Input,
    Select,
    SelectItem,
    Chip,
    Tabs,
    Tab,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Progress,
    Tooltip,
    Divider,
    Accordion,
    AccordionItem
} from "@heroui/react";
import CryptoJS from "crypto-js";

type CryptographyMode = "encrypt" | "decrypt";
type Algorithm = "AES" | "DES" | "TripleDES" | "Rabbit" | "RC4";

interface CryptoResult {
    id: string;
    algorithm: Algorithm;
    mode: CryptographyMode;
    input: string;
    output: string;
    key: string;
    timestamp: Date;
}

interface IState {
    mode: CryptographyMode;
    algorithm: Algorithm;
    text: string;
    key: string;
    result: string;
    showKey: boolean;
    copied: string | null;
    history: CryptoResult[];
    activeTab: "single" | "batch" | "file";
    batchInputs: Array<{ id: string; text: string; key: string }>;
    fileContent: string;
    fileName: string;
    keyStrength: number;
    autoGenerateKey: boolean;
}

export default function EncryptAndDecrypt() {
    const [state, setState] = useState<IState>({
        mode: "encrypt",
        algorithm: "AES",
        text: "",
        key: "",
        result: "",
        showKey: false,
        copied: null,
        history: [],
        activeTab: "single",
        batchInputs: [{ id: "1", text: "", key: "" }],
        fileContent: "",
        fileName: "",
        keyStrength: 0,
        autoGenerateKey: false
    });

    const { isOpen: isHistoryOpen, onOpen: onHistoryOpen, onOpenChange: onHistoryOpenChange } = useDisclosure();
    const { isOpen: isInfoOpen, onOpen: onInfoOpen, onOpenChange: onInfoOpenChange } = useDisclosure();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const algorithms = [
        {
            value: "AES" as Algorithm,
            label: "AES (Advanced Encryption Standard)",
            security: "Very High",
            speed: "Fast",
            recommended: true,
            keyLength: [16, 24, 32],
            description: "Industry standard, highly secure"
        },
        {
            value: "DES" as Algorithm,
            label: "DES (Data Encryption Standard)",
            security: "Very Low",
            speed: "Fast",
            recommended: false,
            keyLength: [8],
            description: "Deprecated, easily broken"
        },
        {
            value: "TripleDES" as Algorithm,
            label: "TripleDES (3DES)",
            security: "Medium",
            speed: "Slow",
            recommended: false,
            keyLength: [24],
            description: "Legacy, being phased out"
        },
        {
            value: "Rabbit" as Algorithm,
            label: "Rabbit Stream Cipher",
            security: "High",
            speed: "Very Fast",
            recommended: true,
            keyLength: [16],
            description: "Fast stream cipher"
        },
        {
            value: "RC4" as Algorithm,
            label: "RC4 Stream Cipher",
            security: "Low",
            speed: "Fast",
            recommended: false,
            keyLength: [16],
            description: "Has known vulnerabilities"
        }
    ];

    const calculateKeyStrength = (key: string): number => {
        let score = 0;

        // Length score
        if (key.length >= 8) score += 20;
        if (key.length >= 16) score += 20;
        if (key.length >= 32) score += 20;

        // Character variety
        if (/[a-z]/.test(key)) score += 10;
        if (/[A-Z]/.test(key)) score += 10;
        if (/[0-9]/.test(key)) score += 10;
        if (/[^a-zA-Z0-9]/.test(key)) score += 10;

        return Math.min(score, 100);
    };

    React.useEffect(() => {
        const strength = calculateKeyStrength(state.key);
        setState(prev => ({ ...prev, keyStrength: strength }));
    }, [state.key]);

    const generateRandomKey = (length?: number) => {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?";
        const selectedAlgo = algorithms.find(a => a.value === state.algorithm);
        const keyLength = length || selectedAlgo?.keyLength[selectedAlgo.keyLength.length - 1] || 32;

        let result = "";
        for (let i = 0; i < keyLength; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        setState(prev => ({ ...prev, key: result }));
    };

    const addToHistory = (result: CryptoResult) => {
        setState(prev => ({
            ...prev,
            history: [result, ...prev.history.slice(0, 19)]
        }));
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

    const addBatchInput = () => {
        setState(prev => ({
            ...prev,
            batchInputs: [...prev.batchInputs, { id: Date.now().toString(), text: "", key: "" }]
        }));
    };

    const updateBatchInput = (id: string, field: "text" | "key", value: string) => {
        setState(prev => ({
            ...prev,
            batchInputs: prev.batchInputs.map(input =>
                input.id === id ? { ...input, [field]: value } : input
            )
        }));
    };

    const removeBatchInput = (id: string) => {
        setState(prev => ({
            ...prev,
            batchInputs: prev.batchInputs.filter(input => input.id !== id)
        }));
    };

    const processText = () => {
        if (!state.text.trim()) {
            alert("Please enter text to process");
            return;
        }

        if (!state.key.trim()) {
            alert("Please enter a key");
            return;
        }

        try {
            let result = "";

            if (state.mode === "encrypt") {
                switch (state.algorithm) {
                    case "AES":
                        result = CryptoJS.AES.encrypt(state.text, state.key).toString();
                        break;
                    case "DES":
                        result = CryptoJS.DES.encrypt(state.text, state.key).toString();
                        break;
                    case "TripleDES":
                        result = CryptoJS.TripleDES.encrypt(state.text, state.key).toString();
                        break;
                    case "Rabbit":
                        result = CryptoJS.Rabbit.encrypt(state.text, state.key).toString();
                        break;
                    case "RC4":
                        result = CryptoJS.RC4.encrypt(state.text, state.key).toString();
                        break;
                }
            } else {
                switch (state.algorithm) {
                    case "AES":
                        const bytesAES = CryptoJS.AES.decrypt(state.text, state.key);
                        result = bytesAES.toString(CryptoJS.enc.Utf8);
                        break;
                    case "DES":
                        const bytesDES = CryptoJS.DES.decrypt(state.text, state.key);
                        result = bytesDES.toString(CryptoJS.enc.Utf8);
                        break;
                    case "TripleDES":
                        const bytesTripleDES = CryptoJS.TripleDES.decrypt(state.text, state.key);
                        result = bytesTripleDES.toString(CryptoJS.enc.Utf8);
                        break;
                    case "Rabbit":
                        const bytesRabbit = CryptoJS.Rabbit.decrypt(state.text, state.key);
                        result = bytesRabbit.toString(CryptoJS.enc.Utf8);
                        break;
                    case "RC4":
                        const bytesRC4 = CryptoJS.RC4.decrypt(state.text, state.key);
                        result = bytesRC4.toString(CryptoJS.enc.Utf8);
                        break;
                }

                if (!result) {
                    throw new Error("Decryption failed - Invalid key or corrupted data");
                }
            }

            setState(prev => ({ ...prev, result }));

            // Add to history
            const historyItem: CryptoResult = {
                id: Date.now().toString(),
                algorithm: state.algorithm,
                mode: state.mode,
                input: state.text,
                output: result,
                key: state.showKey ? state.key : "***HIDDEN***",
                timestamp: new Date()
            };
            addToHistory(historyItem);

        } catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`);
        }
    };

    const processBatch = () => {
        const results: CryptoResult[] = [];

        state.batchInputs.forEach((input, index) => {
            if (input.text.trim() && input.key.trim()) {
                try {
                    let result = "";
                    const currentKey = input.key || state.key;

                    if (state.mode === "encrypt") {
                        switch (state.algorithm) {
                            case "AES":
                                result = CryptoJS.AES.encrypt(input.text, currentKey).toString();
                                break;
                            case "DES":
                                result = CryptoJS.DES.encrypt(input.text, currentKey).toString();
                                break;
                            case "TripleDES":
                                result = CryptoJS.TripleDES.encrypt(input.text, currentKey).toString();
                                break;
                            case "Rabbit":
                                result = CryptoJS.Rabbit.encrypt(input.text, currentKey).toString();
                                break;
                            case "RC4":
                                result = CryptoJS.RC4.encrypt(input.text, currentKey).toString();
                                break;
                        }
                    } else {
                        switch (state.algorithm) {
                            case "AES":
                                const bytesAES = CryptoJS.AES.decrypt(input.text, currentKey);
                                result = bytesAES.toString(CryptoJS.enc.Utf8);
                                break;
                            case "DES":
                                const bytesDES = CryptoJS.DES.decrypt(input.text, currentKey);
                                result = bytesDES.toString(CryptoJS.enc.Utf8);
                                break;
                            case "TripleDES":
                                const bytesTripleDES = CryptoJS.TripleDES.decrypt(input.text, currentKey);
                                result = bytesTripleDES.toString(CryptoJS.enc.Utf8);
                                break;
                            case "Rabbit":
                                const bytesRabbit = CryptoJS.Rabbit.decrypt(input.text, currentKey);
                                result = bytesRabbit.toString(CryptoJS.enc.Utf8);
                                break;
                            case "RC4":
                                const bytesRC4 = CryptoJS.RC4.decrypt(input.text, currentKey);
                                result = bytesRC4.toString(CryptoJS.enc.Utf8);
                                break;
                        }
                    }

                    const historyItem: CryptoResult = {
                        id: `${Date.now()}-${index}`,
                        algorithm: state.algorithm,
                        mode: state.mode,
                        input: input.text,
                        output: result,
                        key: state.showKey ? currentKey : "***HIDDEN***",
                        timestamp: new Date()
                    };
                    results.push(historyItem);

                } catch (error) {
                    console.error(`Error processing batch item ${index + 1}:`, error);
                }
            }
        });

        results.forEach(addToHistory);
        alert(`Processed ${results.length} items successfully`);
    };

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setState(prev => ({ ...prev, copied: type }));
            setTimeout(() => {
                setState(prev => ({ ...prev, copied: null }));
            }, 2000);
        });
    };

    const clearAll = () => {
        setState(prev => ({
            ...prev,
            text: "",
            key: "",
            result: "",
            fileContent: "",
            fileName: ""
        }));
    };

    const switchMode = () => {
        setState(prev => ({
            ...prev,
            mode: prev.mode === "encrypt" ? "decrypt" : "encrypt",
            text: prev.result,
            result: prev.text
        }));
    };

    const exportHistory = () => {
        const data = {
            exported: new Date().toISOString(),
            cryptoHistory: state.history
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `crypto-history-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const loadFromHistory = (item: CryptoResult) => {
        setState(prev => ({
            ...prev,
            algorithm: item.algorithm,
            mode: item.mode,
            text: item.input,
            result: item.output
        }));
        onHistoryOpenChange();
    };

    const clearHistory = () => {
        setState(prev => ({ ...prev, history: [] }));
    };

    const getSecurityColor = (level: string) => {
        switch (level) {
            case "Very High": return "success";
            case "High": return "primary";
            case "Medium": return "warning";
            case "Low": case "Very Low": return "danger";
            default: return "default";
        }
    };

    const getKeyStrengthColor = (strength: number) => {
        if (strength >= 80) return "success";
        if (strength >= 60) return "primary";
        if (strength >= 40) return "warning";
        return "danger";
    };

    const getKeyStrengthText = (strength: number) => {
        if (strength >= 80) return "Very Strong";
        if (strength >= 60) return "Strong";
        if (strength >= 40) return "Medium";
        if (strength >= 20) return "Weak";
        return "Very Weak";
    };

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-6 pt-45 min-h-max pb-16">
            {/* Header */}
            <div className="text-3xl font-bold mb-2 text-center text-white">
                Encrypt & Decrypt
            </div>
            <div className="text-base text-gray-400 mb-8 text-center max-w-2xl">
                Secure your data with advanced encryption algorithms and modern cryptographic tools
            </div>

            {/* Main Content */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Main Interface */}
                <div className="bg-black/10 backdrop-blur-lg border border-white/20 rounded-lg p-6 transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] hover:border-white/30">
                    <div className="space-y-6">
                        {/* Mode Toggle */}
                        <Card className="bg-black/5 backdrop-blur-sm border border-white/10 shadow-lg">
                            <CardBody className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-md font-semibold text-white">Operation Mode</h3>
                                    <Button
                                        onPress={switchMode}
                                        variant="flat"
                                        size="sm"
                                        className="bg-white/5 text-white/80 border border-white/10"
                                        startContent={<SwapHoriz className="w-4 h-4" />}
                                    >
                                        Switch to {state.mode === "encrypt" ? "Decrypt" : "Encrypt"}
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <Button
                                        onPress={() => setState(prev => ({ ...prev, mode: "encrypt" }))}
                                        color={state.mode === "encrypt" ? "primary" : "default"}
                                        variant={state.mode === "encrypt" ? "solid" : "flat"}
                                        size="lg"
                                        className={state.mode === "encrypt" ?
                                            "bg-gradient-to-r from-green-500 to-emerald-500" :
                                            "bg-white/10 text-white border border-white/20"
                                        }
                                        startContent={<Lock className="w-5 h-5" />}
                                    >
                                        Encrypt
                                    </Button>
                                    <Button
                                        onPress={() => setState(prev => ({ ...prev, mode: "decrypt" }))}
                                        color={state.mode === "decrypt" ? "primary" : "default"}
                                        variant={state.mode === "decrypt" ? "solid" : "flat"}
                                        size="lg"
                                        className={state.mode === "decrypt" ?
                                            "bg-gradient-to-r from-red-500 to-rose-500" :
                                            "bg-white/10 text-white border border-white/20"
                                        }
                                        startContent={<LockOpen className="w-5 h-5" />}
                                    >
                                        Decrypt
                                    </Button>
                                </div>

                                {/* Algorithm Selection */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-white/80">Encryption Algorithm</label>
                                    <Select
                                        selectedKeys={[state.algorithm]}
                                        onSelectionChange={(keys) => {
                                            const selected = Array.from(keys)[0] as Algorithm;
                                            setState(prev => ({ ...prev, algorithm: selected }));
                                        }}
                                        classNames={{
                                            trigger: "bg-white/10 border border-white/20 data-[hover=true]:border-white/30",
                                            value: "text-white",
                                            popoverContent: "bg-black/80 backdrop-blur-md border border-white/20"
                                        }}
                                    >
                                        {algorithms.map((algo) => (
                                            <SelectItem
                                                key={algo.value}
                                                textValue={algo.label}
                                                className="text-white"
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <div>
                                                        <div className="font-medium">{algo.label}</div>
                                                        <div className="text-xs text-white/60">{algo.description}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Chip
                                                            size="sm"
                                                            color={getSecurityColor(algo.security)}
                                                            variant="flat"
                                                        >
                                                            {algo.security}
                                                        </Chip>
                                                        {algo.recommended && (
                                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                                        )}
                                                        {!algo.recommended && (
                                                            <Warning className="w-4 h-4 text-yellow-400" />
                                                        )}
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Tabs for different input methods */}
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
                            <Tab key="single" title={
                                <div className="flex items-center gap-2">
                                    <VpnKey className="w-4 h-4" />
                                    Single
                                </div>
                            }>
                                <div className="space-y-6">
                                    {/* Input Section */}
                                    <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl">
                                        <CardBody className="p-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-lg font-semibold text-white">
                                                        {state.mode === "encrypt" ? "Plain Text" : "Encrypted Text"}
                                                    </h3>
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
                                                    placeholder={state.mode === "encrypt" ?
                                                        "Enter the text you want to encrypt..." :
                                                        "Enter the encrypted text you want to decrypt..."
                                                    }
                                                    minRows={6}
                                                    maxRows={12}
                                                    classNames={{
                                                        base: "w-full",
                                                        input: "bg-white/5 text-white placeholder:text-white/50",
                                                        inputWrapper: "bg-white/5 border border-white/20 data-[hover=true]:border-white/30"
                                                    }}
                                                />
                                                <div className="flex gap-2">
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
                                                        accept=".txt,.json,.md,.js,.ts,.py,.java,.cpp,.c,.html,.css,.xml"
                                                        onChange={handleFileUpload}
                                                        className="hidden"
                                                    />
                                                    {state.fileName && (
                                                        <Chip size="sm" variant="flat" className="bg-blue-500/20 text-blue-300">
                                                            {state.fileName}
                                                        </Chip>
                                                    )}
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>

                                    {/* Key Section */}
                                    <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl">
                                        <CardBody className="p-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-lg font-semibold text-white">Encryption Key</h3>
                                                    <div className="flex gap-2">
                                                        <Tooltip content="Generate random key">                                                        <Button
                                                            onPress={() => generateRandomKey()}
                                                            isIconOnly
                                                            variant="flat"
                                                            size="sm"
                                                            className="bg-white/10 text-white border border-white/20"
                                                        >
                                                            <Refresh className="w-4 h-4" />
                                                        </Button>
                                                        </Tooltip>
                                                        <Tooltip content={state.showKey ? "Hide key" : "Show key"}>
                                                            <Button
                                                                onPress={() => setState(prev => ({ ...prev, showKey: !prev.showKey }))}
                                                                isIconOnly
                                                                variant="flat"
                                                                size="sm"
                                                                className="bg-white/10 text-white border border-white/20"
                                                            >
                                                                {state.showKey ? <VisibilityOff className="w-4 h-4" /> : <Visibility className="w-4 h-4" />}
                                                            </Button>
                                                        </Tooltip>
                                                    </div>
                                                </div>

                                                <Input
                                                    type={state.showKey ? "text" : "password"}
                                                    value={state.key}
                                                    onValueChange={(value) => setState(prev => ({ ...prev, key: value }))}
                                                    placeholder="Enter your encryption key..."
                                                    classNames={{
                                                        input: "bg-white/5 text-white placeholder:text-white/50",
                                                        inputWrapper: "bg-white/5 border border-white/20 data-[hover=true]:border-white/30"
                                                    }}
                                                />

                                                {/* Key Strength Indicator */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-white/70">Key Strength</span>
                                                        <span className={`font-medium ${state.keyStrength >= 80 ? 'text-green-400' :
                                                                state.keyStrength >= 60 ? 'text-blue-400' :
                                                                    state.keyStrength >= 40 ? 'text-yellow-400' : 'text-red-400'
                                                            }`}>
                                                            {getKeyStrengthText(state.keyStrength)}
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={state.keyStrength}
                                                        color={getKeyStrengthColor(state.keyStrength)}
                                                        size="sm"
                                                        className="w-full"
                                                    />
                                                </div>

                                                <div className="text-sm text-white/60">
                                                    <p>Current length: {state.key.length} characters</p>
                                                    <p>
                                                        Recommended: {algorithms.find(a => a.value === state.algorithm)?.keyLength.join(', ')} characters
                                                    </p>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </div>
                            </Tab>

                            <Tab key="batch" title={
                                <div className="flex items-center gap-2">
                                    <Shuffle className="w-4 h-4" />
                                    Batch
                                </div>
                            }>
                                <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl">
                                    <CardBody className="p-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-semibold text-white">Batch Processing</h3>
                                                <Button
                                                    onPress={addBatchInput}
                                                    variant="flat"
                                                    size="sm"
                                                    className="bg-white/10 text-white border border-white/20"
                                                >
                                                    Add Input
                                                </Button>
                                            </div>

                                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                                {state.batchInputs.map((input, index) => (
                                                    <div key={input.id} className="p-4 bg-white/5 rounded-lg border border-white/20">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className="text-white font-medium">Input {index + 1}</span>
                                                            {state.batchInputs.length > 1 && (
                                                                <Button
                                                                    onPress={() => removeBatchInput(input.id)}
                                                                    isIconOnly
                                                                    variant="flat"
                                                                    size="sm"
                                                                    className="bg-red-500/20 text-red-300 border border-red-500/30"
                                                                >
                                                                    <Clear className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Input
                                                                value={input.text}
                                                                onValueChange={(value) => updateBatchInput(input.id, "text", value)}
                                                                placeholder="Text to process..."
                                                                classNames={{
                                                                    input: "bg-white/5 text-white placeholder:text-white/50",
                                                                    inputWrapper: "bg-white/5 border border-white/20"
                                                                }}
                                                            />
                                                            <Input
                                                                type={state.showKey ? "text" : "password"}
                                                                value={input.key}
                                                                onValueChange={(value) => updateBatchInput(input.id, "key", value)}
                                                                placeholder="Key (optional, uses global key if empty)..."
                                                                classNames={{
                                                                    input: "bg-white/5 text-white placeholder:text-white/50",
                                                                    inputWrapper: "bg-white/5 border border-white/20"
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
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
                                            <h3 className="text-lg font-semibold text-white">File Encryption</h3>
                                            <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center">
                                                <FileUpload className="w-12 h-12 text-white/50 mx-auto mb-4" />
                                                <p className="text-white/70 mb-4">Drag and drop a file or click to browse</p>
                                                <Button
                                                    onPress={() => fileInputRef.current?.click()}
                                                    color="primary"
                                                    className="bg-gradient-to-r from-cyan-500 to-blue-500"
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

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <Button
                                onPress={state.activeTab === "batch" ? processBatch : processText}
                                color="primary"
                                size="lg"
                                className="bg-gradient-to-r from-cyan-500 to-blue-500 flex-1"
                                startContent={state.mode === "encrypt" ? <Lock className="w-5 h-5" /> : <LockOpen className="w-5 h-5" />}
                                isDisabled={!state.text.trim() || !state.key.trim()}
                            >
                                {state.mode === "encrypt" ? "Encrypt" : "Decrypt"}
                                {state.activeTab === "batch" && " Batch"}
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
                        {state.result && (
                            <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl">
                                <CardBody className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-white">
                                                {state.mode === "encrypt" ? "Encrypted Text" : "Decrypted Text"}
                                            </h3>
                                            <div className="flex gap-2">
                                                <Chip variant="flat" className="bg-white/20 text-white">
                                                    {state.result.length} characters
                                                </Chip>
                                                <Button
                                                    onPress={() => copyToClipboard(state.result, "result")}
                                                    isIconOnly
                                                    variant="flat"
                                                    size="sm"
                                                    className={`${state.copied === "result"
                                                            ? "bg-green-500/20 text-green-300"
                                                            : "bg-white/10 text-white/70"
                                                        } border border-white/20`}
                                                >
                                                    {state.copied === "result" ?
                                                        <CheckCircle className="w-4 h-4" /> :
                                                        <ContentCopy className="w-4 h-4" />
                                                    }
                                                </Button>
                                            </div>
                                        </div>

                                        <Textarea
                                            value={state.result}
                                            isReadOnly
                                            minRows={6}
                                            maxRows={12}
                                            classNames={{
                                                base: "w-full",
                                                input: "bg-black/20 text-green-300 font-mono",
                                                inputWrapper: "bg-black/20 border border-white/20"
                                            }}
                                        />

                                        <div className="flex items-center justify-between text-sm text-white/70">
                                            <span>Algorithm: {state.algorithm}</span>
                                            <span>Mode: {state.mode.toUpperCase()}</span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Right Column - Sidebar */}
                <div className="bg-black/10 backdrop-blur-lg border border-white/20 rounded-lg p-6 transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] hover:border-white/30">
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
                                        History ({state.history.length})
                                    </Button>
                                    <Button
                                        onPress={onInfoOpen}
                                        variant="flat"
                                        className="w-full bg-white/10 text-white border border-white/20 justify-start"
                                        startContent={<Info className="w-4 h-4" />}
                                    >
                                        Algorithm Info
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

                        {/* Current Algorithm Info */}
                        <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl">
                            <CardBody className="p-4">
                                <h3 className="text-lg font-semibold text-white mb-4">Current Algorithm</h3>
                                {(() => {
                                    const algo = algorithms.find(a => a.value === state.algorithm);
                                    return algo ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-white font-medium">{algo.label}</span>
                                                {algo.recommended ? (
                                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                                ) : (
                                                    <Warning className="w-5 h-5 text-yellow-400" />
                                                )}
                                            </div>
                                            <p className="text-white/70 text-sm">{algo.description}</p>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-white/60 text-sm">Security:</span>
                                                    <Chip size="sm" color={getSecurityColor(algo.security)} variant="flat">
                                                        {algo.security}
                                                    </Chip>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-white/60 text-sm">Speed:</span>
                                                    <span className="text-white/80 text-sm">{algo.speed}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-white/60 text-sm">Key Length:</span>
                                                    <span className="text-white/80 text-sm">{algo.keyLength.join(', ')} bytes</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null;
                                })()}
                            </CardBody>
                        </Card>

                        {/* Security Tips */}
                        <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl">
                            <CardBody className="p-4">
                                <h3 className="text-lg font-semibold text-white mb-4">Security Tips</h3>
                                <div className="space-y-3 text-sm text-white/70">
                                    <div className="flex items-start gap-2">
                                        <Security className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                        <span>Use AES for maximum security and compatibility</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Key className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <span>Generate strong, random keys of appropriate length</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Warning className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                        <span>Never share encryption keys over insecure channels</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Lock className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                        <span>Store keys securely and use key derivation for passwords</span>
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
                                    <History className="w-5 h-5" />
                                    Crypto History ({state.history.length})
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
                                                    <div className="flex items-center gap-2">
                                                        <Chip size="sm" variant="flat" className={
                                                            item.mode === "encrypt"
                                                                ? "bg-green-500/20 text-green-300"
                                                                : "bg-red-500/20 text-red-300"
                                                        }>
                                                            {item.mode.toUpperCase()}
                                                        </Chip>
                                                        <Chip size="sm" variant="flat" className="bg-blue-500/20 text-blue-300">
                                                            {item.algorithm}
                                                        </Chip>
                                                    </div>
                                                    <span className="text-sm text-white/70">
                                                        {item.timestamp.toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-white text-sm truncate mb-1">
                                                    Input: {item.input.substring(0, 80)}
                                                    {item.input.length > 80 && '...'}
                                                </p>
                                                <p className="text-white/70 text-sm truncate">
                                                    Output: {item.output.substring(0, 80)}
                                                    {item.output.length > 80 && '...'}
                                                </p>
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
                                    Encryption Algorithms Guide
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                <div className="space-y-6">
                                    <Accordion>
                                        {algorithms.map((algo) => (
                                            <AccordionItem
                                                key={algo.value}
                                                title={
                                                    <div className="flex items-center justify-between w-full">
                                                        <span>{algo.label}</span>
                                                        <div className="flex items-center gap-2">
                                                            <Chip size="sm" color={getSecurityColor(algo.security)} variant="flat">
                                                                {algo.security}
                                                            </Chip>
                                                            {algo.recommended ? (
                                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                                            ) : (
                                                                <Warning className="w-4 h-4 text-yellow-400" />
                                                            )}
                                                        </div>
                                                    </div>
                                                }
                                            >
                                                <div className="space-y-3 text-white/70">
                                                    <p>{algo.description}</p>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <h5 className="font-medium text-white mb-1">Security Level</h5>
                                                            <p className="text-sm">{algo.security}</p>
                                                        </div>
                                                        <div>
                                                            <h5 className="font-medium text-white mb-1">Performance</h5>
                                                            <p className="text-sm">{algo.speed}</p>
                                                        </div>
                                                        <div>
                                                            <h5 className="font-medium text-white mb-1">Key Length</h5>
                                                            <p className="text-sm">{algo.keyLength.join(', ')} bytes</p>
                                                        </div>
                                                        <div>
                                                            <h5 className="font-medium text-white mb-1">Recommended</h5>
                                                            <p className="text-sm">{algo.recommended ? "Yes" : "No"}</p>
                                                        </div>
                                                    </div>
                                                    {!algo.recommended && (
                                                        <div className="p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                                                            <p className="text-yellow-300 text-sm">
                                                                ⚠️ This algorithm is not recommended for new applications due to security concerns.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </AccordionItem>
                                        ))}
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
