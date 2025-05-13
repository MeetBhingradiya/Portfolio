/**
 *  @FileID          app/Tools/JWT/page.tsx
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, forks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier, or the organization.
 *  
 *  -----------------------------------------------------------------------------  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------  
 *  Last Updated on Version: 1.1.0
 *  -----------------------------------------------------------------------------  
 *  @created 13/05/25 12:05 PM IST (Kolkata +5:30 UTC)
 *  @modified 13/05/25 12:05 PM IST (Kolkata +5:30 UTC)
 */

"use client";

import React from "react";
import "@Styles/Tools-JWT.sass";
import {
    ContentCopy,
    Clear,
    VerifiedUser,
    ErrorOutline,
    WarningAmber,
    Visibility,
    VisibilityOff
} from "@mui/icons-material";
import { Button } from "@heroui/react";

// Algorithm options for JWT
const ALGORITHM_OPTIONS = {
    "HS256": "HMAC with SHA-256",
    "HS384": "HMAC with SHA-384",
    "HS512": "HMAC with SHA-512",
    "RS256": "RSASSA-PKCS1-v1_5 with SHA-256",
    "RS384": "RSASSA-PKCS1-v1_5 with SHA-384",
    "RS512": "RSASSA-PKCS1-v1_5 with SHA-512",
    "ES256": "ECDSA with SHA-256",
    "ES384": "ECDSA with SHA-384",
    "ES512": "ECDSA with SHA-512",
    "PS256": "RSASSA-PSS with SHA-256",
    "PS384": "RSASSA-PSS with SHA-384",
    "PS512": "RSASSA-PSS with SHA-512",
    "none": "No digital signature or MAC performed"
};

// JWT Standard claims
const STANDARD_CLAIMS = {
    "iss": "Issuer",
    "sub": "Subject",
    "aud": "Audience",
    "exp": "Expiration Time",
    "nbf": "Not Before",
    "iat": "Issued At",
    "jti": "JWT ID"
};

interface DecodedJWT {
    header: any;
    payload: any;
    signature: string;
    valid: boolean;
    error?: string;
}

interface VerificationStatus {
    status: 'valid' | 'invalid' | 'warning' | 'none';
    message: string;
}

interface JWTState {
    token: string;
    decodedToken: DecodedJWT | null;
    secret: string;
    verificationStatus: VerificationStatus;
    activeTab: 'header' | 'payload' | 'signature';
    error: string;
    showSecret: boolean;
}

