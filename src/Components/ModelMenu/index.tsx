"use client";

import React from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    ButtonGroup,
    Tabs,
    Tab,
    Card,
    CardBody,
    Tooltip,
    Input,
    Slider,
    Select,
    SelectItem,
} from "@heroui/react";
import {
    Settings,
    Contrast,
    LightMode,
    DarkMode,
    Wallpaper,
    Palette,
    FormatColorFill,
    RoundedCorner,
    Language,
    Cookie,
    Info,
    Upload,
    Delete,
    Star,
    CloudUpload,
    AddPhotoAlternate,
    Language as LanguageIcon,
    Warning,
} from "@mui/icons-material";
import { Config } from "@Config";
import { motion } from "framer-motion";
import { getRelativeTime, isFutureDate } from "@Utils/Relativetime";
import { predefinedBackgrounds } from "@Config/Gredients";
import { TRANSITION_EASINGS } from "@heroui/framer-utils";

// ? Type Definitions
const MAX_UPLOADS = 6;
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const MAX_IMAGE_Cloud = 5 * 1024 * 1024;

// ? Storage Keys
const STORAGE_KEYS = {
    USER_PREFERENCES: "USER-PREFERENCES",
    BACKGROUND_LIST: "BG-List",
    ACTIVE_BACKGROUND: "Active-BG",
    BUFFER_KEYS: "BG-BK",
};

interface IBackground_Color {
    id: string
    name: string
    type: "color"
    value: string
}

interface IBackground_Gradient {
    id: string
    name: string
    type: "gradient"
    value: string
}

interface IBackground_Image {
    id: string
    name: string
    type: "image"
    bufferkeys: string[]
}

type IBackground = IBackground_Color | IBackground_Gradient | IBackground_Image

interface IBackgrounds {
    id: string
    filename: string
}

interface IUserPreferences {
    Activebackground: IBackground
    Backgrounds: IBackgrounds[]
    borderRadius: number
    cookiePreferences: {
        necessary: boolean
        performance: boolean
        analytics: boolean
        marketing: boolean
        functional: boolean
    }
}

interface IComponentState {
    Current_Tab: "background" | "border" | "language" | "cookies" | "info"
    Explore_Background_Tab: "gradients" | "colors" | "uploaded";
    UserPreferences: IUserPreferences
    UploadedFiles: IBackground_Image[]
}

const defaultUserPreferences: IUserPreferences = {
    Activebackground: {
        id: predefinedBackgrounds[0].id,
        name: predefinedBackgrounds[0].name,
        type: predefinedBackgrounds[0].type as "gradient",
        value: predefinedBackgrounds[0].value,
    },
    Backgrounds: [],
    borderRadius: 10,
    cookiePreferences: {
        necessary: true,
        performance: true,
        analytics: false,
        marketing: false,
        functional: false,
    },
};

const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "Hindi" },
    { code: "gu", name: "Gujarati" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "jp", name: "Japanese" },
    { code: "cn", name: "Chinese" },
    { code: "ar", name: "Arabic" },
];

// Utility: Safe localStorage.setItem with quota error handling
function safeSetItem(key: string, value: string) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error: any) {
        if (error && error.name === "QuotaExceededError") {
            alert("Local storage is full. Please remove some backgrounds or data and try again.");
        } else {
            alert("An error occurred while saving data to local storage.");
        }
        return false;
    }
}

