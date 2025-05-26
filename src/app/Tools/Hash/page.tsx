"use client";

import React, { useState } from "react";
import "@Styles/Tools-Hash.sass";
import {
    ContentCopy,
    Tag,
    Calculate,
    Fingerprint,
    Security,
    Speed
} from "@mui/icons-material";
import { Button } from "@heroui/react";
import CryptoJS from 'crypto-js';

type HashAlgorithm = "MD5" | "SHA1" | "SHA256" | "SHA512" | "SHA3" | "RIPEMD160";

interface HashResult {
    algorithm: HashAlgorithm;
    hash: string;
    length: number;
}

interface IState {
    text: string;
    results: HashResult[];
    selectedAlgorithms: HashAlgorithm[];
    copied: string | null;
}

export default function HashGenerator() {
    const [state, setState] = useState<IState>({
        text: "",
        results: [],
        selectedAlgorithms: ["MD5", "SHA1", "SHA256", "SHA512"],
        copied: null
    });

    const algorithms: { value: HashAlgorithm; label: string; description: string; security: 'Low' | 'Medium' | 'High'; speed: 'Fast' | 'Medium' | 'Slow' }[] = [
        {
            value: "MD5",
            label: "MD5",
            description: "128-bit hash function, widely used but cryptographically broken",
            security: 'Low',
            speed: 'Fast'
        },
        {
            value: "SHA1",
            label: "SHA-1",
            description: "160-bit hash function, deprecated for cryptographic use",
            security: 'Low',
            speed: 'Fast'
        },
        {
            value: "SHA256",
            label: "SHA-256",
            description: "256-bit hash function, part of SHA-2 family, widely used and secure",
            security: 'High',
            speed: 'Medium'
        },
        {
            value: "SHA512",
            label: "SHA-512",
            description: "512-bit hash function, part of SHA-2 family, very secure",
            security: 'High',
            speed: 'Medium'
        },
        {
            value: "SHA3",
            label: "SHA-3",
            description: "Latest SHA standard, 256-bit output, highly secure",
            security: 'High',
            speed: 'Slow'
        },
        {
            value: "RIPEMD160",
            label: "RIPEMD-160",
            description: "160-bit hash function, used in Bitcoin addresses",
            security: 'Medium',
            speed: 'Medium'
        }
    ];

    const generateHashes = () => {
        if (!state.text.trim()) {
            alert('Please enter text to hash');
            return;
        }

        const results: HashResult[] = [];

        state.selectedAlgorithms.forEach(algorithm => {
            try {
                let hash = '';
                
                switch (algorithm) {
                    case 'MD5':
                        hash = CryptoJS.MD5(state.text).toString();
                        break;
                    case 'SHA1':
                        hash = CryptoJS.SHA1(state.text).toString();
                        break;
                    case 'SHA256':
                        hash = CryptoJS.SHA256(state.text).toString();
                        break;
                    case 'SHA512':
                        hash = CryptoJS.SHA512(state.text).toString();
                        break;
                    case 'SHA3':
                        hash = CryptoJS.SHA3(state.text, { outputLength: 256 }).toString();
                        break;
                    case 'RIPEMD160':
                        hash = CryptoJS.RIPEMD160(state.text).toString();
                        break;
                }

                results.push({
                    algorithm,
                    hash,
                    length: hash.length
                });
            } catch (error) {
                console.error(`Error generating ${algorithm} hash:`, error);
            }
        });

        setState({ ...state, results });
    };

    const copyToClipboard = (text: string, algorithm: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setState({ ...state, copied: algorithm });
            
            setTimeout(() => {
                setState(prevState => ({ ...prevState, copied: null }));
            }, 2000);
        });
    };

    const toggleAlgorithm = (algorithm: HashAlgorithm) => {
        const newSelected = state.selectedAlgorithms.includes(algorithm)
            ? state.selectedAlgorithms.filter(a => a !== algorithm)
            : [...state.selectedAlgorithms, algorithm];
        
        setState({ ...state, selectedAlgorithms: newSelected });
    };

    const selectAllAlgorithms = () => {
        setState({ ...state, selectedAlgorithms: algorithms.map(a => a.value) });
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
            case 'High': return <Security style={{ color: '#22c55e' }} />;
            case 'Medium': return <Security style={{ color: '#f59e0b' }} />;
            case 'Low': return <Security style={{ color: '#ef4444' }} />;
            default: return <Security />;
        }
    };

    const getSpeedIcon = (speed: string) => {
        switch (speed) {
            case 'Fast': return <Speed style={{ color: '#22c55e' }} />;
            case 'Medium': return <Speed style={{ color: '#f59e0b' }} />;
            case 'Slow': return <Speed style={{ color: '#ef4444' }} />;
            default: return <Speed />;
        }
    };

    return (
        <div className="Page HashGenerator">
            <h1 className="title">Hash Generator</h1>
            <p className="description">Generate hash values for text using various cryptographic algorithms</p>

            <div className="hash-container">
                {/* Input Section */}
                <div className="input-section glass">
                    <div className="section-header">
                        <h2>Input Text</h2>
                        <div className="text-info">
                            Length: {state.text.length} characters
                        </div>
                    </div>
                    <textarea
                        value={state.text}
                        onChange={(e) => setState({ ...state, text: e.target.value })}
                        placeholder="Enter the text you want to hash..."
                        rows={6}
                    />
                </div>

                {/* Algorithm Selection */}
                <div className="algorithm-section glass">
                    <div className="section-header">
                        <h2>Hash Algorithms</h2>
                        <div className="selection-controls">
                            <Button
                                onPress={selectAllAlgorithms}
                                variant="light"
                                size="sm"
                            >
                                Select All
                            </Button>
                            <Button
                                onPress={deselectAllAlgorithms}
                                variant="light"
                                size="sm"
                            >
                                Deselect All
                            </Button>
                        </div>
                    </div>
                    
                    <div className="algorithms-grid">
                        {algorithms.map(algo => (
                            <div 
                                key={algo.value}
                                className={`algorithm-card ${state.selectedAlgorithms.includes(algo.value) ? 'selected' : ''}`}
                                onClick={() => toggleAlgorithm(algo.value)}
                            >
                                <div className="algorithm-header">
                                    <div className="algorithm-name">
                                        <input
                                            type="checkbox"
                                            checked={state.selectedAlgorithms.includes(algo.value)}
                                            onChange={() => toggleAlgorithm(algo.value)}
                                        />
                                        <span>{algo.label}</span>
                                    </div>
                                    <div className="algorithm-indicators">
                                        {getSecurityIcon(algo.security)}
                                        {getSpeedIcon(algo.speed)}
                                    </div>
                                </div>
                                <div className="algorithm-description">
                                    {algo.description}
                                </div>
                                <div className="algorithm-stats">
                                    <span className={`security-level ${algo.security.toLowerCase()}`}>
                                        Security: {algo.security}
                                    </span>
                                    <span className={`speed-level ${algo.speed.toLowerCase()}`}>
                                        Speed: {algo.speed}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                    <Button
                        onPress={generateHashes}
                        color="primary"
                        size="lg"
                        startContent={<Calculate />}
                        isDisabled={state.selectedAlgorithms.length === 0}
                    >
                        Generate Hashes
                    </Button>
                    <Button
                        onPress={clearAll}
                        variant="light"
                        size="lg"
                        color="danger"
                    >
                        Clear All
                    </Button>
                </div>

                {/* Results Section */}
                {state.results.length > 0 && (
                    <div className="results-section glass">
                        <div className="section-header">
                            <h2>Hash Results</h2>
                            <div className="results-info">
                                {state.results.length} hash{state.results.length !== 1 ? 'es' : ''} generated
                            </div>
                        </div>
                        
                        <div className="results-grid">
                            {state.results.map((result, index) => (
                                <div key={index} className="result-card">
                                    <div className="result-header">
                                        <div className="algorithm-info">
                                            <Tag />
                                            <span className="algorithm-name">{result.algorithm}</span>
                                        </div>
                                        <Button
                                            onPress={() => copyToClipboard(result.hash, result.algorithm)}
                                            title={state.copied === result.algorithm ? "Copied!" : "Copy to clipboard"}
                                            variant="ghost"
                                            isIconOnly
                                            size="sm"
                                            color={state.copied === result.algorithm ? "success" : "default"}
                                        >
                                            <ContentCopy />
                                        </Button>
                                    </div>
                                    <div className="hash-output">
                                        <code>{result.hash}</code>
                                    </div>
                                    <div className="hash-info">
                                        <span>Length: {result.length} characters</span>
                                        <span>Hex format</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Information Section */}
                <div className="info-section glass">
                    <h3>About Hash Functions</h3>
                    <div className="hash-info-content">
                        <div className="info-block">
                            <h4>What are Hash Functions?</h4>
                            <p>
                                Hash functions are mathematical algorithms that take input data of any size and produce 
                                a fixed-size string of characters, which is typically a hexadecimal number. The output 
                                is called a hash value, hash code, digest, or simply hash.
                            </p>
                        </div>
                        
                        <div className="info-block">
                            <h4>Common Uses</h4>
                            <ul>
                                <li>Data integrity verification</li>
                                <li>Password storage (with salt)</li>
                                <li>Digital signatures</li>
                                <li>Blockchain and cryptocurrency</li>
                                <li>File deduplication</li>
                                <li>Checksums for error detection</li>
                            </ul>
                        </div>
                        
                        <div className="info-block">
                            <h4>Security Considerations</h4>
                            <ul>
                                <li><strong>MD5 & SHA-1:</strong> Cryptographically broken, avoid for security purposes</li>
                                <li><strong>SHA-256 & SHA-512:</strong> Currently secure and widely used</li>
                                <li><strong>SHA-3:</strong> Latest standard, designed to be quantum-resistant</li>
                                <li><strong>RIPEMD-160:</strong> Less common but still considered secure</li>
                            </ul>
                        </div>
                        
                        <div className="info-block">
                            <h4>Properties of Good Hash Functions</h4>
                            <ul>
                                <li>Deterministic: Same input always produces same output</li>
                                <li>Fast computation: Quick to calculate</li>
                                <li>Avalanche effect: Small input changes cause large output changes</li>
                                <li>Pre-image resistance: Hard to reverse the hash</li>
                                <li>Collision resistance: Hard to find two inputs with same hash</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
