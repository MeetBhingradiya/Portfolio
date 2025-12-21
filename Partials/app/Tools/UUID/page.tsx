"use client";

import { Button, Input, Select, SelectItem, Checkbox, Card, CardBody, Tabs, Tab, Chip, Tooltip, Divider } from "@heroui/react";
import React, { useState, useEffect } from "react";
import { v1 as uuidv1, v3 as uuidv3, v4 as uuidv4, v5 as uuidv5, validate, version, NIL } from "uuid";
import { 
    CopyAll, 
    Refresh, 
    Download, 
    Add, 
    Clear, 
    Check,
    Error,
    Info,
    Settings,
    Code,
    Upload
} from "@mui/icons-material";

interface GeneratedUUID {
    id: string;
    value: string;
    version: number;
    timestamp?: Date;
    namespace?: string;
    name?: string;
}

function UUIDGenerator() {
    const [currentUUID, setCurrentUUID] = useState<string>("");
    const [selectedVersion, setSelectedVersion] = useState<string>("4");
    const [generatedUUIDs, setGeneratedUUIDs] = useState<GeneratedUUID[]>([]);
    const [batchCount, setBatchCount] = useState<number>(5);
    const [validationInput, setValidationInput] = useState<string>("");
    const [validationResult, setValidationResult] = useState<{valid: boolean, version?: number} | null>(null);
    
    // v1 options
    const [nodeId, setNodeId] = useState<string>("");
    const [clockSeq, setClockSeq] = useState<string>("");
    
    // v3/v5 options
    const [namespace, setNamespace] = useState<string>(NIL);
    const [name, setName] = useState<string>("");
    
    // Settings
    const [upperCase, setUpperCase] = useState<boolean>(false);
    const [removeDashes, setRemoveDashes] = useState<boolean>(false);
    const [addBraces, setAddBraces] = useState<boolean>(false);

    const predefinedNamespaces = {
        "DNS": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        "URL": "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
        "OID": "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
        "X500": "6ba7b814-9dad-11d1-80b4-00c04fd430c8",
        "NIL": NIL
    };

    const formatUUID = (uuid: string): string => {
        let formatted = uuid;
        if (upperCase) formatted = formatted.toUpperCase();
        if (removeDashes) formatted = formatted.replace(/-/g, "");
        if (addBraces) formatted = `{${formatted}}`;
        return formatted;
    };

    const generateUUID = (): string => {
        let uuid = "";
        const timestamp = new Date();
        
        switch (selectedVersion) {
            case "1":
                const options: any = {};
                if (nodeId) {
                    // Convert hex string to buffer
                    const nodeBuffer = Buffer.from(nodeId.replace(/[^0-9a-f]/gi, "").padEnd(12, "0").substring(0, 12), "hex");
                    options.node = nodeBuffer;
                }
                if (clockSeq) {
                    options.clockseq = parseInt(clockSeq) & 0x3fff;
                }
                uuid = uuidv1(options);
                break;
            case "3":
                if (name) {
                    uuid = uuidv3(name, namespace);
                } else {
                    uuid = uuidv3("default", namespace);
                }
                break;
            case "4":
                uuid = uuidv4();
                break;
            case "5":
                if (name) {
                    uuid = uuidv5(name, namespace);
                } else {
                    uuid = uuidv5("default", namespace);
                }
                break;
            case "nil":
                uuid = NIL;
                break;
            default:
                uuid = uuidv4();
        }

        const newUUID: GeneratedUUID = {
            id: Date.now().toString(),
            value: formatUUID(uuid),
            version: selectedVersion === "nil" ? 0 : parseInt(selectedVersion),
            timestamp,
            namespace: selectedVersion === "3" || selectedVersion === "5" ? namespace : undefined,
            name: selectedVersion === "3" || selectedVersion === "5" ? name : undefined
        };

        setCurrentUUID(newUUID.value);
        setGeneratedUUIDs(prev => [newUUID, ...prev.slice(0, 49)]); // Keep last 50
        
        return newUUID.value;
    };

    const generateBatch = () => {
        const batch: GeneratedUUID[] = [];
        for (let i = 0; i < batchCount; i++) {
            generateUUID();
        }
    };

    const validateUUID = (uuid: string) => {
        if (!uuid.trim()) {
            setValidationResult(null);
            return;
        }
        
        const isValid = validate(uuid);
        if (isValid) {
            const uuidVersion = version(uuid);
            setValidationResult({ valid: true, version: uuidVersion });
        } else {
            setValidationResult({ valid: false });
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const exportUUIDs = () => {
        const data = {
            generated: new Date().toISOString(),
            settings: {
                version: selectedVersion,
                upperCase,
                removeDashes,
                addBraces
            },
            uuids: generatedUUIDs
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `uuids-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const clearHistory = () => {
        setGeneratedUUIDs([]);
    };

    useEffect(() => {
        generateUUID();
    }, []);

    useEffect(() => {
        if (currentUUID) {
            const formatted = formatUUID(currentUUID.replace(/[{}]/g, "").replace(/[^0-9a-f-]/gi, ""));
            setCurrentUUID(formatted);
        }
    }, [upperCase, removeDashes, addBraces]);

    useEffect(() => {
        validateUUID(validationInput);
    }, [validationInput]);

    return (
        <div className="flex flex-col items-center w-full max-w-6xl mx-auto px-4 py-6 pt-45 min-h-max pb-16">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="text-4xl font-bold mb-2 text-white">
                    🔑 UUID Generator & Tools
                </div>
                <div className="text-base text-gray-400 mb-6 max-w-2xl">
                    Generate, validate, and manage Universally Unique Identifiers with support for all UUID versions
                </div>
            </div>

            <div className="w-full grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main Generator */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Current UUID Display */}
                    <Card className="bg-black/10 backdrop-blur-lg border border-white/20">
                        <CardBody className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Code className="text-blue-400" />
                                <h3 className="text-xl font-semibold text-white">Generated UUID</h3>
                                <Chip 
                                    size="sm" 
                                    variant="flat" 
                                    color="primary"
                                    className="ml-auto"
                                >
                                    v{selectedVersion === "nil" ? "0" : selectedVersion}
                                </Chip>
                            </div>
                            
                            <div className="bg-gray-900 rounded-lg p-4 mb-4">
                                <div className="font-mono text-lg text-white break-all select-all">
                                    {currentUUID || "Click generate to create a UUID"}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button
                                    color="primary"
                                    variant="shadow"
                                    startContent={<Refresh />}
                                    onPress={generateUUID}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600"
                                >
                                    Generate New
                                </Button>
                                
                                <Button
                                    variant="bordered"
                                    startContent={<CopyAll />}
                                    onPress={() => copyToClipboard(currentUUID)}
                                    isDisabled={!currentUUID}
                                >
                                    Copy
                                </Button>
                                
                                <Button
                                    variant="bordered"
                                    startContent={<Add />}
                                    onPress={generateBatch}
                                >
                                    Generate {batchCount}
                                </Button>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Tabs for different functions */}
                    <Card className="bg-black/10 backdrop-blur-lg border border-white/20">
                        <CardBody className="p-6">
                            <Tabs 
                                aria-label="UUID Tools"
                                variant="underlined"
                                classNames={{
                                    tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                                    cursor: "w-full bg-blue-500",
                                    tab: "max-w-fit px-0 h-12",
                                    tabContent: "group-data-[selected=true]:text-blue-400"
                                }}
                            >
                                <Tab key="generator" title="Generator Settings">
                                    <div className="space-y-4 mt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Select
                                                label="UUID Version"
                                                selectedKeys={[selectedVersion]}
                                                onSelectionChange={(keys) => setSelectedVersion(Array.from(keys)[0] as string)}
                                                variant="bordered"
                                                className="bg-white/5"
                                            >
                                                <SelectItem key="1">v1 - Timestamp + MAC</SelectItem>
                                                <SelectItem key="3">v3 - MD5 + Namespace</SelectItem>
                                                <SelectItem key="4">v4 - Random</SelectItem>
                                                <SelectItem key="5">v5 - SHA-1 + Namespace</SelectItem>
                                                <SelectItem key="nil">NIL - All zeros</SelectItem>
                                            </Select>

                                            <Input
                                                type="number"
                                                label="Batch Count"
                                                value={batchCount.toString()}
                                                onChange={(e) => setBatchCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                                                variant="bordered"
                                                className="bg-white/5"
                                                min={1}
                                                max={100}
                                            />
                                        </div>

                                        {/* Version-specific options */}
                                        {selectedVersion === "1" && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input
                                                    label="Node ID (MAC Address)"
                                                    placeholder="01:23:45:67:89:ab"
                                                    value={nodeId}
                                                    onChange={(e) => setNodeId(e.target.value)}
                                                    variant="bordered"
                                                    className="bg-white/5"
                                                    description="Leave empty for random"
                                                />
                                                <Input
                                                    type="number"
                                                    label="Clock Sequence"
                                                    placeholder="0-16383"
                                                    value={clockSeq}
                                                    onChange={(e) => setClockSeq(e.target.value)}
                                                    variant="bordered"
                                                    className="bg-white/5"
                                                    description="Leave empty for random"
                                                />
                                            </div>
                                        )}

                                        {(selectedVersion === "3" || selectedVersion === "5") && (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Select
                                                        label="Namespace"
                                                        selectedKeys={[namespace]}
                                                        onSelectionChange={(keys) => setNamespace(Array.from(keys)[0] as string)}
                                                        variant="bordered"
                                                        className="bg-white/5"
                                                    >
                                                        {Object.entries(predefinedNamespaces).map(([key, value]) => (
                                                            <SelectItem key={value}>{key}</SelectItem>
                                                        ))}
                                                    </Select>
                                                    
                                                    <Input
                                                        label="Custom Namespace"
                                                        placeholder="Custom UUID namespace"
                                                        value={namespace}
                                                        onChange={(e) => setNamespace(e.target.value)}
                                                        variant="bordered"
                                                        className="bg-white/5"
                                                    />
                                                </div>
                                                
                                                <Input
                                                    label="Name"
                                                    placeholder="Enter name to hash"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    variant="bordered"
                                                    className="bg-white/5"
                                                    description="The string to be hashed with the namespace"
                                                />
                                            </div>
                                        )}

                                        <Divider />

                                        {/* Format Options */}
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-300 mb-3">Output Format</h4>
                                            <div className="flex flex-wrap gap-4">
                                                <Checkbox
                                                    isSelected={upperCase}
                                                    onValueChange={setUpperCase}
                                                >
                                                    Uppercase
                                                </Checkbox>
                                                <Checkbox
                                                    isSelected={removeDashes}
                                                    onValueChange={setRemoveDashes}
                                                >
                                                    Remove Dashes
                                                </Checkbox>
                                                <Checkbox
                                                    isSelected={addBraces}
                                                    onValueChange={setAddBraces}
                                                >
                                                    Add Braces
                                                </Checkbox>
                                            </div>
                                        </div>
                                    </div>
                                </Tab>

                                <Tab key="validator" title="Validator">
                                    <div className="space-y-4 mt-4">
                                        <Input
                                            label="UUID to Validate"
                                            placeholder="Enter UUID to validate"
                                            value={validationInput}
                                            onChange={(e) => setValidationInput(e.target.value)}
                                            variant="bordered"
                                            className="bg-white/5"
                                            endContent={
                                                validationResult && (
                                                    <div className="flex items-center">
                                                        {validationResult.valid ? (
                                                            <Check className="text-green-500" />
                                                        ) : (
                                                            <Error className="text-red-500" />
                                                        )}
                                                    </div>
                                                )
                                            }
                                        />
                                        
                                        {validationResult && (
                                            <Card className={`${validationResult.valid ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                                <CardBody className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        {validationResult.valid ? (
                                                            <>
                                                                <Check className="text-green-500" />
                                                                <span className="text-green-400 font-medium">Valid UUID</span>
                                                                {validationResult.version && (
                                                                    <Chip size="sm" color="success" variant="flat">
                                                                        Version {validationResult.version}
                                                                    </Chip>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Error className="text-red-500" />
                                                                <span className="text-red-400 font-medium">Invalid UUID</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        )}
                                    </div>
                                </Tab>

                                <Tab key="bulk" title="Bulk Operations">
                                    <div className="space-y-4 mt-4">
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                variant="bordered"
                                                startContent={<Download />}
                                                onPress={exportUUIDs}
                                                isDisabled={generatedUUIDs.length === 0}
                                            >
                                                Export JSON
                                            </Button>
                                            
                                            <Button
                                                variant="bordered"
                                                startContent={<Clear />}
                                                onPress={clearHistory}
                                                color="danger"
                                                isDisabled={generatedUUIDs.length === 0}
                                            >
                                                Clear History
                                            </Button>

                                            <Button
                                                variant="bordered"
                                                startContent={<CopyAll />}
                                                onPress={() => copyToClipboard(generatedUUIDs.map(u => u.value).join('\n'))}
                                                isDisabled={generatedUUIDs.length === 0}
                                            >
                                                Copy All
                                            </Button>
                                        </div>

                                        <div className="text-sm text-gray-400">
                                            Total Generated: {generatedUUIDs.length}
                                        </div>
                                    </div>
                                </Tab>
                            </Tabs>
                        </CardBody>
                    </Card>
                </div>

                {/* History Panel */}
                <div className="space-y-6">
                    <Card className="bg-black/10 backdrop-blur-lg border border-white/20">
                        <CardBody className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">Recent UUIDs</h3>
                                <Chip size="sm" variant="flat">
                                    {generatedUUIDs.length}
                                </Chip>
                            </div>
                            
                            <div className="space-y-2 max-h-96 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                                {generatedUUIDs.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <Info className="mx-auto text-4xl mb-2 opacity-50" />
                                        <p>No UUIDs generated yet</p>
                                    </div>
                                ) : (
                                    generatedUUIDs.map((uuid) => (
                                        <div
                                            key={uuid.id}
                                            className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all duration-200 group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-mono text-xs text-white truncate select-all">
                                                        {uuid.value}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Chip size="sm" variant="flat" color="primary">
                                                            v{uuid.version}
                                                        </Chip>
                                                        <span className="text-xs text-gray-400">
                                                            {uuid.timestamp?.toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Tooltip content="Copy UUID">
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        onPress={() => copyToClipboard(uuid.value)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <CopyAll className="text-gray-400" />
                                                    </Button>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Info Panel */}
                    <Card className="bg-black/10 backdrop-blur-lg border border-white/20">
                        <CardBody className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">UUID Versions</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <div className="text-blue-400 font-medium">Version 1</div>
                                    <div className="text-gray-400">Timestamp + MAC address based</div>
                                </div>
                                <div>
                                    <div className="text-green-400 font-medium">Version 3</div>
                                    <div className="text-gray-400">MD5 hash + namespace based</div>
                                </div>
                                <div>
                                    <div className="text-purple-400 font-medium">Version 4</div>
                                    <div className="text-gray-400">Random or pseudo-random</div>
                                </div>
                                <div>
                                    <div className="text-orange-400 font-medium">Version 5</div>
                                    <div className="text-gray-400">SHA-1 hash + namespace based</div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default UUIDGenerator;
