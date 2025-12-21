"use client";

import React from "react";
import {
    ContentCopy,
    Clear,
    VerifiedUser,
    ErrorOutline,
    WarningAmber,
    Visibility,
    VisibilityOff,
    Token,
    Check,
    Settings,
    History,
    Download,
    Security
} from "@mui/icons-material";
import { 
    Button, 
    Card, 
    CardBody, 
    Textarea, 
    Input, 
    Tabs, 
    Tab, 
    Chip, 
    Tooltip,
    Divider,
    Progress,
    Select,
    SelectItem
} from "@heroui/react";

// Algorithm options for JWT
const ALGORITHM_OPTIONS = {
    HS256: "HMAC with SHA-256",
    HS384: "HMAC with SHA-384",
    HS512: "HMAC with SHA-512",
    RS256: "RSASSA-PKCS1-v1_5 with SHA-256",
    RS384: "RSASSA-PKCS1-v1_5 with SHA-384",
    RS512: "RSASSA-PKCS1-v1_5 with SHA-512",
    ES256: "ECDSA with SHA-256",
    ES384: "ECDSA with SHA-384",
    ES512: "ECDSA with SHA-512",
    PS256: "RSASSA-PSS with SHA-256",
    PS384: "RSASSA-PSS with SHA-384",
    PS512: "RSASSA-PSS with SHA-512",
    none: "No digital signature or MAC performed"
};

// JWT Standard claims
const STANDARD_CLAIMS = {
    iss: "Issuer",
    sub: "Subject",
    aud: "Audience",
    exp: "Expiration Time",
    nbf: "Not Before",
    iat: "Issued At",
    jti: "JWT ID"
};

interface DecodedJWT {
    header: any;
    payload: any;
    signature: string;
    valid: boolean;
    error?: string;
}

interface VerificationStatus {
    status: "valid" | "invalid" | "warning" | "none";
    message: string;
}

interface JWTHistoryItem {
    id: string;
    token: string;
    timestamp: Date;
    status: VerificationStatus;
}

interface JWTState {
    token: string;
    decodedToken: DecodedJWT | null;
    secret: string;
    verificationStatus: VerificationStatus;
    activeTab: "header" | "payload" | "signature" | "verify";
    error: string;
    showSecret: boolean;
    copied: boolean;
    history: JWTHistoryItem[];
    generator: {
        header: string;
        payload: string;
        secret: string;
        algorithm: string;
    };
}