export default function ModelMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {

    const [componentState, setComponentState] = React.useState<IComponentState>({
        Current_Tab: "background",
        Explore_Background_Tab: "gradients",
        UserPreferences: defaultUserPreferences,
        UploadedFiles: []
    });

    // # Verifyed
    React.useEffect(() => {
        applyBackground();

        const storedPreferences = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
        if (storedPreferences) {
            try {
                const parsedPreferences = JSON.parse(storedPreferences);
                setComponentState(prevState => ({
                    ...prevState,
                    UserPreferences: parsedPreferences
                }));
            } catch (error) {
                console.error("Error loading user preferences:", error);
            }
        }

        loadBackgroundList();
    }, []);

    // # Verifyed
    React.useEffect(() => {
        safeSetItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(componentState.UserPreferences));
    }, [componentState.UserPreferences]);

    // # Verifyed
    React.useEffect(() => {
        const uploadedFiles = componentState.UploadedFiles;

        if (uploadedFiles.length === 0) {
            localStorage.removeItem(STORAGE_KEYS.BACKGROUND_LIST);
            return;
        }

        const metadataList = uploadedFiles.map(bg => ({
            id: bg.id,
            type: bg.type,
            name: bg.name,
            bufferkeys: bg.bufferkeys
        }));

        safeSetItem(STORAGE_KEYS.BACKGROUND_LIST, JSON.stringify(metadataList));
    }, [componentState.UploadedFiles]);

    React.useEffect(() => {
        applyBackground();
    }, [componentState.UserPreferences.Activebackground]);

    React.useEffect(() => {
        document.documentElement.style.setProperty("--border-radius", `${componentState.UserPreferences.borderRadius}px`);
    }, [componentState.UserPreferences.borderRadius]);

    function loadBackgroundList() {
        const storedBackgroundsList = localStorage.getItem(STORAGE_KEYS.BACKGROUND_LIST);
        if (storedBackgroundsList) {
            try {
                const metadataList = JSON.parse(storedBackgroundsList);
                const loadedBackgrounds = metadataList.map((metadata: any) => {
                    if (!metadata.bufferkeys || metadata.bufferkeys.length === 0) {
                        return null;
                    }

                    // ? Check for Corrupted Data
                    const isCorrupted = metadata.bufferkeys.some((key: string) => {
                        const data = localStorage.getItem(key);
                        if (!data) {
                            return true;
                        }
                        return false;
                    });

                    if (isCorrupted) {
                        metadata.bufferkeys.forEach((key: string) => {
                            localStorage.removeItem(key);
                        });
                        return null;
                    }

                    return {
                        id: metadata.id,
                        name: metadata.name,
                        type: "image" as const,
                        bufferkeys: metadata.bufferkeys
                    };
                }).filter(Boolean);

                setComponentState(prevState => ({
                    ...prevState,
                    UploadedFiles: loadedBackgrounds
                }));
            } catch (error) {
                console.error("Error loading backgrounds:", error);
            }
        }
    }

    const applyBackground = () => {
        const SelectedBackgroundData = localStorage.getItem("Active-BG");

        if (SelectedBackgroundData) {
            const parsedData = JSON.parse(SelectedBackgroundData);

            const html = document.documentElement;
            if (parsedData?.type === "color") {
                html.style.background = parsedData.value;
                html.style.backgroundImage = "none";
            } else if (parsedData?.type === "gradient") {
                html.style.background = "none";
                html.style.backgroundImage = parsedData.value;
            } else if (parsedData?.type === "image") {
                if (parsedData.bufferkeys && parsedData.bufferkeys.length > 0) {
                    if (parsedData.bufferkeys.length === 1) {
                        const imageData = localStorage.getItem(parsedData.bufferkeys[0]);
                        if (imageData) {
                            html.style.backgroundImage = `url(${imageData})`;
                        }
                    } else {
                        let completeImage = "";
                        for (let i = 0; i < parsedData.bufferkeys.length; i++) {
                            const chunk = localStorage.getItem(parsedData.bufferkeys[i]);
                            if (chunk) {
                                completeImage += chunk;
                            } else {
                                parsedData.bufferkeys.forEach((key: string) => {
                                    localStorage.removeItem(key);
                                });

                                html.style.background = "none";
                                html.style.backgroundImage = predefinedBackgrounds[0].value;

                                localStorage.removeItem(STORAGE_KEYS.ACTIVE_BACKGROUND);
                                return;
                            }
                        }
                        html.style.backgroundImage = `url(${completeImage})`;
                    }
                } else {
                    html.style.background = "none";
                    html.style.backgroundImage = predefinedBackgrounds[0].value;

                    localStorage.removeItem(STORAGE_KEYS.ACTIVE_BACKGROUND);
                }

                html.style.backgroundSize = "cover";
                html.style.backgroundRepeat = "no-repeat";
                html.style.backgroundAttachment = "fixed";
            }
        } else {
            const html = document.documentElement;
            html.style.background = "none";
            html.style.backgroundImage = predefinedBackgrounds[0].value;
        }
    };

    const handleThemeChange = (newTheme: "system" | "light" | "dark") => {
        setComponentState(prevState => ({
            ...prevState,
            UserPreferences: {
                ...prevState.UserPreferences,
                Theme: newTheme
            }
        }));
    };

    const handleBackgroundSelect = (background: IBackground) => {
        const html = document.documentElement;

        if (background.type === "color") {
            html.style.background = background.value;
            html.style.backgroundImage = "none";
        } else if (background.type === "gradient") {
            html.style.background = "none";
            html.style.backgroundImage = background.value;
        } else if (background.type === "image") {
            html.style.background = "none";

            // For image type, we need to reconstruct the image from chunks if necessary
            if (background.bufferkeys && background.bufferkeys.length > 0) {
                if (background.bufferkeys.length === 1) {
                    // Single chunk - just get it directly
                    const imageData = localStorage.getItem(background.bufferkeys[0]);
                    if (imageData) {
                        html.style.backgroundImage = `url(${imageData})`;
                    }
                } else {
                    // Multiple chunks - concatenate them
                    let completeImage = "";
                    for (let i = 0; i < background.bufferkeys.length; i++) {
                        const chunk = localStorage.getItem(background.bufferkeys[i]);
                        if (chunk) {
                            completeImage += chunk;
                        }
                    }
                    html.style.backgroundImage = `url(${completeImage})`;
                }

                html.style.backgroundSize = "cover";
                html.style.backgroundRepeat = "no-repeat";
                html.style.backgroundAttachment = "fixed";
            }
        }

        // Update the active background in user preferences
        setComponentState(prevState => ({
            ...prevState,
            UserPreferences: {
                ...prevState.UserPreferences,
                Activebackground: background
            }
        }));

        // Save the selection to localStorage
        safeSetItem("Active-BG", JSON.stringify(background));
        loadBackgroundList();
    };

    const handleBorderRadiusChange = (value: number) => {
        setComponentState(prevState => ({
            ...prevState,
            UserPreferences: {
                ...prevState.UserPreferences,
                borderRadius: value
            }
        }));
    };

    const handleLanguageChange = (value: string) => {
        console.log("Language changed to:", value);
    };

    const handleCookiePreferenceChange = (key: keyof typeof componentState.UserPreferences.cookiePreferences, value: boolean) => {
        setComponentState(prevState => ({
            ...prevState,
            UserPreferences: {
                ...prevState.UserPreferences,
                cookiePreferences: {
                    ...prevState.UserPreferences.cookiePreferences,
                    [key]: value
                }
            }
        }));
    };

    const chunkString = (str: string, size: number): string[] => {
        const chunks = [];
        for (let i = 0; i < str.length; i += size) {
            chunks.push(str.substring(i, i + size));
        }
        return chunks;
    };

    function getLocalStorageUsage() {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key: any = localStorage.key(i);
            const value: any = localStorage.getItem(key);
            total += (key.length + value.length) * 2;
        }
        return total;
    }

    function Calculate_Images_Used_Storage() {
        // ? Get Buffer Keys Data
        const bufferKeys = Object.keys(localStorage).filter(key => key.startsWith("bg-image-"));
        const totalBufferKeys = bufferKeys.reduce((total, key) => {
            const value = localStorage.getItem(key);
            return total + (value ? value.length : 0);
        }, 0);

        return totalBufferKeys
    }

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) return;

        const currentUploadedFiles = componentState.UploadedFiles;
        if (currentUploadedFiles.length + event.target.files.length > MAX_UPLOADS) {
            alert(`You can only upload up to ${MAX_UPLOADS} backgrounds. Please remove some to add new ones.`);
            return;
        }

        // Check if the total size of all files exceeds the limit
        const totalSize = Array.from(event.target.files).reduce((acc, file) => acc + file.size, 0);

        if (totalSize > MAX_IMAGE_Cloud && (getLocalStorageUsage() + totalSize) > MAX_IMAGE_Cloud) {
            alert(`Total file size exceeds the limit of ${MAX_IMAGE_Cloud / (1024 * 1024)}MB.`);
            return;
        }

        let NewlyUploadedFiles: IBackground_Image[] = [
            ...currentUploadedFiles
        ];

        for (let file of event.target.files) {
            if (!file) continue;

            if (file.size > MAX_FILE_SIZE) {
                alert(`File is too large. Maximum file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
                continue;
            }

            // Check the background slots limit
            if (currentUploadedFiles.length >= MAX_UPLOADS) {
                alert(`You can only upload up to ${MAX_UPLOADS} backgrounds. Please remove one to add a new one.`);
                break;
            }

            // Proceed with original quality image
            const reader = new FileReader();

            reader.onload = (e) => {
                if (!e.target?.result) return;

                try {
                    // Use original image data
                    const originalBase64 = e.target.result as string;
                    const imageId = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    const bufferKeys: string[] = [];

                    const CHUNK_SIZE = 500 * 1024;
                    const chunks = chunkString(originalBase64, CHUNK_SIZE);

                    for (let index = 0; index < chunks.length; index++) {
                        const chunk = chunks[index];
                        const bufferKey = `bg-${imageId}-${index}`;
                        const success = safeSetItem(bufferKey, chunk);
                        if (!success) {
                            // Clean up any chunks that were saved
                            bufferKeys.forEach(key => localStorage.removeItem(key));
                            return;
                        }
                        bufferKeys.push(bufferKey);
                    }

                    // Create the new background object
                    const newBackground: IBackground_Image = {
                        id: imageId,
                        type: "image",
                        name: file.name,
                        bufferkeys: bufferKeys,
                    };

                    // Update UploadedFiles
                    const updatedFiles = [...NewlyUploadedFiles, newBackground];
                    NewlyUploadedFiles = updatedFiles;

                    // Save metadata to localStorage
                    const metadataList = updatedFiles.map(bg => ({
                        id: bg.id,
                        type: bg.type,
                        name: bg.name,
                        bufferkeys: bg.bufferkeys
                    }));
                    safeSetItem(STORAGE_KEYS.BACKGROUND_LIST, JSON.stringify(metadataList));
                    loadBackgroundList();
                } catch (error) {
                    alert("Failed to process image. The image might be too large or in an unsupported format.");
                }
            };
            reader.readAsDataURL(file);
        }

        // Update the component state with the newly uploaded files
        setComponentState(prevState => ({
            ...prevState,
            UploadedFiles: [
                ...prevState.UploadedFiles,
                ...NewlyUploadedFiles
            ]
        }));

        handleBackgroundSelect(NewlyUploadedFiles[NewlyUploadedFiles.length - 1]);
    };

    const removeUploadedBackground = (id: string) => {
        const bgToRemove = componentState.UploadedFiles.find(bg => bg.id === id);

        const updatedBackgrounds = componentState.UploadedFiles.filter(bg => bg.id !== id);

        setComponentState(prevState => ({
            ...prevState,
            UploadedFiles: updatedBackgrounds
        }));

        const selectedBg = localStorage.getItem(STORAGE_KEYS.ACTIVE_BACKGROUND);
        if (selectedBg) {
            try {
                const parsedBg = JSON.parse(selectedBg);
                if (parsedBg.id === id) {
                    handleBackgroundSelect(predefinedBackgrounds[0] as IBackground);
                }
            } catch (error) {
                console.error("Error checking selected background:", error);
            }
        }

        try {
            if (bgToRemove) {
                bgToRemove.bufferkeys.forEach(key => {
                    localStorage.removeItem(key);
                });

                if (updatedBackgrounds.length === 0) {
                    localStorage.removeItem(STORAGE_KEYS.BACKGROUND_LIST);
                } else {
                    const metadataList = updatedBackgrounds.map(bg => ({
                        id: bg.id,
                        type: bg.type,
                        name: bg.name,
                        bufferkeys: bg.bufferkeys
                    }));
                    safeSetItem(STORAGE_KEYS.BACKGROUND_LIST, JSON.stringify(metadataList));
                }
            }
        } catch (error) {
            console.error("Error removing background from localStorage:", error);
        }

        loadBackgroundList();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            scrollBehavior="inside"
            motionProps={{
                variants: {
                    enter: {
                        scale: 1,
                        y: "var(--slide-enter)",
                        opacity: 1,
                        transition: {
                            scale: {
                                duration: 0.4,
                                ease: TRANSITION_EASINGS.ease,
                            },
                            opacity: {
                                duration: 0.4,
                                ease: TRANSITION_EASINGS.ease,
                            },
                            y: {
                                type: "spring",
                                bounce: 0,
                                duration: 0.6,
                            },
                        },
                    },
                    exit: {
                        scale: 1.1, // NextUI default 1.03
                        y: "var(--slide-exit)",
                        opacity: 0,
                        transition: {
                            duration: 0.3,
                            ease: TRANSITION_EASINGS.ease,
                        },
                    },
                }
            }}
        >
            <ModalContent
                className="backdrop-blur-md"
                style={{
                    padding: "0",
                    transition: "all 0.5s ease",
                    borderRadius: "10px",
                    background: "var(--bookmark)",
                    border: "1px solid var(--bookmark-border)",
                    boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)"
                }}
            >
                <ModalBody>
                    <Tabs
                        aria-label="User Preferences"
                        placement="top"
                        style={{
                            margin: "0% 20%",
                            padding: "relative"
                        }}
                    >
                        <Tab
                            key="background"
                            title={
                                <div className="flex items-center space-x-2">
                                    <Wallpaper />
                                </div>
                            }
                            value="background"
                        >
                            <div className="flex flex-col gap-4">
                                {
                                    componentState.UploadedFiles.length < MAX_UPLOADS && (
                                        <Card className="backdrop-blur-md">
                                            <CardBody className="backdrop-blur-md">
                                                <div className="flex flex-col gap-2">
                                                    <label htmlFor="bg-upload" className="cursor-pointer">
                                                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center hover:border-primary">
                                                            <CloudUpload className="mx-auto mb-2" />
                                                            <p>Click to upload an image</p>
                                                            <p className="text-xs text-gray-500">JPG, PNG, GIF up to {MAX_FILE_SIZE / (1024 * 1024)}MB</p>
                                                        </div>
                                                        <input
                                                            type="file"
                                                            id="bg-upload"
                                                            accept="image/*"
                                                            className="hidden"
                                                            multiple
                                                            onChange={handleFileUpload}
                                                        />
                                                    </label>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    )
                                }

                                {componentState.UploadedFiles.length > 0 && (
                                    <Card>
                                        <CardBody>

                                            {componentState.UploadedFiles.length >= MAX_UPLOADS && (
                                                <div className="mb-4 p-3 border border-danger-200 dark:border-danger-800 rounded-lg shadow-sm">
                                                    <div className="flex items-center">
                                                        <Warning className="text-danger shrink-0 mr-2" fontSize="small" />
                                                        <div className="flex-1">
                                                            <p className="text-danger font-semibold">Storage limit reached</p>
                                                            <p className="text-danger-600 dark:text-danger-400 text-sm">
                                                                You&apos;ve used all {MAX_UPLOADS} background slots. Please remove existing backgrounds to upload new ones.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mb-4 text-sm text-gray-500">
                                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                                    <div
                                                        className="bg-primary h-2.5 rounded-full"
                                                        style={{
                                                            width: `${Math.min((getLocalStorageUsage() / MAX_IMAGE_Cloud) * 100, 100)}%`
                                                        }}
                                                    />
                                                </div>
                                                <div className="mt-1 flex flex-wrap justify-between gap-y-1 text-xs">
                                                    <span>{Math.round((getLocalStorageUsage() / (1024 * 1024)) * 10) / 10} MB & {componentState.UploadedFiles.length} of {MAX_UPLOADS} image slots used</span>
                                                    <span>{Math.round(MAX_IMAGE_Cloud / (1024 * 1024))} MB total</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {componentState.UploadedFiles.map((bg) => (
                                                    <div
                                                        key={bg.id}
                                                        className={`relative rounded-md overflow-hidden cursor-pointer transition-all hover:opacity-90 ${componentState.UserPreferences.Activebackground.id === bg.id ? 'ring-2 ring-primary' : ''}`}
                                                        onClick={() => handleBackgroundSelect(bg)}
                                                    >
                                                        <div
                                                            className="w-full h-24 bg-center bg-cover"
                                                            style={{
                                                                backgroundImage: bg.bufferkeys?.length > 0
                                                                    ? bg.bufferkeys.length === 1
                                                                        ? `url(${localStorage.getItem(bg.bufferkeys[0])})`
                                                                        : `url(${bg.bufferkeys.map(key => localStorage.getItem(key)).join("")})`
                                                                    : "none"
                                                            }}
                                                        />
                                                        <div className="absolute top-1 right-1">
                                                            <Tooltip content="Remove">
                                                                <Button
                                                                    isIconOnly
                                                                    size="sm"
                                                                    color="danger"
                                                                    variant="flat"
                                                                    onPress={() => removeUploadedBackground(bg.id)}
                                                                >
                                                                    <Delete fontSize="small" />
                                                                </Button>
                                                            </Tooltip>
                                                        </div>
                                                        <div className="p-1 bg-black/30 text-white text-xs truncate backdrop-blur-sm rounded-md">
                                                            {bg.name || "Image"}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardBody>
                                    </Card>
                                )}

                                <Card>
                                    <CardBody>
                                        <Tabs
                                            selectedKey={componentState.Explore_Background_Tab}
                                            onSelectionChange={(key: any) => setComponentState(prevState => ({
                                                ...prevState,
                                                Explore_Background_Tab: key as "gradients" | "colors" | "uploaded"
                                            }))}
                                        >
                                            <Tab key="gradients" title="Gradients" />
                                            <Tab key="colors" title="Solid Colors" />
                                        </Tabs>

                                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {predefinedBackgrounds
                                                .filter((bg) =>
                                                    bg.type === (componentState.Explore_Background_Tab === "gradients" ? "gradient" : "color")
                                                )
                                                .map((bg) => (
                                                    <div
                                                        key={bg.id}
                                                        className={`rounded-md cursor-pointer overflow-hidden transition-all hover:opacity-90 ${componentState.UserPreferences.Activebackground.id === bg.id ? 'ring-2 ring-primary' : ''}`}
                                                        onClick={() => {
                                                            handleBackgroundSelect(bg as IBackground);
                                                            // Update the active background in user preferences
                                                            setComponentState(prevState => ({
                                                                ...prevState,
                                                                Explore_Background_Tab: "gradients"
                                                            }));
                                                        }}
                                                    >
                                                        <div
                                                            className="w-full h-24"
                                                            style={{
                                                                background: bg.type === "color" ? bg.value : "none",
                                                                backgroundImage: bg.type === "gradient" ? bg.value : "none"
                                                            }}
                                                        />
                                                        <div className="p-1 bg-black/30 text-white text-center text-xs">
                                                            {bg.name}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>
                        </Tab>

                        <Tab
                            key="border"
                            title={
                                <div className="flex items-center space-x-2">
                                    <RoundedCorner />
                                    {/* <span>Borders</span> */}
                                </div>
                            }
                            value="border"
                        >
                            <Card>
                                <CardBody>
                                    <h3 className="mb-4">Border Radius: {componentState.UserPreferences.borderRadius}px</h3>
                                    <Slider
                                        step={1}
                                        minValue={0}
                                        maxValue={24}
                                        defaultValue={componentState.UserPreferences.borderRadius}
                                        onChange={(value) => handleBorderRadiusChange(Number(value))}
                                        className="max-w-md"
                                        marks={[
                                            { value: 0, label: "0px" },
                                            { value: 8, label: "8px" },
                                            { value: 16, label: "16px" },
                                            { value: 24, label: "24px" },
                                        ]}
                                    />
                                    <div className="mt-8 flex justify-center">
                                        <div
                                            className="w-32 h-32 bg-primary flex items-center justify-center text-white"
                                            style={{ borderRadius: `${componentState.UserPreferences.borderRadius}px` }}
                                        >
                                            Preview
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Tab>

                        <Tab
                            key="language"
                            title={
                                <div className="flex items-center space-x-2">
                                    <Language />
                                    {/* <span>Language</span> */}
                                </div>
                            }
                            value="language">
                            <Card>
                                <CardBody>
                                    <h3 className="mb-4">Website Language</h3>
                                    <Select
                                        label="Select Language"
                                        defaultSelectedKeys={["en"]} // Default to English
                                        onChange={(e) => handleLanguageChange(e.target.value)}
                                        className="max-w-md"
                                    >
                                        {languages.map((lang) => (
                                            <SelectItem key={lang.code}>
                                                {lang.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                    <p className="mt-4 text-sm text-gray-500">
                                        Note: Language support may be limited in certain parts of the website.
                                    </p>
                                </CardBody>
                            </Card>
                        </Tab>

                        <Tab key="cookies" title={
                            <div className="flex items-center space-x-2">
                                <Cookie />
                                {/* <span>Cookies</span> */}
                            </div>
                        } value="cookies" >
                            <Card>
                                <CardBody>
                                    <h3 className="mb-4">Cookie Preferences</h3>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium">Necessary Cookies</h4>
                                                <p className="text-xs text-gray-500">Required for the website to function properly</p>
                                            </div>
                                            <Button
                                                color="primary"
                                                disabled
                                                size="sm"
                                            >
                                                Always On
                                            </Button>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium">Functional Cookies</h4>
                                                <p className="text-xs text-gray-500">Enhance the functionality of the website</p>
                                            </div>
                                            <Button
                                                color={componentState.UserPreferences.cookiePreferences.functional ? "success" : "default"}
                                                variant={componentState.UserPreferences.cookiePreferences.functional ? "solid" : "bordered"}
                                                size="sm"
                                                onPress={() => handleCookiePreferenceChange("functional", !componentState.UserPreferences.cookiePreferences.functional)}
                                            >
                                                {componentState.UserPreferences.cookiePreferences.functional ? "Enabled" : "Disabled"}
                                            </Button>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium">Performance Cookies</h4>
                                                <p className="text-xs text-gray-500">Enhance the performance of the website</p>
                                            </div>
                                            <Button
                                                color={componentState.UserPreferences.cookiePreferences.performance ? "success" : "default"}
                                                variant={componentState.UserPreferences.cookiePreferences.performance ? "solid" : "bordered"}
                                                size="sm"
                                                onPress={() => handleCookiePreferenceChange("performance", !componentState.UserPreferences.cookiePreferences.performance)}
                                            >
                                                {componentState.UserPreferences.cookiePreferences.performance ? "Enabled" : "Disabled"}
                                            </Button>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium">Analytics Cookies</h4>
                                                <p className="text-xs text-gray-500">Help us improve by collecting anonymous usage data</p>
                                            </div>
                                            <Button
                                                color={componentState.UserPreferences.cookiePreferences.analytics ? "success" : "default"}
                                                variant={componentState.UserPreferences.cookiePreferences.analytics ? "solid" : "bordered"}
                                                size="sm"
                                                onPress={() => handleCookiePreferenceChange("analytics", !componentState.UserPreferences.cookiePreferences.analytics)}
                                            >
                                                {componentState.UserPreferences.cookiePreferences.analytics ? "Enabled" : "Disabled"}
                                            </Button>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium">Marketing Cookies</h4>
                                                <p className="text-xs text-gray-500">Used to display personalized ads and content</p>
                                            </div>
                                            <Button
                                                color={componentState.UserPreferences.cookiePreferences.marketing ? "success" : "default"}
                                                variant={componentState.UserPreferences.cookiePreferences.marketing ? "solid" : "bordered"}
                                                size="sm"
                                                onPress={() => handleCookiePreferenceChange("marketing", !componentState.UserPreferences.cookiePreferences.marketing)}
                                            >
                                                {componentState.UserPreferences.cookiePreferences.marketing ? "Enabled" : "Disabled"}
                                            </Button>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Tab>

                        <Tab key="info" title={
                            <div className="flex items-center space-x-2">
                                <Info />
                                {/* <span>Info</span> */}
                            </div>
                        } value="info" >
                            <Card>
                                <CardBody>
                                    <h3 className="mb-4">Version Info</h3>
                                    <div className="flex flex-col gap-2">
                                        <p><strong>Current Version:</strong> {Config.version}</p>
                                        <p>
                                            <strong>Release Date:</strong> {isFutureDate(new Date(Config.releasedate))
                                                ? "Coming " + getRelativeTime(new Date(Config.releasedate))
                                                : "Released " + getRelativeTime(new Date(Config.releasedate))}
                                        </p>
                                        <Button
                                            as="a"
                                            href={`https://github.com/MeetBhingradiya/MeetBhingradiya/blob/${Config.visiblebranch}/ChangeLog.md`}
                                            target="_blank"
                                            startContent={<Info />}
                                            color="primary"
                                            className="mt-2"
                                            variant="flat"
                                        >
                                            View Changelog
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        </Tab>
                    </Tabs>
                </ModalBody>
            </ModalContent>
        </Modal >
    );
}