"use client";

import React, { useState } from "react";
import "@Styles/Tools-EncryptDecrypt.sass";
import {
    ContentCopy,
    Key,
    VpnKey,
    Lock,
    LockOpen,
    Refresh,
    Visibility,
    VisibilityOff
} from "@mui/icons-material";
import { Button } from "@heroui/react";
import CryptoJS from "crypto-js";

type CryptographyMode = "encrypt" | "decrypt";
type Algorithm = "AES" | "DES" | "TripleDES" | "Rabbit" | "RC4";

interface IState {
    mode: CryptographyMode;
    algorithm: Algorithm;
    text: string;
    key: string;
    result: string;
    showKey: boolean;
    copied: boolean;
}

export default function EncryptAndDecrypt() {
    const [state, setState] = useState<IState>({
        mode: "encrypt",
        algorithm: "AES",
        text: "",
        key: "",
        result: "",
        showKey: false,
        copied: false
    });

    const algorithms = [
        { value: "AES", label: "AES (Advanced Encryption Standard)" },
        { value: "DES", label: "DES (Data Encryption Standard)" },
        { value: "TripleDES", label: "TripleDES (3DES)" },
        { value: "Rabbit", label: "Rabbit Stream Cipher" },
        { value: "RC4", label: "RC4 Stream Cipher" }
    ];

    const generateRandomKey = () => {
        const characters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        let result = "";
        const keyLength = state.algorithm === "AES" ? 32 : 16;

        for (let i = 0; i < keyLength; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * characters.length)
            );
        }

        setState({ ...state, key: result });
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
                        result = CryptoJS.AES.encrypt(
                            state.text,
                            state.key
                        ).toString();
                        break;
                    case "DES":
                        result = CryptoJS.DES.encrypt(
                            state.text,
                            state.key
                        ).toString();
                        break;
                    case "TripleDES":
                        result = CryptoJS.TripleDES.encrypt(
                            state.text,
                            state.key
                        ).toString();
                        break;
                    case "Rabbit":
                        result = CryptoJS.Rabbit.encrypt(
                            state.text,
                            state.key
                        ).toString();
                        break;
                    case "RC4":
                        result = CryptoJS.RC4.encrypt(
                            state.text,
                            state.key
                        ).toString();
                        break;
                }
            } else {
                switch (state.algorithm) {
                    case "AES":
                        const bytesAES = CryptoJS.AES.decrypt(
                            state.text,
                            state.key
                        );
                        result = bytesAES.toString(CryptoJS.enc.Utf8);
                        break;
                    case "DES":
                        const bytesDES = CryptoJS.DES.decrypt(
                            state.text,
                            state.key
                        );
                        result = bytesDES.toString(CryptoJS.enc.Utf8);
                        break;
                    case "TripleDES":
                        const bytesTripleDES = CryptoJS.TripleDES.decrypt(
                            state.text,
                            state.key
                        );
                        result = bytesTripleDES.toString(CryptoJS.enc.Utf8);
                        break;
                    case "Rabbit":
                        const bytesRabbit = CryptoJS.Rabbit.decrypt(
                            state.text,
                            state.key
                        );
                        result = bytesRabbit.toString(CryptoJS.enc.Utf8);
                        break;
                    case "RC4":
                        const bytesRC4 = CryptoJS.RC4.decrypt(
                            state.text,
                            state.key
                        );
                        result = bytesRC4.toString(CryptoJS.enc.Utf8);
                        break;
                }

                if (!result) {
                    throw new Error(
                        "Decryption failed - Invalid key or corrupted data"
                    );
                }
            }

            setState({ ...state, result });
        } catch (error) {
            alert(
                `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`
            );
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setState({ ...state, copied: true });

            setTimeout(() => {
                setState((prevState) => ({ ...prevState, copied: false }));
            }, 2000);
        });
    };

    const clearAll = () => {
        setState({
            ...state,
            text: "",
            key: "",
            result: ""
        });
    };

    const switchMode = () => {
        setState({
            ...state,
            mode: state.mode === "encrypt" ? "decrypt" : "encrypt",
            text: state.result,
            result: state.text
        });
    };

    return (
        <div className="Page EncryptAndDecrypt">
            <h1 className="title">Encrypt & Decrypt</h1>
            <p className="description">
                Encrypt and decrypt text using various cryptographic algorithms
            </p>

            <div className="crypto-container">
                {/* Mode and Algorithm Selection */}
                <div className="controls-section glass">
                    <div className="mode-toggle">
                        <button
                            className={`mode-btn ${state.mode === "encrypt" ? "active" : ""}`}
                            onClick={() =>
                                setState({ ...state, mode: "encrypt" })
                            }>
                            <Lock />
                            Encrypt
                        </button>
                        <button
                            className={`mode-btn ${state.mode === "decrypt" ? "active" : ""}`}
                            onClick={() =>
                                setState({ ...state, mode: "decrypt" })
                            }>
                            <LockOpen />
                            Decrypt
                        </button>
                    </div>

                    <div className="algorithm-selector">
                        <label>Algorithm:</label>
                        <select
                            value={state.algorithm}
                            onChange={(e) =>
                                setState({
                                    ...state,
                                    algorithm: e.target.value as Algorithm
                                })
                            }>
                            {algorithms.map((algo) => (
                                <option
                                    key={algo.value}
                                    value={algo.value}>
                                    {algo.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Input Section */}
                <div className="input-section glass">
                    <div className="section-header">
                        <h2>
                            {state.mode === "encrypt"
                                ? "Plain Text"
                                : "Encrypted Text"}
                        </h2>
                    </div>
                    <textarea
                        value={state.text}
                        onChange={(e) =>
                            setState({ ...state, text: e.target.value })
                        }
                        placeholder={
                            state.mode === "encrypt"
                                ? "Enter the text you want to encrypt..."
                                : "Enter the encrypted text you want to decrypt..."
                        }
                        rows={6}
                    />
                </div>

                {/* Key Section */}
                <div className="key-section glass">
                    <div className="section-header">
                        <h2>Encryption Key</h2>
                        <div className="key-actions">
                            <Button
                                onPress={generateRandomKey}
                                title="Generate random key"
                                variant="ghost"
                                isIconOnly
                                size="sm">
                                <Refresh />
                            </Button>
                            <Button
                                onPress={() =>
                                    setState({
                                        ...state,
                                        showKey: !state.showKey
                                    })
                                }
                                title={state.showKey ? "Hide key" : "Show key"}
                                variant="ghost"
                                isIconOnly
                                size="sm">
                                {state.showKey ? (
                                    <VisibilityOff />
                                ) : (
                                    <Visibility />
                                )}
                            </Button>
                        </div>
                    </div>
                    <div className="key-input-container">
                        <input
                            type={state.showKey ? "text" : "password"}
                            value={state.key}
                            onChange={(e) =>
                                setState({ ...state, key: e.target.value })
                            }
                            placeholder="Enter your encryption key..."
                        />
                    </div>
                    <div className="key-info">
                        <p>
                            Recommended key length:{" "}
                            {state.algorithm === "AES" ? "32" : "16"} characters
                        </p>
                        <p>Current length: {state.key.length}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                    <Button
                        onPress={processText}
                        color="primary"
                        size="lg"
                        startContent={
                            state.mode === "encrypt" ? <Lock /> : <LockOpen />
                        }>
                        {state.mode === "encrypt" ? "Encrypt" : "Decrypt"}
                    </Button>
                    <Button
                        onPress={switchMode}
                        variant="bordered"
                        size="lg"
                        startContent={<VpnKey />}>
                        Switch to{" "}
                        {state.mode === "encrypt" ? "Decrypt" : "Encrypt"}
                    </Button>
                    <Button
                        onPress={clearAll}
                        variant="light"
                        size="lg"
                        color="danger">
                        Clear All
                    </Button>
                </div>

                {/* Result Section */}
                {state.result && (
                    <div className="result-section glass">
                        <div className="section-header">
                            <h2>
                                {state.mode === "encrypt"
                                    ? "Encrypted Text"
                                    : "Decrypted Text"}
                            </h2>
                            <Button
                                onPress={() => copyToClipboard(state.result)}
                                title={
                                    state.copied
                                        ? "Copied!"
                                        : "Copy to clipboard"
                                }
                                variant="ghost"
                                isIconOnly
                                size="sm"
                                color={state.copied ? "success" : "default"}>
                                <ContentCopy />
                            </Button>
                        </div>
                        <textarea
                            value={state.result}
                            readOnly
                            rows={6}
                            className="result-textarea"
                        />
                        <div className="result-info">
                            <p>Algorithm: {state.algorithm}</p>
                            <p>
                                Output length: {state.result.length} characters
                            </p>
                        </div>
                    </div>
                )}

                {/* Information Section */}
                <div className="info-section glass">
                    <h3>Security Information</h3>
                    <div className="algorithm-info">
                        {state.algorithm === "AES" && (
                            <div>
                                <h4>AES (Advanced Encryption Standard)</h4>
                                <p>
                                    AES is a symmetric encryption algorithm
                                    widely used and trusted by security
                                    professionals. It&apos;s considered highly
                                    secure and is used by governments and
                                    organizations worldwide.
                                </p>
                                <ul>
                                    <li>
                                        Key size: Supports 128, 192, and 256-bit
                                        keys
                                    </li>
                                    <li>
                                        Security: Very high - recommended for
                                        sensitive data
                                    </li>
                                    <li>Performance: Fast and efficient</li>
                                </ul>
                            </div>
                        )}
                        {state.algorithm === "DES" && (
                            <div>
                                <h4>DES (Data Encryption Standard)</h4>
                                <p>
                                    DES is an older encryption standard that is
                                    now considered weak due to its small key
                                    size. Not recommended for securing sensitive
                                    data.
                                </p>
                                <ul>
                                    <li>Key size: 56-bit effective key size</li>
                                    <li>
                                        Security: Low - deprecated and easily
                                        broken
                                    </li>
                                    <li>Usage: Legacy systems only</li>
                                </ul>
                            </div>
                        )}
                        {state.algorithm === "TripleDES" && (
                            <div>
                                <h4>TripleDES (3DES)</h4>
                                <p>
                                    TripleDES applies DES encryption three times
                                    to increase security. While more secure than
                                    DES, it&apos;s slower than modern
                                    alternatives.
                                </p>
                                <ul>
                                    <li>
                                        Key size: 112 or 168-bit effective key
                                        size
                                    </li>
                                    <li>Security: Medium - being phased out</li>
                                    <li>Performance: Slower than AES</li>
                                </ul>
                            </div>
                        )}
                        {state.algorithm === "Rabbit" && (
                            <div>
                                <h4>Rabbit Stream Cipher</h4>
                                <p>
                                    Rabbit is a high-speed stream cipher
                                    designed for software implementations.
                                    It&apos;s fast and secure for real-time
                                    applications.
                                </p>
                                <ul>
                                    <li>Key size: 128-bit</li>
                                    <li>
                                        Security: High - no known practical
                                        attacks
                                    </li>
                                    <li>Performance: Very fast</li>
                                </ul>
                            </div>
                        )}
                        {state.algorithm === "RC4" && (
                            <div>
                                <h4>RC4 Stream Cipher</h4>
                                <p>
                                    RC4 is a stream cipher that was widely used
                                    but has known vulnerabilities. Not
                                    recommended for new applications.
                                </p>
                                <ul>
                                    <li>Key size: Variable (40-2048 bits)</li>
                                    <li>
                                        Security: Low - has known
                                        vulnerabilities
                                    </li>
                                    <li>Usage: Legacy systems only</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
