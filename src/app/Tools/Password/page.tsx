/**
 *  @FileID          app/Tools/Password/page.tsx
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
import "@Styles/Tools-Password.sass";
import {
    ContentCopy,
    Key,
    Refresh,
    Abc
} from "@mui/icons-material";
import { Button } from "@heroui/react";

// Words for passphrase generation
const COMMON_WORDS = [
    "apple", "ball", "cat", "dog", "eagle", "flower", "guitar", "house", "island", "jacket",
    "kite", "lemon", "mountain", "notebook", "orange", "piano", "queen", "river", "sunset", "tiger",
    "umbrella", "violin", "window", "xylophone", "yellow", "zebra", "anchor", "book", "cloud", "diamond",
    "elephant", "forest", "garden", "highway", "igloo", "journal", "kingdom", "lighthouse", "moon", "ocean",
    "planet", "quilt", "rainbow", "star", "tree", "universe", "village", "waterfall", "box", "yard",
    "acorn", "bridge", "castle", "desert", "earth", "fire", "globe", "harbor", "ice", "jungle",
    "key", "lake", "marble", "needle", "owl", "pearl", "quartz", "rose", "ship", "torch",
    "unicorn", "valley", "wolf", "fox", "yarn", "zeppelin", "art", "bird", "compass", "door"
];

type PasswordType = "password" | "passphrase";

interface IState {
    type: PasswordType;
    password: string;
    copied: boolean;
    options: {
        uppercase: boolean;
        lowercase: boolean;
        numbers: boolean;
        symbols: boolean;
        length: number;
        words: number;
    };
}

export default function PasswordGenerator() {
    const [state, setState] = React.useState<IState>({
        type: "password",
        password: "",
        copied: false,
        options: {
            uppercase: true,
            lowercase: true,
            numbers: true,
            symbols: true,
            length: 16,
            words: 4
        }
    });

    // Generate password on component mount
    React.useEffect(() => {
        generatePassword();
    }, []);

    const generatePassword = () => {
        if (state.type === "password") {
            const password = generateRandomPassword(
                state.options.length,
                state.options.uppercase,
                state.options.lowercase,
                state.options.numbers,
                state.options.symbols
            );
            setState({ ...state, password, copied: false });
        } else {
            const passphrase = generatePassphrase(
                state.options.words,
                state.options.numbers,
                state.options.symbols
            );
            setState({ ...state, password: passphrase, copied: false });
        }
    };

    const generateRandomPassword = (
        length: number,
        includeUppercase: boolean,
        includeLowercase: boolean,
        includeNumbers: boolean,
        includeSymbols: boolean
    ) => {
        // Define character sets
        const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
        const numberChars = "0123456789";
        const symbolChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

        // Create character pool based on selected options
        let charPool = "";
        if (includeUppercase) charPool += uppercaseChars;
        if (includeLowercase) charPool += lowercaseChars;
        if (includeNumbers) charPool += numberChars;
        if (includeSymbols) charPool += symbolChars;

        // Default to lowercase if nothing is selected
        if (!charPool) charPool = lowercaseChars;

        // Generate password
        let password = "";
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charPool.length);
            password += charPool[randomIndex];
        }

        // Ensure at least one character from each selected character set
        let finalPassword = password;
        if (includeUppercase && !containsAny(password, uppercaseChars)) {
            const pos = Math.floor(Math.random() * password.length);
            const char = uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
            finalPassword = replaceAt(finalPassword, pos, char);
        }
        if (includeLowercase && !containsAny(password, lowercaseChars)) {
            const pos = Math.floor(Math.random() * password.length);
            const char = lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
            finalPassword = replaceAt(finalPassword, pos, char);
        }
        if (includeNumbers && !containsAny(password, numberChars)) {
            const pos = Math.floor(Math.random() * password.length);
            const char = numberChars[Math.floor(Math.random() * numberChars.length)];
            finalPassword = replaceAt(finalPassword, pos, char);
        }
        if (includeSymbols && !containsAny(password, symbolChars)) {
            const pos = Math.floor(Math.random() * password.length);
            const char = symbolChars[Math.floor(Math.random() * symbolChars.length)];
            finalPassword = replaceAt(finalPassword, pos, char);
        }

        return finalPassword;
    };

    const generatePassphrase = (
        wordCount: number, 
        includeNumbers: boolean, 
        includeSymbols: boolean
    ) => {
        const words = [];
        const usedIndexes = new Set<number>();
        
        // Select random words
        for (let i = 0; i < wordCount; i++) {
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * COMMON_WORDS.length);
            } while (usedIndexes.has(randomIndex));
            
            usedIndexes.add(randomIndex);
            let word = COMMON_WORDS[randomIndex];
            
            // Capitalize first letter (50% chance)
            if (Math.random() > 0.5) {
                word = word.charAt(0).toUpperCase() + word.slice(1);
            }
            
            words.push(word);
        }
        
        // Add a number if requested
        if (includeNumbers) {
            const randomNum = Math.floor(Math.random() * 100);
            words.push(randomNum.toString());
        }
        
        // Add a symbol if requested
        if (includeSymbols) {
            const symbols = "!@#$%^&*";
            const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
            words.push(randomSymbol);
        }
        
        // Shuffle the words
        return shuffleArray(words).join("");
    };

    // Utility function to check if a string contains any characters from a character set
    const containsAny = (str: string, charSet: string) => {
        for (let i = 0; i < str.length; i++) {
            if (charSet.includes(str[i])) {
                return true;
            }
        }
        return false;
    };

    // Utility function to replace a character at a specific position in a string
    const replaceAt = (str: string, index: number, character: string) => {
        return str.substr(0, index) + character + str.substr(index + 1);
    };

    // Utility function to shuffle an array
    const shuffleArray = (array: any[]) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    const handleTypeChange = (type: PasswordType) => {
        setState({ ...state, type });
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(state.password).then(() => {
            setState({ ...state, copied: true });
            
            // Reset copied state after 2 seconds
            setTimeout(() => {
                setState(prevState => ({ ...prevState, copied: false }));
            }, 2000);
        });
    };

    const handleOptionChange = (option: keyof IState["options"], value: boolean | number) => {
        setState({
            ...state,
            options: {
                ...state.options,
                [option]: value
            }
        });
    };

    // Update effect to regenerate password when type changes
    React.useEffect(() => {
        if (state.password) {
            generatePassword();
        }
    }, [state.type]);

    return (
        <div className="Page PasswordGenerator">
            <h1 className="title">Password Generator</h1>
            <p className="description">Generate secure passwords and passphrases with customizable options</p>

            <div className="generator-container">
                <div className="password-display glass">
                    <div className="password-header">
                        <h2>{state.type === "password" ? "Password" : "Passphrase"}</h2>
                        <div className="password-actions">
                            <Button
                                onPress={generatePassword}
                                title="Generate new"
                                variant="ghost"
                                isIconOnly
                            >
                                <Refresh />
                            </Button>
                            <Button
                                onPress={copyToClipboard}
                                disabled={!state.password}
                                title={state.copied ? "Copied!" : "Copy to clipboard"}
                                variant="ghost"
                                isIconOnly
                            >
                                <ContentCopy />
                            </Button>
                        </div>
                    </div>
                    <div className="password-content">
                        {state.password || "Click 'Generate' to create a password"}
                    </div>
                </div>

                <div className="options-container glass">
                    <div className="option-group type-selector">
                        <div 
                            className={`type-option ${state.type === "password" ? "active" : ""}`}
                            onClick={() => handleTypeChange("password")}
                        >
                            <Key className="icon" />
                            <span className="label">Password</span>
                        </div>
                        <div 
                            className={`type-option ${state.type === "passphrase" ? "active" : ""}`}
                            onClick={() => handleTypeChange("passphrase")}
                        >
                            <Abc className="icon" />
                            <span className="label">Passphrase</span>
                        </div>
                    </div>

                    {state.type === "password" ? (
                        <>
                            <div className="option-group">
                                <h3>Include</h3>
                                <div className="options">
                                    <div className="checkbox-option">
                                        <input
                                            type="checkbox"
                                            id="uppercase"
                                            checked={state.options.uppercase}
                                            onChange={(e) => handleOptionChange("uppercase", e.target.checked)}
                                        />
                                        <label htmlFor="uppercase">A-Z</label>
                                    </div>
                                    <div className="checkbox-option">
                                        <input
                                            type="checkbox"
                                            id="lowercase"
                                            checked={state.options.lowercase}
                                            onChange={(e) => handleOptionChange("lowercase", e.target.checked)}
                                        />
                                        <label htmlFor="lowercase">a-z</label>
                                    </div>
                                    <div className="checkbox-option">
                                        <input
                                            type="checkbox"
                                            id="numbers"
                                            checked={state.options.numbers}
                                            onChange={(e) => handleOptionChange("numbers", e.target.checked)}
                                        />
                                        <label htmlFor="numbers">0-9</label>
                                    </div>
                                    <div className="checkbox-option">
                                        <input
                                            type="checkbox"
                                            id="symbols"
                                            checked={state.options.symbols}
                                            onChange={(e) => handleOptionChange("symbols", e.target.checked)}
                                        />
                                        <label htmlFor="symbols">!@#$%^&*</label>
                                    </div>
                                </div>
                            </div>
                            <div className="option-group">
                                <h3>Length</h3>
                                <div className="length-controller">
                                    <div className="slider-container">
                                        <input
                                            type="range"
                                            min="5"
                                            max="128"
                                            value={state.options.length}
                                            onChange={(e) => handleOptionChange("length", parseInt(e.target.value))}
                                        />
                                        <input
                                            type="number"
                                            min="5"
                                            max="128"
                                            value={state.options.length}
                                            onChange={(e) => handleOptionChange("length", parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="option-group">
                                <h3>Include</h3>
                                <div className="options">
                                    <div className="checkbox-option">
                                        <input
                                            type="checkbox"
                                            id="numbers-phrase"
                                            checked={state.options.numbers}
                                            onChange={(e) => handleOptionChange("numbers", e.target.checked)}
                                        />
                                        <label htmlFor="numbers-phrase">Numbers</label>
                                    </div>
                                    <div className="checkbox-option">
                                        <input
                                            type="checkbox"
                                            id="symbols-phrase"
                                            checked={state.options.symbols}
                                            onChange={(e) => handleOptionChange("symbols", e.target.checked)}
                                        />
                                        <label htmlFor="symbols-phrase">Symbols</label>
                                    </div>
                                </div>
                            </div>
                            <div className="option-group">
                                <h3>Word Count</h3>
                                <div className="length-controller">
                                    <div className="slider-container">
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={state.options.words}
                                            onChange={(e) => handleOptionChange("words", parseInt(e.target.value))}
                                        />
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={state.options.words}
                                            onChange={(e) => handleOptionChange("words", parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <Button className="generate-button" onPress={generatePassword}>
                        Generate {state.type === "password" ? "Password" : "Passphrase"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