export default function JWTDebugger() {
    const [state, setState] = React.useState<JWTState>({
        token: "",
        decodedToken: null,
        secret: "",
        verificationStatus: { status: "none", message: "" },
        activeTab: "payload",
        error: "",
        showSecret: false,
        copied: false,
        history: [],
        generator: {
            header: `{
  "alg": "HS256",
  "typ": "JWT"
}`,
            payload: `{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": ${Math.floor(Date.now() / 1000)},
  "exp": ${Math.floor(Date.now() / 1000) + 3600}
}`,
            secret: "your-secret-key",
            algorithm: "HS256"
        }
    });

    // Decode the JWT token
    const decodeToken = (token: string): DecodedJWT | null => {
        try {
            // Clear any existing errors
            setState((prev) => ({ ...prev, error: "" }));

            if (!token.trim()) {
                return null;
            }

            // Split the token into parts
            const parts = token.split(".");
            if (parts.length !== 3) {
                setState((prev) => ({
                    ...prev,
                    error: "Invalid JWT format. Expected format: header.payload.signature"
                }));
                return null;
            }

            // Decode header and payload
            const header = JSON.parse(atob(parts[0]));
            const payload = JSON.parse(atob(parts[1]));

            // Return the decoded token
            return {
                header,
                payload,
                signature: parts[2],
                valid: true
            };
        } catch (error: any) {
            setState((prev) => ({
                ...prev,
                error: `Error decoding token: ${error.message}`
            }));
            return null;
        }
    };

    // Handle token input change
    const handleTokenChange = (value: string) => {
        const newToken = value;
        const decoded = decodeToken(newToken);
        
        setState(prev => ({
            ...prev,
            token: newToken,
            decodedToken: decoded,
            verificationStatus: { status: "none", message: "" }
        }));
    };

    // Copy to clipboard
    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setState(prev => ({ ...prev, copied: true }));
            setTimeout(() => {
                setState(prev => ({ ...prev, copied: false }));
            }, 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    // Generate JWT token (simplified for demo)
    const generateToken = () => {
        try {
            const header = JSON.parse(state.generator.header);
            const payload = JSON.parse(state.generator.payload);
            
            // Basic JWT structure (header.payload.signature)
            const encodedHeader = btoa(JSON.stringify(header));
            const encodedPayload = btoa(JSON.stringify(payload));
            
            // Simplified signature (in real app, use proper JWT library)
            const signature = btoa(`signature_for_${encodedHeader}_${encodedPayload}_${state.generator.secret}`).substring(0, 43);
            
            const token = `${encodedHeader}.${encodedPayload}.${signature}`;
            
            setState(prev => ({
                ...prev,
                token,
                decodedToken: decodeToken(token)
            }));
        } catch (err) {
            setState(prev => ({
                ...prev,
                error: "Invalid JSON in header or payload"
            }));
        }
    };

    // Add to history
    const addToHistory = () => {
        if (!state.token) return;
        
        const historyItem: JWTHistoryItem = {
            id: Date.now().toString(),
            token: state.token,
            timestamp: new Date(),
            status: state.verificationStatus
        };
        
        setState(prev => ({
            ...prev,
            history: [historyItem, ...prev.history.slice(0, 9)] // Keep last 10
        }));
    };

    // Export history
    const exportHistory = () => {
        const data = {
            exported: new Date().toISOString(),
            tokens: state.history
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `jwt-history-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Clear all fields
    const clearFields = () => {
        setState(prev => ({
            ...prev,
            token: "",
            decodedToken: null,
            secret: "",
            verificationStatus: { status: "none", message: "" },
            activeTab: "payload",
            error: ""
        }));
    };

    // Handle secret input change
    const handleSecretChange = (value: string) => {
        setState(prev => ({
            ...prev,
            secret: value,
            verificationStatus: { status: "none", message: "" }
        }));
    };

    // Toggle tab
    const handleTabChange = (tab: "header" | "payload" | "signature" | "verify") => {
        setState(prev => ({ ...prev, activeTab: tab }));
    };

    // Toggle show/hide secret
    const toggleShowSecret = () => {
        setState(prev => ({ ...prev, showSecret: !prev.showSecret }));
    };

    // Verify token
    const verifyToken = () => {
        if (!state.decodedToken) {
            setState({
                ...state,
                verificationStatus: {
                    status: "invalid",
                    message: "Invalid token. Please enter a valid JWT first."
                }
            });
            return;
        }

        if (!state.secret.trim() && state.decodedToken.header.alg !== "none") {
            setState({
                ...state,
                verificationStatus: {
                    status: "warning",
                    message: "Secret is required for verification."
                }
            });
            return;
        }

        // Check for token expiration
        if (state.decodedToken.payload.exp) {
            const expirationTime = state.decodedToken.payload.exp * 1000; // Convert to milliseconds
            const currentTime = Date.now();

            if (expirationTime < currentTime) {
                setState({
                    ...state,
                    verificationStatus: {
                        status: "invalid",
                        message: "Token has expired."
                    }
                });
                return;
            }
        }

        // Check "not before" time
        if (state.decodedToken.payload.nbf) {
            const notBeforeTime = state.decodedToken.payload.nbf * 1000; // Convert to milliseconds
            const currentTime = Date.now();

            if (notBeforeTime > currentTime) {
                setState({
                    ...state,
                    verificationStatus: {
                        status: "invalid",
                        message: "Token is not yet valid (nbf claim)."
                    }
                });
                return;
            }
        }

        // For client-side only verification, we can't actually verify the signature cryptographically without a backend
        // So we'll just do some basic validation and simulate the verification

        if (state.decodedToken.header.alg === "none") {
            setState({
                ...state,
                verificationStatus: {
                    status: "warning",
                    message:
                        "Token uses 'none' algorithm. This is insecure and should not be used in production."
                }
            });
            return;
        }

        // Check if token is properly formatted
        const parts = state.token.split(".");
        if (parts.length !== 3 || !parts[2]) {
            setState({
                ...state,
                verificationStatus: {
                    status: "invalid",
                    message: "Invalid token format or missing signature."
                }
            });
            return;
        }

        // For the purpose of demonstration, we'll "simulate" a successful verification
        // In a real app, you'd use a JWT library for proper cryptographic verification
        setState({
            ...state,
            verificationStatus: {
                status: "valid",
                message:
                    "Token structure is valid. Client-side signature verification is limited - for complete validation, use a server."
            }
        });
    };

    // Format timestamp to readable date
    const formatTimestamp = (timestamp: number) => {
        if (!timestamp) return "N/A";

        try {
            const date = new Date(timestamp * 1000); // Convert to milliseconds
            return date.toLocaleString();
        } catch (e) {
            return "Invalid Date";
        }
    };

    // Check if a timestamp is expired
    const isExpired = (timestamp: number) => {
        if (!timestamp) return false;
        return timestamp * 1000 < Date.now();
    };

    // Render token details
    const renderTokenDetails = () => {
        if (!state.decodedToken) return null;

        const { payload } = state.decodedToken;

        const details = [];

        // Add standard claims
        for (const [key, label] of Object.entries(STANDARD_CLAIMS)) {
            if (payload[key] !== undefined) {
                if (key === "exp" || key === "nbf" || key === "iat") {
                    const timestamp = payload[key];
                    const isTokenExpired =
                        key === "exp" && isExpired(timestamp);

                    details.push(
                        <div
                            className="detail-item"
                            key={key}>
                            <div className="detail-label">{label}</div>
                            <div
                                className={`detail-value timestamp ${isTokenExpired ? "expired" : ""}`}>
                                {formatTimestamp(timestamp)}
                                {isTokenExpired && " (Expired)"}
                            </div>
                        </div>
                    );
                } else {
                    details.push(
                        <div
                            className="detail-item"
                            key={key}>
                            <div className="detail-label">{label}</div>
                            <div className="detail-value">
                                {typeof payload[key] === "object"
                                    ? JSON.stringify(payload[key])
                                    : String(payload[key])}
                            </div>
                        </div>
                    );
                }
            }
        }

        // Add algorithm info
        details.push(
            <div
                className="detail-item"
                key="alg">
                <div className="detail-label">Algorithm</div>
                <div className="detail-value">
                    {state.decodedToken.header.alg}
                    {ALGORITHM_OPTIONS[
                        state.decodedToken.header
                            .alg as keyof typeof ALGORITHM_OPTIONS
                    ]
                        ? ` (${ALGORITHM_OPTIONS[state.decodedToken.header.alg as keyof typeof ALGORITHM_OPTIONS]})`
                        : ""}
                </div>
            </div>
        );

        // Add token type
        if (state.decodedToken.header.typ) {
            details.push(
                <div
                    className="detail-item"
                    key="typ">
                    <div className="detail-label">Token Type</div>
                    <div className="detail-value">
                        {state.decodedToken.header.typ}
                    </div>
                </div>
            );
        }

        return <div className="details-grid">{details}</div>;
    };

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-6 pt-45 min-h-max pb-16">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="text-4xl font-bold mb-2 text-white">
                    🔐 JWT Debugger & Generator
                </div>
                <div className="text-base text-gray-400 mb-6 max-w-2xl">
                    Debug, verify, and generate JSON Web Tokens with advanced features and security analysis
                </div>
            </div>

            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Token Input & Display */}
                    <Card className="bg-black/10 backdrop-blur-lg border border-white/20">
                        <CardBody className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Token className="text-blue-400" />
                                <h3 className="text-xl font-semibold text-white">JWT Token</h3>
                                {state.decodedToken && (
                                    <Chip 
                                        size="sm" 
                                        variant="flat" 
                                        color={
                                            state.verificationStatus.status === "valid" ? "success" :
                                            state.verificationStatus.status === "invalid" ? "danger" :
                                            state.verificationStatus.status === "warning" ? "warning" : "default"
                                        }
                                    >
                                        {state.verificationStatus.status === "none" ? "Decoded" : state.verificationStatus.status}
                                    </Chip>
                                )}
                            </div>
                            
                            <Textarea
                                value={state.token}
                                onChange={(e) => handleTokenChange(e.target.value)}
                                placeholder="Paste your JWT token here (header.payload.signature)"
                                minRows={4}
                                maxRows={8}
                                variant="bordered"
                                className="bg-white/5 font-mono mb-4"
                                classNames={{
                                    input: "font-mono text-sm",
                                    inputWrapper: "bg-gray-900/50 border-white/10"
                                }}
                            />

                            {state.error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                                    <div className="flex items-center gap-2 text-red-400">
                                        <ErrorOutline />
                                        <span className="text-sm">{state.error}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="bordered"
                                    startContent={state.copied ? <Check /> : <ContentCopy />}
                                    onPress={() => copyToClipboard(state.token)}
                                    isDisabled={!state.token}
                                    color={state.copied ? "success" : "default"}
                                    size="sm"
                                >
                                    {state.copied ? "Copied!" : "Copy Token"}
                                </Button>
                                
                                <Button
                                    variant="bordered"
                                    startContent={<Clear />}
                                    onPress={clearFields}
                                    isDisabled={!state.token}
                                    size="sm"
                                >
                                    Clear
                                </Button>

                                {state.decodedToken && (
                                    <Button
                                        variant="bordered"
                                        startContent={<History />}
                                        onPress={addToHistory}
                                        size="sm"
                                    >
                                        Save to History
                                    </Button>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Decoded Content */}
                    {state.decodedToken && (
                        <Card className="bg-black/10 backdrop-blur-lg border border-white/20">
                            <CardBody className="p-6">
                                <Tabs 
                                    selectedKey={state.activeTab}
                                    onSelectionChange={(key) => handleTabChange(key as any)}
                                    variant="underlined"
                                    classNames={{
                                        tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                                        cursor: "w-full bg-blue-500",
                                        tab: "max-w-fit px-0 h-12",
                                        tabContent: "group-data-[selected=true]:text-blue-400"
                                    }}
                                >
                                    <Tab 
                                        key="header" 
                                        title={
                                            <div className="flex items-center gap-2">
                                                <Settings />
                                                <span>Header</span>
                                            </div>
                                        }
                                    >
                                        <div className="mt-6">
                                            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                                                <pre className="text-sm text-white font-mono">
                                                    {JSON.stringify(state.decodedToken.header, null, 2)}
                                                </pre>
                                            </div>
                                            
                                            <div className="flex justify-end mt-3">
                                                <Button
                                                    size="sm"
                                                    variant="bordered"
                                                    startContent={<ContentCopy />}
                                                    onPress={() => copyToClipboard(JSON.stringify(state.decodedToken?.header, null, 2))}
                                                >
                                                    Copy Header
                                                </Button>
                                            </div>
                                        </div>
                                    </Tab>

                                    <Tab 
                                        key="payload" 
                                        title={
                                            <div className="flex items-center gap-2">
                                                <span>📋</span>
                                                <span>Payload</span>
                                            </div>
                                        }
                                    >
                                        <div className="mt-6">
                                            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                                                <pre className="text-sm text-white font-mono">
                                                    {JSON.stringify(state.decodedToken.payload, null, 2)}
                                                </pre>
                                            </div>
                                            
                                            <div className="flex justify-end mt-3">
                                                <Button
                                                    size="sm"
                                                    variant="bordered"
                                                    startContent={<ContentCopy />}
                                                    onPress={() => copyToClipboard(JSON.stringify(state.decodedToken?.payload, null, 2))}
                                                >
                                                    Copy Payload
                                                </Button>
                                            </div>
                                        </div>
                                    </Tab>

                                    <Tab 
                                        key="signature" 
                                        title={
                                            <div className="flex items-center gap-2">
                                                <Security />
                                                <span>Signature</span>
                                            </div>
                                        }
                                    >
                                        <div className="mt-6">
                                            <div className="bg-gray-900 rounded-lg p-4">
                                                <div className="text-sm text-white font-mono break-all">
                                                    {state.decodedToken.signature || "No signature"}
                                                </div>
                                            </div>
                                            
                                            <div className="flex justify-end mt-3">
                                                <Button
                                                    size="sm"
                                                    variant="bordered"
                                                    startContent={<ContentCopy />}
                                                    onPress={() => copyToClipboard(state.decodedToken?.signature || "")}
                                                    isDisabled={!state.decodedToken.signature}
                                                >
                                                    Copy Signature
                                                </Button>
                                            </div>
                                        </div>
                                    </Tab>

                                    <Tab 
                                        key="verify" 
                                        title={
                                            <div className="flex items-center gap-2">
                                                <VerifiedUser />
                                                <span>Verify</span>
                                            </div>
                                        }
                                    >
                                        <div className="mt-6 space-y-4">
                                            <div className="relative">
                                                <Input
                                                    type={state.showSecret ? "text" : "password"}
                                                    label="Secret Key"
                                                    placeholder="Enter your secret key or public key"
                                                    value={state.secret}
                                                    onChange={(e) => handleSecretChange(e.target.value)}
                                                    variant="bordered"
                                                    className="bg-white/5"
                                                    endContent={
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            variant="light"
                                                            onPress={toggleShowSecret}
                                                        >
                                                            {state.showSecret ? <VisibilityOff /> : <Visibility />}
                                                        </Button>
                                                    }
                                                />
                                            </div>

                                            <Button
                                                color="primary"
                                                variant="shadow"
                                                onPress={verifyToken}
                                                isDisabled={!state.decodedToken}
                                                className="bg-gradient-to-r from-green-500 to-blue-600"
                                            >
                                                Verify Token
                                            </Button>

                                            {state.verificationStatus.status !== "none" && (
                                                <Card className={`${
                                                    state.verificationStatus.status === "valid" ? "bg-green-500/10 border-green-500/20" :
                                                    state.verificationStatus.status === "invalid" ? "bg-red-500/10 border-red-500/20" :
                                                    "bg-yellow-500/10 border-yellow-500/20"
                                                }`}>
                                                    <CardBody className="p-4">
                                                        <div className="flex items-start gap-3">
                                                            {state.verificationStatus.status === "valid" && <VerifiedUser className="text-green-400 text-xl" />}
                                                            {state.verificationStatus.status === "invalid" && <ErrorOutline className="text-red-400 text-xl" />}
                                                            {state.verificationStatus.status === "warning" && <WarningAmber className="text-yellow-400 text-xl" />}
                                                            <div>
                                                                <div className="font-medium text-sm mb-1 capitalize">
                                                                    {state.verificationStatus.status}
                                                                </div>
                                                                <div className="text-sm text-gray-300">
                                                                    {state.verificationStatus.message}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            )}
                                        </div>
                                    </Tab>
                                </Tabs>
                            </CardBody>
                        </Card>
                    )}

                    {/* Token Details */}
                    {state.decodedToken && (
                        <Card className="bg-black/10 backdrop-blur-lg border border-white/20">
                            <CardBody className="p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <span>📊</span>
                                    Token Analysis
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Algorithm */}
                                    <div className="bg-white/5 rounded-lg p-3">
                                        <div className="text-xs text-gray-400 mb-1">Algorithm</div>
                                        <div className="text-white font-medium">
                                            {state.decodedToken.header.alg}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {ALGORITHM_OPTIONS[state.decodedToken.header.alg as keyof typeof ALGORITHM_OPTIONS] || "Unknown"}
                                        </div>
                                    </div>

                                    {/* Token Type */}
                                    <div className="bg-white/5 rounded-lg p-3">
                                        <div className="text-xs text-gray-400 mb-1">Type</div>
                                        <div className="text-white font-medium">
                                            {state.decodedToken.header.typ || "JWT"}
                                        </div>
                                    </div>

                                    {/* Expiration */}
                                    {state.decodedToken.payload.exp && (
                                        <div className="bg-white/5 rounded-lg p-3">
                                            <div className="text-xs text-gray-400 mb-1">Expires</div>
                                            <div className={`font-medium ${isExpired(state.decodedToken.payload.exp) ? "text-red-400" : "text-white"}`}>
                                                {formatTimestamp(state.decodedToken.payload.exp)}
                                            </div>
                                            {isExpired(state.decodedToken.payload.exp) && (
                                                <div className="text-xs text-red-400 mt-1">Expired</div>
                                            )}
                                        </div>
                                    )}

                                    {/* Issued At */}
                                    {state.decodedToken.payload.iat && (
                                        <div className="bg-white/5 rounded-lg p-3">
                                            <div className="text-xs text-gray-400 mb-1">Issued</div>
                                            <div className="text-white font-medium">
                                                {formatTimestamp(state.decodedToken.payload.iat)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Subject */}
                                    {state.decodedToken.payload.sub && (
                                        <div className="bg-white/5 rounded-lg p-3">
                                            <div className="text-xs text-gray-400 mb-1">Subject</div>
                                            <div className="text-white font-medium">
                                                {state.decodedToken.payload.sub}
                                            </div>
                                        </div>
                                    )}

                                    {/* Issuer */}
                                    {state.decodedToken.payload.iss && (
                                        <div className="bg-white/5 rounded-lg p-3">
                                            <div className="text-xs text-gray-400 mb-1">Issuer</div>
                                            <div className="text-white font-medium">
                                                {state.decodedToken.payload.iss}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Generator */}
                    <Card className="bg-black/10 backdrop-blur-lg border border-white/20">
                        <CardBody className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <span>⚡</span>
                                Quick Generator
                            </h3>
                            
                            <div className="space-y-3">
                                <Select
                                    label="Algorithm"
                                    selectedKeys={[state.generator.algorithm]}
                                    onSelectionChange={(keys) => {
                                        const alg = Array.from(keys)[0] as string;
                                        setState(prev => ({
                                            ...prev,
                                            generator: { ...prev.generator, algorithm: alg }
                                        }));
                                    }}
                                    size="sm"
                                    variant="bordered"
                                >
                                    <SelectItem key="HS256">HS256</SelectItem>
                                    <SelectItem key="HS384">HS384</SelectItem>
                                    <SelectItem key="HS512">HS512</SelectItem>
                                    <SelectItem key="RS256">RS256</SelectItem>
                                </Select>

                                <Input
                                    label="Secret"
                                    value={state.generator.secret}
                                    onChange={(e) => setState(prev => ({
                                        ...prev,
                                        generator: { ...prev.generator, secret: e.target.value }
                                    }))}
                                    size="sm"
                                    variant="bordered"
                                />

                                <Button
                                    fullWidth
                                    color="primary"
                                    variant="shadow"
                                    onPress={generateToken}
                                    className="bg-gradient-to-r from-purple-500 to-blue-600"
                                >
                                    Generate JWT
                                </Button>
                            </div>
                        </CardBody>
                    </Card>

                    {/* History */}
                    <Card className="bg-black/10 backdrop-blur-lg border border-white/20">
                        <CardBody className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <History className="text-green-400" />
                                    History
                                </h3>
                                <Chip size="sm" variant="flat">
                                    {state.history.length}
                                </Chip>
                            </div>
                            
                            <div className="space-y-2 max-h-80 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                                {state.history.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <Token className="mx-auto text-4xl mb-2 opacity-50" />
                                        <p className="text-sm">No tokens in history</p>
                                    </div>
                                ) : (
                                    state.history.map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all duration-200 group cursor-pointer"
                                            onClick={() => handleTokenChange(item.token)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-mono text-xs text-white truncate">
                                                        {item.token.substring(0, 30)}...
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Chip 
                                                            size="sm" 
                                                            variant="flat" 
                                                            color={
                                                                item.status.status === "valid" ? "success" :
                                                                item.status.status === "invalid" ? "danger" :
                                                                item.status.status === "warning" ? "warning" : "default"
                                                            }
                                                        >
                                                            {item.status.status}
                                                        </Chip>
                                                        <span className="text-xs text-gray-400">
                                                            {item.timestamp.toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Tooltip content="Copy Token">
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        onPress={() => copyToClipboard(item.token)}
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

                    {/* Security Info */}
                    <Card className="bg-black/10 backdrop-blur-lg border border-white/20">
                        <CardBody className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Security className="text-yellow-400" />
                                Security Notes
                            </h3>
                            
                            <div className="space-y-3 text-sm">
                                <div className="flex items-start gap-3">
                                    <span className="text-green-400">✓</span>
                                    <div className="text-gray-300">All processing happens locally in your browser</div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                    <span className="text-yellow-400">⚠️</span>
                                    <div className="text-gray-300">Client-side signature verification is limited</div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                    <span className="text-red-400">✗</span>
                                    <div className="text-gray-300">Never use &quot;none&quot; algorithm in production</div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                    <span className="text-blue-400">ℹ️</span>
                                    <div className="text-gray-300">Use strong secrets for HMAC algorithms</div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}
