"use client";

import React from "react";
import "@Styles/Tools-RegExp.sass";
import {
    ContentCopy,
    FormatAlignLeft,
    Clear,
    AddCircleOutline,
    RemoveCircleOutline,
    NotesOutlined,
    TextFormat,
    TextFields,
    LooksOne,
    SearchOutlined,
    TextFormatOutlined,
    FormatClear,
    ArrowDropDown,
    FormatListNumbered
} from "@mui/icons-material";
import { Button } from "@heroui/react";

// RegExp Template Presets
const REGEX_PRESETS = {
    "Email": {
        pattern: String.raw`^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`,
        flags: "g",
        description: "Match valid email addresses"
    },
    "Phone Number": {
        pattern: String.raw`^\+?[1-9]\d{1,14}$`,
        flags: "g",
        description:
            "Match phone numbers with optional country code (E.164 format)"
    },
    "URL": {
        pattern: String.raw`^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#()?&//=]*)$`,
        flags: "gi",
        description: "Match URLs with optional http/https and www"
    },
    "Date (YYYY-MM-DD)": {
        pattern: String.raw`^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$`,
        flags: "g",
        description: "Match dates in YYYY-MM-DD format"
    },
    "Date (MM/DD/YYYY)": {
        pattern: String.raw`^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$`,
        flags: "g",
        description: "Match dates in MM/DD/YYYY format"
    },
    "Time (24h)": {
        pattern: String.raw`^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$`,
        flags: "g",
        description: "Match 24-hour time format (HH:MM or HH:MM:SS)"
    },
    "Simple Password": {
        pattern: String.raw`^[a-zA-Z0-9]{8,}$`,
        flags: "g",
        description: "Match passwords with at least 8 alphanumeric characters"
    },
    "Strong Password": {
        pattern: String.raw`^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$`,
        flags: "g",
        description:
            "Match passwords with at least 8 characters, one uppercase, one lowercase, one number and one special character"
    },
    "Complex Password": {
        pattern: String.raw`^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$`,
        flags: "g",
        description:
            "Match passwords with at least 12 characters, one uppercase, one lowercase, one number and one special character"
    },
    "IP Address": {
        pattern: String.raw`^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$`,
        flags: "g",
        description: "Match valid IPv4 addresses"
    },
    "ZIP Code (US)": {
        pattern: String.raw`^\d{5}(?:[-\s]\d{4})?$`,
        flags: "g",
        description: "Match US ZIP codes (5 digits, optional +4)"
    },
    "Credit Card": {
        pattern: String.raw`^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$`,
        flags: "g",
        description: "Match major credit card numbers"
    },
    "HTML Tag": {
        pattern: String.raw`<([a-z]+)([^<]+)*(?:>(.*?)<\/\1>|\s+\/>)`,
        flags: "gi",
        description: "Match HTML tags"
    },
    "Hexadecimal Color": {
        pattern: String.raw`^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$`,
        flags: "g",
        description: "Match hex color codes (#FFF or #FFFFFF)"
    },
    "YouTube URL": {
        pattern: String.raw`(?:https?:\/\/)?(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?[\w\=]*)?`,
        flags: "g",
        description: "Match YouTube video URLs"
    },
    "Twitter/X Handle": {
        pattern: String.raw`@([A-Za-z0-9_]+)`,
        flags: "g",
        description: "Match Twitter/X handles (@username)"
    }
};

// Available flags description
const FLAGS_DESC = {
    g: "Global - Find all matches rather than stopping after the first match",
    i: "Ignore case - Case-insensitive matching",
    m: "Multiline - ^ and $ match the beginning and end of each line",
    s: "Dotall - Dot (.) matches newline characters",
    y: "Sticky - Match only from the index indicated by lastIndex",
    u: "Unicode - Treat pattern as a sequence of Unicode code points",
    d: "Indices - Generate indices for substring matches"
};

interface Match {
    value: string;
    index: number;
    groups: string[];
}

interface RegExpState {
    pattern: string;
    flags: {
        global: boolean;
        ignoreCase: boolean;
        multiline: boolean;
        dotAll: boolean;
        sticky: boolean;
        unicode: boolean;
        hasIndices: boolean;
    };
    testString: string;
    matches: Match[];
    error: string;
    copied: boolean;
}