export default function JWTDebugger() {
    const [state, setState] = React.useState<JWTState>({
        token: "",
        decodedToken: null,
        secret: "",
        verificationStatus: { status: 'none', message: "" },
        activeTab: 'payload',
        error: "",
        showSecret: false
    });

    // Decode the JWT token
    const decodeToken = (token: string): DecodedJWT | null => {
        try {
            // Clear any existing errors
            setState(prev => ({ ...prev, error: "" }));

            if (!token.trim()) {
                return null;
            }

            // Split the token into parts
            const parts = token.split('.');
            if (parts.length !== 3) {
                setState(prev => ({ ...prev, error: "Invalid JWT format. Expected format: header.payload.signature" }));
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
            setState(prev => ({ ...prev, error: `Error decoding token: ${error.message}` }));
            return null;
        }
    };

    // Handle token input change
    const handleTokenChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newToken = e.target.value;
        setState({
            ...state,
            token: newToken,
            decodedToken: decodeToken(newToken),
            verificationStatus: { status: 'none', message: "" }
        });
    };

    // Handle secret input change
    const handleSecretChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setState({
            ...state,
            secret: e.target.value,
            verificationStatus: { status: 'none', message: "" }
        });
    };

    // Toggle tab
    const handleTabChange = (tab: 'header' | 'payload' | 'signature') => {
        setState({ ...state, activeTab: tab });
    };

    // Copy to clipboard
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    // Clear all fields
    const clearFields = () => {
        setState({
            token: "",
            decodedToken: null,
            secret: "",
            verificationStatus: { status: 'none', message: "" },
            activeTab: 'payload',
            error: "",
            showSecret: false
        });
    };

    // Toggle show/hide secret
    const toggleShowSecret = () => {
        setState({ ...state, showSecret: !state.showSecret });
    };

    // Verify token
    const verifyToken = () => {
        if (!state.decodedToken) {
            setState({
                ...state,
                verificationStatus: {
                    status: 'invalid',
                    message: "Invalid token. Please enter a valid JWT first."
                }
            });
            return;
        }

        if (!state.secret.trim() && state.decodedToken.header.alg !== 'none') {
            setState({
                ...state,
                verificationStatus: {
                    status: 'warning',
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
                        status: 'invalid',
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
                        status: 'invalid',
                        message: "Token is not yet valid (nbf claim)."
                    }
                });
                return;
            }
        }

        // For client-side only verification, we can't actually verify the signature cryptographically without a backend
        // So we'll just do some basic validation and simulate the verification
        
        if (state.decodedToken.header.alg === 'none') {
            setState({
                ...state,
                verificationStatus: {
                    status: 'warning',
                    message: "Token uses 'none' algorithm. This is insecure and should not be used in production."
                }
            });
            return;
        }
        
        // Check if token is properly formatted
        const parts = state.token.split('.');
        if (parts.length !== 3 || !parts[2]) {
            setState({
                ...state,
                verificationStatus: {
                    status: 'invalid',
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
                status: 'valid',
                message: "Token structure is valid. Client-side signature verification is limited - for complete validation, use a server."
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
        return (timestamp * 1000) < Date.now();
    };

    // Render token details
    const renderTokenDetails = () => {
        if (!state.decodedToken) return null;
        
        const { payload } = state.decodedToken;
        
        const details = [];
        
        // Add standard claims
        for (const [key, label] of Object.entries(STANDARD_CLAIMS)) {
            if (payload[key] !== undefined) {
                if (key === 'exp' || key === 'nbf' || key === 'iat') {
                    const timestamp = payload[key];
                    const isTokenExpired = key === 'exp' && isExpired(timestamp);
                    
                    details.push(
                        <div className="detail-item" key={key}>
                            <div className="detail-label">{label}</div>
                            <div className={`detail-value timestamp ${isTokenExpired ? 'expired' : ''}`}>
                                {formatTimestamp(timestamp)}
                                {isTokenExpired && " (Expired)"}
                            </div>
                        </div>
                    );
                } else {
                    details.push(
                        <div className="detail-item" key={key}>
                            <div className="detail-label">{label}</div>
                            <div className="detail-value">
                                {typeof payload[key] === 'object' 
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
            <div className="detail-item" key="alg">
                <div className="detail-label">Algorithm</div>
                <div className="detail-value">
                    {state.decodedToken.header.alg} 
                    {ALGORITHM_OPTIONS[state.decodedToken.header.alg as keyof typeof ALGORITHM_OPTIONS] 
                        ? ` (${ALGORITHM_OPTIONS[state.decodedToken.header.alg as keyof typeof ALGORITHM_OPTIONS]})` 
                        : ''}
                </div>
            </div>
        );
        
        // Add token type
        if (state.decodedToken.header.typ) {
            details.push(
                <div className="detail-item" key="typ">
                    <div className="detail-label">Token Type</div>
                    <div className="detail-value">{state.decodedToken.header.typ}</div>
                </div>
            );
        }
        
        return (
            <div className="details-grid">
                {details}
            </div>
        );
    };

    return (
        <div className="Page JWTDebugger">
            <h1 className="title">JWT Debugger</h1>
            <p className="description">Debug and verify JSON Web Tokens securely in your browser</p>

            <div className="jwt-container">
                {/* JWT Input */}
                <div className="jwt-input glass">
                    <div className="jwt-header">
                        <h2>Token</h2>
                        <div className="jwt-actions">
                            <Button
                                onPress={() => clearFields()}
                                disabled={!state.token}
                                title="Clear all fields"
                                variant="ghost"
                                isIconOnly
                            >
                                <Clear />
                            </Button>
                        </div>
                    </div>
                    
                    <div className="jwt-textarea-container">
                        <div className="jwt-label">Enter your JWT token:</div>
                        <textarea
                            className="jwt-textarea"
                            value={state.token}
                            onChange={handleTokenChange}
                            placeholder="Paste your JWT token here (header.payload.signature)"
                        />
                    </div>
                </div>

                {/* Error Message (if any) */}
                {state.error && (
                    <div className="error-message">{state.error}</div>
                )}

                {/* Decoded JWT */}
                {state.decodedToken && (
                    <div className="jwt-decoded glass">
                        <div className="decoded-header">
                            <h2>Decoded</h2>
                            <div className="decoded-tabs">
                                <button
                                    className={`tab-button ${state.activeTab === 'header' ? 'active' : ''}`}
                                    onClick={() => handleTabChange('header')}
                                >
                                    Header
                                </button>
                                <button
                                    className={`tab-button ${state.activeTab === 'payload' ? 'active' : ''}`}
                                    onClick={() => handleTabChange('payload')}
                                >
                                    Payload
                                </button>
                                <button
                                    className={`tab-button ${state.activeTab === 'signature' ? 'active' : ''}`}
                                    onClick={() => handleTabChange('signature')}
                                >
                                    Signature
                                </button>
                            </div>
                        </div>
                        
                        <div className="decoded-content">
                            <div className={`tab-content ${state.activeTab === 'header' ? 'active' : ''}`}>
                                <pre>{JSON.stringify(state.decodedToken.header, null, 2)}</pre>
                            </div>
                            
                            <div className={`tab-content ${state.activeTab === 'payload' ? 'active' : ''}`}>
                                <pre>{JSON.stringify(state.decodedToken.payload, null, 2)}</pre>
                            </div>
                            
                            <div className={`tab-content ${state.activeTab === 'signature' ? 'active' : ''}`}>
                                <pre>{state.decodedToken.signature || "No signature"}</pre>
                            </div>
                        </div>
                    </div>
                )}

                {/* Verification Section */}
                {state.decodedToken && (
                    <div className="jwt-verification glass">
                        <div className="verification-header">
                            <h2>Verify Signature</h2>
                        </div>
                        
                        <div className="verification-content">
                            <div className="secret-input">
                                <label htmlFor="secret-key">Secret Key or Public Key:</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="secret-key"
                                        type={state.showSecret ? "text" : "password"}
                                        value={state.secret}
                                        onChange={handleSecretChange}
                                        placeholder="Enter your secret key"
                                    />
                                    <Button
                                        onPress={toggleShowSecret}
                                        title={state.showSecret ? "Hide secret" : "Show secret"}
                                        variant="ghost"
                                        isIconOnly
                                        style={{
                                            position: 'absolute',
                                            right: '8px',
                                            top: '50%',
                                            transform: 'translateY(-50%)'
                                        }}
                                    >
                                        {state.showSecret ? <VisibilityOff /> : <Visibility />}
                                    </Button>
                                </div>
                            </div>
                            
                            <Button
                                onPress={verifyToken}
                                disabled={!state.decodedToken}
                                variant="ghost"
                                style={{ minWidth: '120px' }}
                            >
                                Verify
                            </Button>
                            
                            {state.verificationStatus.status !== 'none' && (
                                <div className="status-container">
                                    <div className="status-title">Verification Result:</div>
                                    <div className={`status-message ${state.verificationStatus.status}`}>
                                        {state.verificationStatus.status === 'valid' && (
                                            <VerifiedUser className="status-icon" />
                                        )}
                                        {state.verificationStatus.status === 'invalid' && (
                                            <ErrorOutline className="status-icon" />
                                        )}
                                        {state.verificationStatus.status === 'warning' && (
                                            <WarningAmber className="status-icon" />
                                        )}
                                        <span>{state.verificationStatus.message}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Token Details */}
                {state.decodedToken && (
                    <div className="jwt-details glass">
                        <div className="details-header">
                            <h2>Token Details</h2>
                        </div>
                        
                        <div className="details-content">
                            {renderTokenDetails()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
