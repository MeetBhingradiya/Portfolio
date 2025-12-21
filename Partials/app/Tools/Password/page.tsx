"use client";

import React from "react";
import { 
    ContentCopy, 
    Key, 
    Refresh, 
    Abc, 
    Security,
    Check,
    Settings,
    Visibility,
    VisibilityOff,
    History,
    Download
} from "@mui/icons-material";
import { 
    Button, 
    Card, 
    CardBody, 
    Checkbox, 
    Input, 
    Tabs, 
    Tab, 
    Chip, 
    Tooltip,
    Divider,
    Progress
} from "@heroui/react";

// Words for passphrase generation
const COMMON_WORDS = [
    "apple",
    "ball",
    "cat",
    "dog",
    "eagle",
    "flower",
    "guitar",
    "house",
    "island",
    "jacket",
    "kite",
    "lemon",
    "mountain",
    "notebook",
    "orange",
    "piano",
    "queen",
    "river",
    "sunset",
    "tiger",
    "umbrella",
    "violin",
    "window",
    "xylophone",
    "yellow",
    "zebra",
    "anchor",
    "book",
    "cloud",
    "diamond",
    "elephant",
    "forest",
    "garden",
    "highway",
    "igloo",
    "journal",
    "kingdom",
    "lighthouse",
    "moon",
    "ocean",
    "planet",
    "quilt",
    "rainbow",
    "star",
    "tree",
    "universe",
    "village",
    "waterfall",
    "box",
    "yard",
    "acorn",
    "bridge",
    "castle",
    "desert",
    "earth",
    "fire",
    "globe",
    "harbor",
    "ice",
    "jungle",
    "key",
    "lake",
    "marble",
    "needle",
    "owl",
    "pearl",
    "quartz",
    "rose",
    "ship",
    "torch",
    "unicorn",
    "valley",
    "wolf",
    "fox",
    "yarn",
    "zeppelin",
    "art",
    "bird",
    "compass",
    "door"
];

type PasswordType = "password" | "passphrase" | "pin";

interface GeneratedPassword {
    id: string;
    value: string;
    type: PasswordType;
    timestamp: Date;
    strength: number;
}

interface IState {
    type: PasswordType;
    password: string;
    copied: boolean;
    showPassword: boolean;
    history: GeneratedPassword[];
    options: {
        uppercase: boolean;
        lowercase: boolean;
        numbers: boolean;
        symbols: boolean;
        length: number;
        words: number;
        pinLength: number;
        excludeSimilar: boolean;
        excludeAmbiguous: boolean;
    };
}