interface StringToolsState {
    findText: string;
    replaceText: string;
    useRegExp: boolean;
}

export default function RegExpBuilder() {
    const [state, setState] = React.useState<RegExpState>({
        pattern: "",
        flags: {
            global: true,
            ignoreCase: false,
            multiline: false,
            dotAll: false,
            sticky: false,
            unicode: false,
            hasIndices: false
        },
        testString: "",
        matches: [],
        error: "",
        copied: false
    });

    const [stringTools, setStringTools] = React.useState<StringToolsState>({
        findText: "",
        replaceText: "",
        useRegExp: false
    });

    // Generate a RegExp object from current state
    const buildRegExp = () => {
        const flagsString = [
            state.flags.global ? "g" : "",
            state.flags.ignoreCase ? "i" : "",
            state.flags.multiline ? "m" : "",
            state.flags.dotAll ? "s" : "",
            state.flags.sticky ? "y" : "",
            state.flags.unicode ? "u" : "",
            state.flags.hasIndices ? "d" : ""
        ].join("");

        try {
            if (!state.pattern) {
                return null;
            }
            return new RegExp(state.pattern, flagsString);
        } catch (error) {
            return null;
        }
    };

    // Test the RegExp against the input string
    const testRegExp = () => {
        setState({ ...state, matches: [], error: "" });

        if (!state.pattern || !state.testString) {
            return;
        }

        try {
            const regexp = buildRegExp();
            if (!regexp) {
                setState({
                    ...state,
                    error: "Invalid regular expression pattern",
                    matches: []
                });
                return;
            }

            const matches: Match[] = [];
            let match;

            // If not global, we need to manually collect all matches
            if (!state.flags.global) {
                let tempString = state.testString;
                let currentIndex = 0;

                while ((match = regexp.exec(tempString)) !== null) {
                    matches.push({
                        value: match[0],
                        index: match.index + currentIndex,
                        groups: match.slice(1)
                    });

                    currentIndex += match.index + match[0].length;
                    tempString = tempString.slice(
                        match.index + match[0].length
                    );

                    // Avoid infinite loops
                    if (match[0] === "") break;
                }
            } else {
                // Global flag is set, we can use loop with exec
                const newRegexp = new RegExp(regexp);
                while ((match = newRegexp.exec(state.testString)) !== null) {
                    matches.push({
                        value: match[0],
                        index: match.index,
                        groups: match.slice(1)
                    });

                    // Avoid infinite loops
                    if (match[0] === "") break;
                }
            }

            setState({
                ...state,
                matches,
                error: ""
            });
        } catch (error: any) {
            setState({
                ...state,
                error: `Error: ${error.message}`,
                matches: []
            });
        }
    };

    // Handle applying a preset template
    const applyPreset = (presetName: string) => {
        const preset = REGEX_PRESETS[presetName as keyof typeof REGEX_PRESETS];
        if (!preset) return;

        const flags = {
            global: preset.flags.includes("g"),
            ignoreCase: preset.flags.includes("i"),
            multiline: preset.flags.includes("m"),
            dotAll: preset.flags.includes("s"),
            sticky: preset.flags.includes("y"),
            unicode: preset.flags.includes("u"),
            hasIndices: preset.flags.includes("d")
        };

        setState({
            ...state,
            pattern: preset.pattern,
            flags,
            matches: [],
            error: ""
        });
    };

    // Update flag values
    const handleFlagChange = (
        flag: keyof RegExpState["flags"],
        value: boolean
    ) => {
        setState({
            ...state,
            flags: {
                ...state.flags,
                [flag]: value
            }
        });
    };

    // Copy RegExp to clipboard
    const copyRegExp = () => {
        const flagsString = [
            state.flags.global ? "g" : "",
            state.flags.ignoreCase ? "i" : "",
            state.flags.multiline ? "m" : "",
            state.flags.dotAll ? "s" : "",
            state.flags.sticky ? "y" : "",
            state.flags.unicode ? "u" : "",
            state.flags.hasIndices ? "d" : ""
        ].join("");

        // Create the RegExp string representation
        const regExpString = `/${state.pattern}/${flagsString}`;

        navigator.clipboard.writeText(regExpString).then(() => {
            setState({ ...state, copied: true });

            setTimeout(() => {
                setState((prevState) => ({ ...prevState, copied: false }));
            }, 2000);
        });
    };

    // Clear all fields
    const clearFields = () => {
        setState({
            pattern: "",
            flags: {
                global: true,
                ignoreCase: false,
                multiline: false,
                dotAll: false,
                sticky: false,
                unicode: false,
                hasIndices: false
            },
            testString: "",
            matches: [],
            error: "",
            copied: false
        });
    };

    // String manipulation tools
    const transformText = (transformation: string) => {
        if (!state.testString) return;

        let result = state.testString;

        switch (transformation) {
            case "uppercase":
                result = state.testString.toUpperCase();
                break;
            case "lowercase":
                result = state.testString.toLowerCase();
                break;
            case "capitalize":
                result = state.testString
                    .split(" ")
                    .map(
                        (word) =>
                            word.charAt(0).toUpperCase() +
                            word.slice(1).toLowerCase()
                    )
                    .join(" ");
                break;
            case "trim":
                result = state.testString.trim();
                break;
            case "trimLeft":
                result = state.testString.trimStart();
                break;
            case "trimRight":
                result = state.testString.trimEnd();
                break;
            case "removeExtraSpaces":
                result = state.testString.replace(/\s+/g, " ").trim();
                break;
            case "reverseText":
                result = state.testString.split("").reverse().join("");
                break;
            case "camelCase":
                result = state.testString
                    .toLowerCase()
                    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) =>
                        char.toUpperCase()
                    );
                break;
            case "kebabCase":
                result = state.testString
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-zA-Z0-9-]/g, "");
                break;
            case "snakeCase":
                result = state.testString
                    .toLowerCase()
                    .replace(/\s+/g, "_")
                    .replace(/[^a-zA-Z0-9_]/g, "");
                break;
            case "countChars":
                result = `${state.testString.length} characters`;
                break;
            case "countWords":
                const wordCount = state.testString.trim()
                    ? state.testString.trim().split(/\s+/).length
                    : 0;
                result = `${wordCount} words`;
                break;
            default:
                break;
        }

        setState({ ...state, testString: result });
    };

    // Find and replace in text
    const findAndReplace = () => {
        if (!state.testString || !stringTools.findText) return;

        try {
            let result;
            if (stringTools.useRegExp) {
                // Using RegExp for find and replace
                const regExp = new RegExp(stringTools.findText, "g");
                result = state.testString.replace(
                    regExp,
                    stringTools.replaceText
                );
            } else {
                // Simple string replacement
                const findText = stringTools.findText;
                const replaceText = stringTools.replaceText;
                result = state.testString.split(findText).join(replaceText);
            }

            setState({ ...state, testString: result });
        } catch (error: any) {
            setState({
                ...state,
                error: `Find & Replace Error: ${error.message}`
            });
        }
    };

    return (
        <div className="Page RegExpBuilder">
            <h1 className="title">RegExp Builder & Tester</h1>
            <p className="description">
                Build, test, and debug regular expressions with instant string
                manipulation tools
            </p>

            <div className="regexp-container">
                {/* RegExp Builder */}
                <div className="regexp-builder glass">
                    <div className="regexp-header">
                        <h2>RegExp Builder</h2>
                        <div className="regexp-actions">
                            <Button
                                onPress={copyRegExp}
                                disabled={!state.pattern}
                                title={state.copied ? "Copied!" : "Copy RegExp"}
                                variant="ghost"
                                isIconOnly>
                                <ContentCopy />
                            </Button>
                            <Button
                                onPress={clearFields}
                                disabled={!state.pattern && !state.testString}
                                title="Clear all fields"
                                variant="ghost"
                                isIconOnly>
                                <Clear />
                            </Button>
                        </div>
                    </div>

                    <div className="regexp-input">
                        <div className="regexp-field">
                            <div className="regexp-label">
                                <span>Pattern</span>
                                <span className="regexp-badge">
                                    /pattern/flags
                                </span>
                            </div>
                            <input
                                type="text"
                                value={state.pattern}
                                onChange={(e) =>
                                    setState({
                                        ...state,
                                        pattern: e.target.value,
                                        error: ""
                                    })
                                }
                                placeholder="Enter your regular expression pattern here"
                            />
                        </div>

                        <div className="regexp-flags">
                            {Object.entries(FLAGS_DESC).map(
                                ([flag, description]) => (
                                    <div
                                        className="flag-checkbox"
                                        key={flag}>
                                        <input
                                            type="checkbox"
                                            id={`flag-${flag}`}
                                            checked={
                                                state.flags[
                                                    flag as keyof RegExpState["flags"]
                                                ]
                                            }
                                            onChange={(e) => {
                                                const flagKey = {
                                                    g: "global",
                                                    i: "ignoreCase",
                                                    m: "multiline",
                                                    s: "dotAll",
                                                    y: "sticky",
                                                    u: "unicode",
                                                    d: "hasIndices"
                                                }[
                                                    flag
                                                ] as keyof RegExpState["flags"];

                                                handleFlagChange(
                                                    flagKey,
                                                    e.target.checked
                                                );
                                            }}
                                        />
                                        <label htmlFor={`flag-${flag}`}>
                                            {flag}
                                            <span className="flag-description">
                                                {description}
                                            </span>
                                        </label>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* Error Message (if any) */}
                {state.error && (
                    <div className="error-message">{state.error}</div>
                )}

                {/* Preset Templates */}
                <div className="preset-templates glass">
                    <div className="presets-header">
                        <h2>Preset Templates</h2>
                    </div>
                    <div className="presets-list">
                        {Object.keys(REGEX_PRESETS).map((presetName) => (
                            <button
                                key={presetName}
                                className="preset-button"
                                onClick={() => applyPreset(presetName)}
                                title={
                                    REGEX_PRESETS[
                                        presetName as keyof typeof REGEX_PRESETS
                                    ].description
                                }>
                                {presetName}
                            </button>
                        ))}
                    </div>
                </div>

                {/* RegExp Test */}
                <div className="regexp-test glass">
                    <div className="test-header">
                        <h2>Test String</h2>
                        <div className="test-actions">
                            <Button
                                onPress={testRegExp}
                                disabled={!state.pattern || !state.testString}
                                title="Test RegExp"
                                variant="ghost">
                                Test
                            </Button>
                        </div>
                    </div>

                    <div className="test-input-area">
                        <div className="test-input-label">
                            Enter text to test against your regular expression:
                        </div>
                        <textarea
                            className="test-input"
                            value={state.testString}
                            onChange={(e) =>
                                setState({
                                    ...state,
                                    testString: e.target.value
                                })
                            }
                            placeholder="Enter text to test your regular expression..."
                        />
                    </div>

                    <div className="test-results">
                        {state.matches.length > 0 ? (
                            <>
                                <div className="matches-count">
                                    Found {state.matches.length} match
                                    {state.matches.length !== 1 ? "es" : ""}
                                </div>
                                <div className="matches-list">
                                    {state.matches.map((match, index) => (
                                        <div
                                            className="match-item"
                                            key={index}>
                                            <div className="match-content">
                                                {match.value}
                                            </div>
                                            <div className="match-info">
                                                <span>
                                                    Position: {match.index}
                                                </span>
                                                {match.groups.length > 0 && (
                                                    <div className="match-groups">
                                                        {match.groups.map(
                                                            (
                                                                group,
                                                                groupIndex
                                                            ) => (
                                                                <span
                                                                    className="group-item"
                                                                    key={
                                                                        groupIndex
                                                                    }>
                                                                    Group{" "}
                                                                    {groupIndex +
                                                                        1}
                                                                    :{" "}
                                                                    {group ||
                                                                        "(empty)"}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            state.testString && (
                                <div className="no-matches">
                                    No matches found
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* String Manipulation Tools */}
                <div className="string-tools glass">
                    <div className="tools-header">
                        <h2>String Tools</h2>
                    </div>

                    <div className="tools-content">
                        <div className="tools-section">
                            <h3>Case Transformation</h3>
                            <div className="tools-group">
                                <button
                                    onClick={() => transformText("uppercase")}>
                                    <TextFields className="icon" />
                                    UPPERCASE
                                </button>
                                <button
                                    onClick={() => transformText("lowercase")}>
                                    <TextFields className="icon" />
                                    lowercase
                                </button>
                                <button
                                    onClick={() => transformText("capitalize")}>
                                    <TextFormat className="icon" />
                                    Capitalize Words
                                </button>
                                <button
                                    onClick={() => transformText("camelCase")}>
                                    <TextFormatOutlined className="icon" />
                                    camelCase
                                </button>
                                <button
                                    onClick={() => transformText("kebabCase")}>
                                    <RemoveCircleOutline className="icon" />
                                    kebab-case
                                </button>
                                <button
                                    onClick={() => transformText("snakeCase")}>
                                    <ArrowDropDown className="icon" />
                                    snake_case
                                </button>
                            </div>
                        </div>

                        <div className="tools-section">
                            <h3>Whitespace</h3>
                            <div className="tools-group">
                                <button onClick={() => transformText("trim")}>
                                    <FormatClear className="icon" />
                                    Trim All
                                </button>
                                <button
                                    onClick={() => transformText("trimLeft")}>
                                    <FormatClear className="icon" />
                                    Trim Left
                                </button>
                                <button
                                    onClick={() => transformText("trimRight")}>
                                    <FormatClear className="icon" />
                                    Trim Right
                                </button>
                                <button
                                    onClick={() =>
                                        transformText("removeExtraSpaces")
                                    }>
                                    <FormatAlignLeft className="icon" />
                                    Remove Extra Spaces
                                </button>
                            </div>
                        </div>

                        <div className="tools-section">
                            <h3>Special Operations</h3>
                            <div className="tools-group">
                                <button
                                    onClick={() =>
                                        transformText("reverseText")
                                    }>
                                    <NotesOutlined className="icon" />
                                    Reverse Text
                                </button>
                                <button
                                    onClick={() => transformText("countChars")}>
                                    <LooksOne className="icon" />
                                    Count Characters
                                </button>
                                <button
                                    onClick={() => transformText("countWords")}>
                                    <FormatListNumbered className="icon" />
                                    Count Words
                                </button>
                            </div>
                        </div>

                        <div className="tools-section">
                            <h3>Find & Replace</h3>
                            <div className="find-replace">
                                <div className="input-group">
                                    <label htmlFor="find-text">Find:</label>
                                    <input
                                        type="text"
                                        id="find-text"
                                        value={stringTools.findText}
                                        onChange={(e) =>
                                            setStringTools({
                                                ...stringTools,
                                                findText: e.target.value
                                            })
                                        }
                                        placeholder="Text to find..."
                                    />
                                </div>

                                <div className="input-group">
                                    <label htmlFor="replace-text">
                                        Replace with:
                                    </label>
                                    <input
                                        type="text"
                                        id="replace-text"
                                        value={stringTools.replaceText}
                                        onChange={(e) =>
                                            setStringTools({
                                                ...stringTools,
                                                replaceText: e.target.value
                                            })
                                        }
                                        placeholder="Replacement text..."
                                    />
                                </div>

                                <div className="action-buttons">
                                    <div className="checkbox-option">
                                        <input
                                            type="checkbox"
                                            id="use-regexp"
                                            checked={stringTools.useRegExp}
                                            onChange={(e) =>
                                                setStringTools({
                                                    ...stringTools,
                                                    useRegExp: e.target.checked
                                                })
                                            }
                                        />
                                        <label htmlFor="use-regexp">
                                            Use RegExp
                                        </label>
                                    </div>

                                    <Button
                                        onPress={findAndReplace}
                                        disabled={
                                            !stringTools.findText ||
                                            !state.testString
                                        }
                                        variant="ghost"
                                        size="sm">
                                        <SearchOutlined />
                                        Replace
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