export default function PasswordGenerator() {
    const [state, setState] = React.useState<IState>({
        type: "password",
        password: "",
        copied: false,
        showPassword: true,
        history: [],
        options: {
            uppercase: true,
            lowercase: true,
            numbers: true,
            symbols: true,
            length: 16,
            words: 4,
            pinLength: 6,
            excludeSimilar: false,
            excludeAmbiguous: false
        }
    });

    // Generate password on component mount
    React.useEffect(() => {
        generatePassword();
    }, []);

    const generatePassword = () => {
        let password = "";
        
        if (state.type === "password") {
            password = generateRandomPassword(
                state.options.length,
                state.options.uppercase,
                state.options.lowercase,
                state.options.numbers,
                state.options.symbols,
                state.options.excludeSimilar,
                state.options.excludeAmbiguous
            );
        } else if (state.type === "passphrase") {
            password = generatePassphrase(
                state.options.words,
                state.options.numbers,
                state.options.symbols
            );
        } else {
            password = generatePIN(state.options.pinLength);
        }
        
        const strength = calculatePasswordStrength(password);
        
        const newPassword: GeneratedPassword = {
            id: Date.now().toString(),
            value: password,
            type: state.type,
            timestamp: new Date(),
            strength
        };
        
        setState({
            ...state,
            password,
            copied: false,
            history: [newPassword, ...state.history.slice(0, 19)] // Keep last 20
        });
    };

    const generateRandomPassword = (
        length: number,
        includeUppercase: boolean,
        includeLowercase: boolean,
        includeNumbers: boolean,
        includeSymbols: boolean,
        excludeSimilar: boolean,
        excludeAmbiguous: boolean
    ) => {
        // Define character sets
        let uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
        let numberChars = "0123456789";
        let symbolChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

        // Exclude similar characters if requested
        if (excludeSimilar) {
            uppercaseChars = uppercaseChars.replace(/[IL]/g, "");
            lowercaseChars = lowercaseChars.replace(/[l]/g, "");
            numberChars = numberChars.replace(/[01]/g, "");
            symbolChars = symbolChars.replace(/[|]/g, "");
        }

        // Exclude ambiguous characters if requested
        if (excludeAmbiguous) {
            uppercaseChars = uppercaseChars.replace(/[O]/g, "");
            lowercaseChars = lowercaseChars.replace(/[o]/g, "");
            numberChars = numberChars.replace(/[0]/g, "");
            symbolChars = symbolChars.replace(/[{}[\]()]/g, "");
        }

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

    const generatePIN = (length: number) => {
        let pin = "";
        for (let i = 0; i < length; i++) {
            pin += Math.floor(Math.random() * 10).toString();
        }
        return pin;
    };

    const calculatePasswordStrength = (password: string): number => {
        let strength = 0;
        
        // Length bonus
        if (password.length >= 8) strength += 25;
        if (password.length >= 12) strength += 25;
        
        // Character variety bonus
        if (/[a-z]/.test(password)) strength += 10;
        if (/[A-Z]/.test(password)) strength += 10;
        if (/[0-9]/.test(password)) strength += 10;
        if (/[^A-Za-z0-9]/.test(password)) strength += 20;
        
        return Math.min(100, strength);
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
            const randomSymbol =
                symbols[Math.floor(Math.random() * symbols.length)];
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

    const copyToClipboard = async (text?: string) => {
        try {
            const textToCopy = text || state.password;
            await navigator.clipboard.writeText(textToCopy);
            setState(prev => ({ ...prev, copied: true }));
            setTimeout(() => {
                setState((prevState) => ({ ...prevState, copied: false }));
            }, 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const exportPasswords = () => {
        const data = {
            generated: new Date().toISOString(),
            passwords: state.history
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `passwords-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const clearHistory = () => {
        setState({ ...state, history: [] });
    };

    const handleOptionChange = (
        option: keyof IState["options"],
        value: boolean | number
    ) => {
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
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-6 pt-45 min-h-max pb-16">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="text-4xl font-bold mb-2 text-white">
                    🔐 Password Generator
                </div>
                <div className="text-base text-gray-400 mb-6 max-w-2xl">
                    Generate secure passwords, passphrases, and PINs with advanced customization options
                </div>
            </div>

            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Generator */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Generated Password Display */}
                    <Card className="bg-black/10 backdrop-blur-lg border border-white/20">
                        <CardBody className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Security className="text-green-400" />
                                <h3 className="text-xl font-semibold text-white">Generated {state.type.charAt(0).toUpperCase() + state.type.slice(1)}</h3>
                                {state.password && (
                                    <Chip 
                                        size="sm" 
                                        variant="flat" 
                                        color={
                                            calculatePasswordStrength(state.password) >= 80 ? "success" :
                                            calculatePasswordStrength(state.password) >= 60 ? "warning" : "danger"
                                        }
                                    >
                                        {calculatePasswordStrength(state.password)}% Strong
                                    </Chip>
                                )}
                            </div>
                            
                            <div className="bg-gray-900 rounded-lg p-4 mb-4 relative">
                                <div className="font-mono text-lg text-white break-all select-all">
                                    {state.showPassword ? (state.password || "Click generate to create a password") : "•".repeat(state.password.length)}
                                </div>
                                
                                {state.password && (
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <Tooltip content={state.showPassword ? "Hide password" : "Show password"}>
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                onPress={() => setState({...state, showPassword: !state.showPassword})}
                                            >
                                                {state.showPassword ? <VisibilityOff className="text-gray-400" /> : <Visibility className="text-gray-400" />}
                                            </Button>
                                        </Tooltip>
                                    </div>
                                )}
                            </div>

                            {state.password && (
                                <div className="mb-4">
                                    <Progress 
                                        value={calculatePasswordStrength(state.password)} 
                                        color={
                                            calculatePasswordStrength(state.password) >= 80 ? "success" :
                                            calculatePasswordStrength(state.password) >= 60 ? "warning" : "danger"
                                        }
                                        size="sm"
                                        label="Password Strength"
                                        showValueLabel
                                        className="max-w-md"
                                    />
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                <Button
                                    color="primary"
                                    variant="shadow"
                                    startContent={<Refresh />}
                                    onPress={generatePassword}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600"
                                >
                                    Generate New
                                </Button>
                                
                                <Button
                                    variant="bordered"
                                    startContent={state.copied ? <Check /> : <ContentCopy />}
                                    onPress={() => copyToClipboard()}
                                    isDisabled={!state.password}
                                    color={state.copied ? "success" : "default"}
                                >
                                    {state.copied ? "Copied!" : "Copy"}
                                </Button>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Configuration Tabs */}
                    <Card className="bg-black/10 backdrop-blur-lg border border-white/20">
                        <CardBody className="p-6">
                            <Tabs 
                                selectedKey={state.type}
                                onSelectionChange={(key) => setState({...state, type: key as PasswordType})}
                                variant="underlined"
                                classNames={{
                                    tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                                    cursor: "w-full bg-blue-500",
                                    tab: "max-w-fit px-0 h-12",
                                    tabContent: "group-data-[selected=true]:text-blue-400"
                                }}
                            >
                                <Tab 
                                    key="password" 
                                    title={
                                        <div className="flex items-center gap-2">
                                            <Key />
                                            <span>Password</span>
                                        </div>
                                    }
                                >
                                    <div className="mt-6 space-y-6">
                                        {/* Character Types */}
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-300 mb-3">Character Types</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Checkbox
                                                    isSelected={state.options.uppercase}
                                                    onValueChange={(checked) => handleOptionChange("uppercase", checked)}
                                                >
                                                    Uppercase (A-Z)
                                                </Checkbox>
                                                <Checkbox
                                                    isSelected={state.options.lowercase}
                                                    onValueChange={(checked) => handleOptionChange("lowercase", checked)}
                                                >
                                                    Lowercase (a-z)
                                                </Checkbox>
                                                <Checkbox
                                                    isSelected={state.options.numbers}
                                                    onValueChange={(checked) => handleOptionChange("numbers", checked)}
                                                >
                                                    Numbers (0-9)
                                                </Checkbox>
                                                <Checkbox
                                                    isSelected={state.options.symbols}
                                                    onValueChange={(checked) => handleOptionChange("symbols", checked)}
                                                >
                                                    Symbols (!@#$)
                                                </Checkbox>
                                            </div>
                                        </div>

                                        <Divider />

                                        {/* Length Control */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-sm font-medium text-gray-300">Password Length</h4>
                                                <Chip size="sm" variant="flat">{state.options.length} characters</Chip>
                                            </div>
                                            <Input
                                                type="range"
                                                min={4}
                                                max={128}
                                                step={1}
                                                value={state.options.length.toString()}
                                                onChange={(e) => handleOptionChange("length", parseInt(e.target.value))}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                <span>4</span>
                                                <span>128</span>
                                            </div>
                                        </div>

                                        <Divider />

                                        {/* Advanced Options */}
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-300 mb-3">Advanced Options</h4>
                                            <div className="space-y-2">
                                                <Checkbox
                                                    isSelected={state.options.excludeSimilar}
                                                    onValueChange={(checked) => handleOptionChange("excludeSimilar", checked)}
                                                    size="sm"
                                                >
                                                    Exclude similar characters (i, l, 1, L, o, 0, O)
                                                </Checkbox>
                                                <Checkbox
                                                    isSelected={state.options.excludeAmbiguous}
                                                    onValueChange={(checked) => handleOptionChange("excludeAmbiguous", checked)}
                                                    size="sm"
                                                >
                                                    Exclude ambiguous characters ({`{} [] ()`})
                                                </Checkbox>
                                            </div>
                                        </div>
                                    </div>
                                </Tab>

                                <Tab 
                                    key="passphrase" 
                                    title={
                                        <div className="flex items-center gap-2">
                                            <Abc />
                                            <span>Passphrase</span>
                                        </div>
                                    }
                                >
                                    <div className="mt-6 space-y-6">
                                        {/* Word Count */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-sm font-medium text-gray-300">Number of Words</h4>
                                                <Chip size="sm" variant="flat">{state.options.words} words</Chip>
                                            </div>
                                            <Input
                                                type="range"
                                                min={2}
                                                max={10}
                                                step={1}
                                                value={state.options.words.toString()}
                                                onChange={(e) => handleOptionChange("words", parseInt(e.target.value))}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                <span>2</span>
                                                <span>10</span>
                                            </div>
                                        </div>

                                        <Divider />

                                        {/* Additional Elements */}
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-300 mb-3">Additional Elements</h4>
                                            <div className="space-y-2">
                                                <Checkbox
                                                    isSelected={state.options.numbers}
                                                    onValueChange={(checked) => handleOptionChange("numbers", checked)}
                                                >
                                                    Include numbers
                                                </Checkbox>
                                                <Checkbox
                                                    isSelected={state.options.symbols}
                                                    onValueChange={(checked) => handleOptionChange("symbols", checked)}
                                                >
                                                    Include symbols
                                                </Checkbox>
                                            </div>
                                        </div>
                                    </div>
                                </Tab>

                                <Tab 
                                    key="pin" 
                                    title={
                                        <div className="flex items-center gap-2">
                                            <span>🔢</span>
                                            <span>PIN</span>
                                        </div>
                                    }
                                >
                                    <div className="mt-6 space-y-6">
                                        {/* PIN Length */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-sm font-medium text-gray-300">PIN Length</h4>
                                                <Chip size="sm" variant="flat">{state.options.pinLength} digits</Chip>
                                            </div>
                                            <Input
                                                type="range"
                                                min={4}
                                                max={12}
                                                step={1}
                                                value={state.options.pinLength.toString()}
                                                onChange={(e) => handleOptionChange("pinLength", parseInt(e.target.value))}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                <span>4</span>
                                                <span>12</span>
                                            </div>
                                        </div>

                                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <span className="text-orange-400 text-xl">⚠️</span>
                                                <div>
                                                    <div className="text-orange-400 font-medium text-sm">Security Notice</div>
                                                    <div className="text-gray-300 text-xs mt-1">
                                                        PINs are less secure than passwords. Use them only for low-security applications.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Tab>
                            </Tabs>
                        </CardBody>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* History */}
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
                                        <Key className="mx-auto text-4xl mb-2 opacity-50" />
                                        <p className="text-sm">No passwords generated yet</p>
                                    </div>
                                ) : (
                                    state.history.map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all duration-200 group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-mono text-xs text-white truncate select-all">
                                                        {item.value.length > 20 ? `${item.value.substring(0, 20)}...` : item.value}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Chip size="sm" variant="flat" color="primary">
                                                            {item.type}
                                                        </Chip>
                                                        <Chip 
                                                            size="sm" 
                                                            variant="flat" 
                                                            color={
                                                                item.strength >= 80 ? "success" :
                                                                item.strength >= 60 ? "warning" : "danger"
                                                            }
                                                        >
                                                            {item.strength}%
                                                        </Chip>
                                                        <span className="text-xs text-gray-400">
                                                            {item.timestamp.toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Tooltip content="Copy">
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        onPress={() => copyToClipboard(item.value)}
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
                                        onPress={exportPasswords}
                                        fullWidth
                                    >
                                        Export
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="bordered"
                                        color="danger"
                                        onPress={clearHistory}
                                        fullWidth
                                    >
                                        Clear
                                    </Button>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Security Tips */}
                    <Card className="bg-black/10 backdrop-blur-lg border border-white/20">
                        <CardBody className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Settings className="text-yellow-400" />
                                Security Tips
                            </h3>
                            
                            <div className="space-y-3 text-sm">
                                <div className="flex items-start gap-3">
                                    <span className="text-green-400">✓</span>
                                    <div className="text-gray-300">Use different passwords for different accounts</div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                    <span className="text-green-400">✓</span>
                                    <div className="text-gray-300">Enable two-factor authentication when possible</div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                    <span className="text-green-400">✓</span>
                                    <div className="text-gray-300">Use a password manager to store passwords securely</div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                    <span className="text-green-400">✓</span>
                                    <div className="text-gray-300">Longer passwords are generally more secure</div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                    <span className="text-red-400">✗</span>
                                    <div className="text-gray-300">Never share passwords via email or text</div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}
