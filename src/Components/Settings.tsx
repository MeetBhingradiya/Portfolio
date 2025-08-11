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
    SelectItem
} from "@heroui/react";
import {
    Settings as ISettings,
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
    Monitor
} from "@mui/icons-material";
import { Config } from "@Config";
import { getRelativeTime, isFutureDate } from "@Utils/Relativetime";
import { predefinedBackgrounds } from "@Config/Gredients";
import { TRANSITION_EASINGS } from "@heroui/framer-utils";
import { useTheme } from "@Hooks/useTheme";
import { log } from "@Utils";

// ? Type Definitions
const MAX_UPLOADS = 6;
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const MAX_IMAGE_Cloud = 5 * 1024 * 1024;

// ? Storage Keys
const STORAGE_KEYS = {
    USER_PREFERENCES: "USER-PREFERENCES",
    BACKGROUND_LIST: "BG-List",
    ACTIVE_BACKGROUND: "Active-BG",
    BUFFER_KEYS: "BG-BK"
};

interface IBackground_Color {
    id: string;
    name: string;
    type: "color";
    value: string;
}

interface IBackground_Gradient {
    id: string;
    name: string;
    type: "gradient";
    value: string;
}

interface IBackground_Image {
    id: string;
    name: string;
    type: "image";
    bufferkeys: string[];
}

type IBackground = IBackground_Color | IBackground_Gradient | IBackground_Image;

interface IBackgrounds {
    id: string;
    filename: string;
}

interface IUserPreferences {
    Activebackground: IBackground;
    Backgrounds: IBackgrounds[];
    borderRadius: number;
    cookiePreferences: {
        necessary: boolean;
        performance: boolean;
        analytics: boolean;
        marketing: boolean;
        functional: boolean;
    };
}

interface IComponentState {
    Current_Tab:
    | "background"
    | "border"
    | "theme"
    | "language"
    | "cookies"
    | "info";
    Explore_Background_Tab: "gradients" | "colors" | "uploaded";
    UserPreferences: IUserPreferences;
    UploadedFiles: IBackground_Image[];
}

const defaultUserPreferences: IUserPreferences = {
    Activebackground: {
        id: predefinedBackgrounds[0].id,
        name: predefinedBackgrounds[0].name,
        type: predefinedBackgrounds[0].type as "gradient",
        value: predefinedBackgrounds[0].value
    },
    Backgrounds: [],
    borderRadius: 10,
    cookiePreferences: {
        necessary: true,
        performance: true,
        analytics: false,
        marketing: false,
        functional: false
    }
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
    { code: "ar", name: "Arabic" }
];

// Utility: Safe localStorage.setItem with quota error handling
function safeSetItem(key: string, value: string) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error: any) {
        if (error && error.name === "QuotaExceededError") {
            alert(
                "Local storage is full. Please remove some backgrounds or data and try again."
            );
        } else {
            alert("An error occurred while saving data to local storage.");
        }
        return false;
    }
}

export default function Settings({
    isOpen,
    onClose
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const { theme, effectiveMode, setTheme } = useTheme();
    const [componentState, setComponentState] = React.useState<IComponentState>(
        {
            Current_Tab: "background",
            Explore_Background_Tab: "gradients",
            UserPreferences: defaultUserPreferences,
            UploadedFiles: []
        }
    );

    // # Verifyed
    React.useEffect(() => {
        applyBackground();

        const storedPreferences = localStorage.getItem(
            STORAGE_KEYS.USER_PREFERENCES
        );
        if (storedPreferences) {
            try {
                const parsedPreferences = JSON.parse(storedPreferences);
                setComponentState((prevState) => ({
                    ...prevState,
                    UserPreferences: parsedPreferences
                }));
            } catch (error) {
                log("Error loading user preferences:", error);
            }
        }

        loadBackgroundList();
    }, []);

    // # Verifyed
    React.useEffect(() => {
        safeSetItem(
            STORAGE_KEYS.USER_PREFERENCES,
            JSON.stringify(componentState.UserPreferences)
        );
    }, [componentState.UserPreferences]);

    // # Verifyed
    React.useEffect(() => {
        const uploadedFiles = componentState.UploadedFiles;

        if (uploadedFiles.length === 0) {
            localStorage.removeItem(STORAGE_KEYS.BACKGROUND_LIST);
            return;
        }

        const metadataList = uploadedFiles.map((bg) => ({
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
        document.documentElement.style.setProperty(
            "--border-radius",
            `${componentState.UserPreferences.borderRadius}px`
        );
    }, [componentState.UserPreferences.borderRadius]);

    function loadBackgroundList() {
        const storedBackgroundsList = localStorage.getItem(
            STORAGE_KEYS.BACKGROUND_LIST
        );
        if (storedBackgroundsList) {
            try {
                const metadataList = JSON.parse(storedBackgroundsList);
                const loadedBackgrounds = metadataList
                    .map((metadata: any) => {
                        if (
                            !metadata.bufferkeys ||
                            metadata.bufferkeys.length === 0
                        ) {
                            return null;
                        }

                        // ? Check for Corrupted Data
                        const isCorrupted = metadata.bufferkeys.some(
                            (key: string) => {
                                const data = localStorage.getItem(key);
                                if (!data) {
                                    return true;
                                }
                                return false;
                            }
                        );

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
                    })
                    .filter(Boolean);

                setComponentState((prevState) => ({
                    ...prevState,
                    UploadedFiles: loadedBackgrounds
                }));
            } catch (error) {
                log("Error loading backgrounds:", error);
            }
        }
    }

    const applyBackground = () => {
        const SelectedBackgroundData = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);

        if (SelectedBackgroundData) {
            let parsedData = JSON.parse(SelectedBackgroundData);
            parsedData = parsedData.Activebackground;
            const html = document.documentElement;

            if (!parsedData) {
                html.style.background = "none";
                html.style.backgroundImage = predefinedBackgrounds[0].value;
                log("No active background found in user preferences.");
                return;
            }

            if (parsedData?.type === "color") {
                html.style.background = parsedData.value;
                html.style.backgroundImage = "none";
            } else if (parsedData?.type === "gradient") {
                html.style.background = "none";
                html.style.backgroundImage = parsedData.value;
            } else if (parsedData?.type === "image") {
                if (parsedData.bufferkeys && parsedData.bufferkeys.length > 0) {
                    if (parsedData.bufferkeys.length === 1) {
                        const imageData = localStorage.getItem(
                            parsedData.bufferkeys[0]
                        );
                        if (imageData) {
                            html.style.backgroundImage = `url(${imageData})`;
                        } else {
                            html.style.background = "none";
                            html.style.backgroundImage = predefinedBackgrounds[0].value;

                            // ! Fix Currpted Data Using Reset Activebackground Object
                            safeSetItem(
                                STORAGE_KEYS.USER_PREFERENCES,
                                JSON.stringify({
                                    ...componentState.UserPreferences,
                                    Activebackground: predefinedBackgrounds[0]
                                }) 
                            );

                            log("Corrupted data found. Resetting to default background.");
                            return;
                        }
                    } else {
                        let completeImage = "";
                        for (let i = 0; i < parsedData.bufferkeys.length; i++) {
                            const chunk = localStorage.getItem(
                                parsedData.bufferkeys[i]
                            );
                            if (chunk) {
                                completeImage += chunk;
                            } else {
                                parsedData.bufferkeys.forEach((key: string) => {
                                    localStorage.removeItem(key);
                                });

                                html.style.background = "none";
                                html.style.backgroundImage =
                                    predefinedBackgrounds[0].value;

                                // ! Fix Currpted Data Using Reset Activebackground Object
                                safeSetItem(
                                    STORAGE_KEYS.USER_PREFERENCES,
                                    JSON.stringify({
                                        ...componentState.UserPreferences,
                                        Activebackground: predefinedBackgrounds[0]
                                    })
                                );
                                log("Corrupted data found. Resetting to default background.");
                                return;
                            }
                        }
                        html.style.backgroundImage = `url(${completeImage})`;
                    }
                } else {
                    html.style.background = "none";
                    html.style.backgroundImage = predefinedBackgrounds[0].value;
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
        setComponentState((prevState) => ({
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
                    const imageData = localStorage.getItem(
                        background.bufferkeys[0]
                    );
                    if (imageData) {
                        html.style.backgroundImage = `url(${imageData})`;
                    }
                } else {
                    // Multiple chunks - concatenate them
                    let completeImage = "";
                    for (let i = 0; i < background.bufferkeys.length; i++) {
                        const chunk = localStorage.getItem(
                            background.bufferkeys[i]
                        );
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
        setComponentState((prevState) => ({
            ...prevState,
            UserPreferences: {
                ...prevState.UserPreferences,
                Activebackground: background
            }
        }));

        loadBackgroundList();
    };

    const handleBorderRadiusChange = (value: number) => {
        setComponentState((prevState) => ({
            ...prevState,
            UserPreferences: {
                ...prevState.UserPreferences,
                borderRadius: value
            }
        }));
    };

    const handleLanguageChange = (value: string) => {
        log("Language changed to:", value);
    };

    const handleCookiePreferenceChange = (
        key: keyof typeof componentState.UserPreferences.cookiePreferences,
        value: boolean
    ) => {
        setComponentState((prevState) => ({
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
        const bufferKeys = Object.keys(localStorage).filter((key) =>
            key.startsWith("bg-image-")
        );
        const totalBufferKeys = bufferKeys.reduce((total, key) => {
            const value = localStorage.getItem(key);
            return total + (value ? value.length : 0);
        }, 0);

        return totalBufferKeys;
    }

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) return;

        const currentUploadedFiles = componentState.UploadedFiles;
        if (
            currentUploadedFiles.length + event.target.files.length >
            MAX_UPLOADS
        ) {
            alert(
                `You can only upload up to ${MAX_UPLOADS} backgrounds. Please remove some to add new ones.`
            );
            return;
        }

        // Check if the total size of all files exceeds the limit
        const totalSize = Array.from(event.target.files).reduce(
            (acc, file) => acc + file.size,
            0
        );

        if (
            totalSize > MAX_IMAGE_Cloud &&
            getLocalStorageUsage() + totalSize > MAX_IMAGE_Cloud
        ) {
            alert(
                `Total file size exceeds the limit of ${MAX_IMAGE_Cloud / (1024 * 1024)}MB.`
            );
            return;
        }

        let NewlyUploadedFiles: IBackground_Image[] = [...currentUploadedFiles];

        for (let file of event.target.files) {
            if (!file) continue;

            if (file.size > MAX_FILE_SIZE) {
                alert(
                    `File is too large. Maximum file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
                );
                continue;
            }

            // Check the background slots limit
            if (currentUploadedFiles.length >= MAX_UPLOADS) {
                alert(
                    `You can only upload up to ${MAX_UPLOADS} backgrounds. Please remove one to add a new one.`
                );
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
                            bufferKeys.forEach((key) =>
                                localStorage.removeItem(key)
                            );
                            return;
                        }
                        bufferKeys.push(bufferKey);
                    }

                    // Create the new background object
                    const newBackground: IBackground_Image = {
                        id: imageId,
                        type: "image",
                        name: file.name,
                        bufferkeys: bufferKeys
                    };

                    // Update UploadedFiles
                    const updatedFiles = [...NewlyUploadedFiles, newBackground];
                    NewlyUploadedFiles = updatedFiles;

                    // Save metadata to localStorage
                    const metadataList = updatedFiles.map((bg) => ({
                        id: bg.id,
                        type: bg.type,
                        name: bg.name,
                        bufferkeys: bg.bufferkeys
                    }));
                    safeSetItem(
                        STORAGE_KEYS.BACKGROUND_LIST,
                        JSON.stringify(metadataList)
                    );
                    loadBackgroundList();
                } catch (error) {
                    alert(
                        "Failed to process image. The image might be too large or in an unsupported format."
                    );
                }
            };
            reader.readAsDataURL(file);
        }

        // Update the component state with the newly uploaded files
        setComponentState((prevState) => ({
            ...prevState,
            UploadedFiles: [...prevState.UploadedFiles, ...NewlyUploadedFiles]
        }));

        handleBackgroundSelect(
            NewlyUploadedFiles[NewlyUploadedFiles.length - 1]
        );
    };

    const removeUploadedBackground = (id: string) => {
        const bgToRemove = componentState.UploadedFiles.find(
            (bg) => bg.id === id
        );

        const updatedBackgrounds = componentState.UploadedFiles.filter(
            (bg) => bg.id !== id
        );

        setComponentState((prevState) => ({
            ...prevState,
            UploadedFiles: updatedBackgrounds
        }));

        const selectedBg = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
        if (selectedBg) {
            try {
                const parsedBg = JSON.parse(selectedBg);

                if (parsedBg.Activebackground.id === id) {
                    handleBackgroundSelect(
                        predefinedBackgrounds[0] as IBackground
                    );
                }
            } catch (error) {
                log("Error checking selected background:", error);
            }
        }

        try {
            if (bgToRemove) {
                bgToRemove.bufferkeys.forEach((key) => {
                    localStorage.removeItem(key);
                });

                if (updatedBackgrounds.length === 0) {
                    localStorage.removeItem(STORAGE_KEYS.BACKGROUND_LIST);
                } else {
                    const metadataList = updatedBackgrounds.map((bg) => ({
                        id: bg.id,
                        type: bg.type,
                        name: bg.name,
                        bufferkeys: bg.bufferkeys
                    }));
                    safeSetItem(
                        STORAGE_KEYS.BACKGROUND_LIST,
                        JSON.stringify(metadataList)
                    );
                }
            }
        } catch (error) {
            log(
                "Error removing background from localStorage:",
                error
            );
        }

        loadBackgroundList();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="2xl"
            scrollBehavior="outside"
            classNames={{
                base: "bg-transparent",
                backdrop: isOpen ? "bg-black/50 backdrop-blur-sm" : "pointer-events-none bg-transparent",
                wrapper: "items-center justify-center"
            }}
            hideCloseButton
            motionProps={{
                variants: {
                    enter: {
                        scale: 1,
                        y: 0,
                        opacity: 1,
                        transition: {
                            scale: {
                                duration: 0.4,
                                ease: TRANSITION_EASINGS.ease
                            },
                            opacity: {
                                duration: 0.4,
                                ease: TRANSITION_EASINGS.ease
                            },
                            y: {
                                type: "spring",
                                bounce: 0,
                                duration: 0.6
                            }
                        }
                    },
                    exit: {
                        scale: 0.95,
                        y: 10,
                        opacity: 0,
                        transition: {
                            duration: 0.3,
                            ease: TRANSITION_EASINGS.ease
                        }
                    }
                }
            }}>
            <ModalContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl backdrop-blur-xl">
                <ModalHeader className="flex flex-col gap-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg p-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                            <ISettings className="text-2xl text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                Settings
                            </h2>
                            <p className="text-white/90 text-sm font-medium">
                                Customize your experience
                            </p>
                        </div>
                    </div>
                </ModalHeader>
                <ModalBody className="p-6">
                    <Tabs
                        aria-label="User Preferences"
                        placement="top"
                        classNames={{
                            base: "w-full",
                            tabList:
                                "gap-6 w-full relative rounded-lg bg-gray-100 dark:bg-gray-800 p-1",
                            cursor: "w-full bg-white dark:bg-gray-700 shadow-sm",
                            tab: "max-w-fit px-4 py-2 h-10",
                            tabContent:
                                "group-data-[selected=true]:text-blue-600 dark:group-data-[selected=true]:text-blue-400 font-medium",
                            panel: "mt-6"
                        }}>
                        {" "}
                        <Tab
                            key="background"
                            title={
                                <div className="flex items-center space-x-2">
                                    <Wallpaper className="text-lg" />
                                    <span className="hidden sm:inline">
                                        Background
                                    </span>
                                </div>
                            }
                            value="background">
                            <div className="flex flex-col gap-6">
                                {componentState.UploadedFiles.length <
                                    MAX_UPLOADS && (
                                        <Card className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                                            <CardBody className="p-6">
                                                <div className="text-center">
                                                    <div className="flex justify-center mb-4">
                                                        <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                                            <CloudUpload className="text-3xl text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                    </div>
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                        Upload Custom Background
                                                    </h3>
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                                        Add your own background
                                                        image to personalize your
                                                        experience
                                                    </p>
                                                    <label
                                                        htmlFor="bg-upload"
                                                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 cursor-pointer">
                                                        <AddPhotoAlternate className="mr-2" />
                                                        Choose Images
                                                    </label>
                                                    <input
                                                        type="file"
                                                        id="bg-upload"
                                                        accept="image/*"
                                                        className="hidden"
                                                        multiple
                                                        onChange={handleFileUpload}
                                                    />
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                        Max {MAX_UPLOADS} images, up
                                                        to{" "}
                                                        {MAX_FILE_SIZE /
                                                            (1024 * 1024)}
                                                        MB each
                                                    </p>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    )}{" "}
                                {componentState.UploadedFiles.length > 0 && (
                                    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <CardBody className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    Your Backgrounds
                                                </h3>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {
                                                        componentState
                                                            .UploadedFiles
                                                            .length
                                                    }{" "}
                                                    of {MAX_UPLOADS}
                                                </span>
                                            </div>

                                            {componentState.UploadedFiles
                                                .length >= MAX_UPLOADS && (
                                                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                                        <div className="flex items-center">
                                                            <Warning
                                                                className="text-red-500 dark:text-red-400 shrink-0 mr-2"
                                                                fontSize="small"
                                                            />
                                                            <div className="flex-1">
                                                                <p className="text-red-700 dark:text-red-300 font-medium text-sm">
                                                                    Storage limit
                                                                    reached
                                                                </p>
                                                                <p className="text-red-600 dark:text-red-400 text-xs">
                                                                    You&apos;ve used
                                                                    all{" "}
                                                                    {MAX_UPLOADS}{" "}
                                                                    background
                                                                    slots. Remove
                                                                    existing
                                                                    backgrounds to
                                                                    upload new ones.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                            <div className="mb-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        Storage Usage
                                                    </span>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        {Math.round(
                                                            (getLocalStorageUsage() /
                                                                (1024 * 1024)) *
                                                            10
                                                        ) / 10}{" "}
                                                        MB /{" "}
                                                        {Math.round(
                                                            MAX_IMAGE_Cloud /
                                                            (1024 * 1024)
                                                        )}{" "}
                                                        MB
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                                                        style={{
                                                            width: `${Math.min((getLocalStorageUsage() / MAX_IMAGE_Cloud) * 100, 100)}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {" "}
                                                {componentState.UploadedFiles.map(
                                                    (bg) => (
                                                        <div
                                                            key={bg.id}
                                                            className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg group ${componentState
                                                                .UserPreferences
                                                                .Activebackground
                                                                .id ===
                                                                bg.id
                                                                ? "ring-2 ring-blue-500 dark:ring-blue-400 shadow-md"
                                                                : "hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600"
                                                                }`}
                                                            onClick={() =>
                                                                handleBackgroundSelect(
                                                                    bg
                                                                )
                                                            }>
                                                            <div
                                                                className="w-full h-24 bg-center bg-cover bg-gray-100 dark:bg-gray-700"
                                                                style={{
                                                                    backgroundImage:
                                                                        bg
                                                                            .bufferkeys
                                                                            ?.length >
                                                                            0
                                                                            ? bg
                                                                                .bufferkeys
                                                                                .length ===
                                                                                1
                                                                                ? `url(${localStorage.getItem(bg.bufferkeys[0])})`
                                                                                : `url(${bg.bufferkeys.map((key) => localStorage.getItem(key)).join("")})`
                                                                            : "none"
                                                                }}
                                                            />
                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                                <button
                                                                    onClick={(
                                                                        e
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        removeUploadedBackground(
                                                                            bg.id
                                                                        );
                                                                    }}
                                                                    className="p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-colors duration-200">
                                                                    <Delete className="text-sm" />
                                                                </button>
                                                            </div>
                                                            {componentState
                                                                .UserPreferences
                                                                .Activebackground
                                                                .id ===
                                                                bg.id && (
                                                                    <div className="absolute bottom-1 left-1">
                                                                        <div className="p-1 bg-blue-500 text-white rounded-full shadow-md">
                                                                            <Star className="text-sm" />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                                                <p className="text-white text-xs font-medium truncate">
                                                                    {bg.name}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </CardBody>
                                    </Card>
                                )}
                                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <CardBody className="p-6">
                                        <Tabs
                                            selectedKey={
                                                componentState.Explore_Background_Tab
                                            }
                                            onSelectionChange={(key: any) =>
                                                setComponentState(
                                                    (prevState) => ({
                                                        ...prevState,
                                                        Explore_Background_Tab:
                                                            key as
                                                            | "gradients"
                                                            | "colors"
                                                            | "uploaded"
                                                    })
                                                )
                                            }>
                                            <Tab
                                                key="gradients"
                                                title="Gradients"
                                            />
                                            <Tab
                                                key="colors"
                                                title="Solid Colors"
                                            />
                                        </Tabs>

                                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {predefinedBackgrounds
                                                .filter(
                                                    (bg) =>
                                                        bg.type ===
                                                        (componentState.Explore_Background_Tab ===
                                                            "gradients"
                                                            ? "gradient"
                                                            : "color")
                                                )
                                                .map((bg) => (
                                                    <div
                                                        key={bg.id}
                                                        className={`rounded-md cursor-pointer overflow-hidden transition-all hover:opacity-90 ${componentState.UserPreferences.Activebackground.id === bg.id ? "ring-2 ring-primary" : ""}`}
                                                        onClick={() => {
                                                            handleBackgroundSelect(
                                                                bg as IBackground
                                                            );
                                                            // Update the active background in user preferences
                                                            setComponentState(
                                                                (
                                                                    prevState
                                                                ) => ({
                                                                    ...prevState,
                                                                    Explore_Background_Tab:
                                                                        "gradients"
                                                                })
                                                            );
                                                        }}>
                                                        <div
                                                            className="w-full h-24"
                                                            style={{
                                                                background:
                                                                    bg.type ===
                                                                        "color"
                                                                        ? bg.value
                                                                        : "none",
                                                                backgroundImage:
                                                                    bg.type ===
                                                                        "gradient"
                                                                        ? bg.value
                                                                        : "none"
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
                        </Tab>{" "}
                        <Tab
                            key="border"
                            title={
                                <div className="flex items-center space-x-2">
                                    <RoundedCorner className="text-lg" />
                                    <span className="hidden sm:inline">
                                        Border
                                    </span>
                                </div>
                            }
                            value="border">
                            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                                <CardBody className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                                        Border Radius:{" "}
                                        {
                                            componentState.UserPreferences
                                                .borderRadius
                                        }
                                        px
                                    </h3>
                                    <Slider
                                        step={1}
                                        minValue={0}
                                        maxValue={24}
                                        defaultValue={
                                            componentState.UserPreferences
                                                .borderRadius
                                        }
                                        onChange={(value) =>
                                            handleBorderRadiusChange(
                                                Number(value)
                                            )
                                        }
                                        className="max-w-md mb-8"
                                        classNames={{
                                            base: "w-full",
                                            track: "bg-gray-200 dark:bg-gray-700",
                                            filler: "bg-gradient-to-r from-blue-500 to-purple-600",
                                            thumb: "bg-white border-2 border-blue-500 shadow-lg"
                                        }}
                                        marks={[
                                            { value: 0, label: "0px" },
                                            { value: 8, label: "8px" },
                                            { value: 16, label: "16px" },
                                            { value: 24, label: "24px" }
                                        ]}
                                    />
                                    <div className="flex justify-center">
                                        <div className="text-center">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                                Preview
                                            </p>
                                            <div
                                                className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium shadow-lg mx-auto"
                                                style={{
                                                    borderRadius: `${componentState.UserPreferences.borderRadius}px`
                                                }}>
                                                {
                                                    componentState
                                                        .UserPreferences
                                                        .borderRadius
                                                }
                                                px
                                            </div>
                                        </div>{" "}
                                    </div>
                                </CardBody>
                            </Card>
                        </Tab>
                        <Tab
                            key="theme"
                            title={
                                <div className="flex items-center space-x-2">
                                    <Palette className="text-lg" />
                                    <span className="hidden sm:inline">
                                        Theme
                                    </span>
                                </div>
                            }
                            value="theme">
                            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                                <CardBody className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                                        Choose Your Theme
                                    </h3>
                                    <div className="flex flex-col gap-4">
                                        <div
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${theme === "light"
                                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                                }`}
                                            onClick={() => {
                                                setTheme("light");
                                            }}>
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-yellow-100 rounded-full">
                                                    <LightMode className="text-yellow-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                                        Light Mode
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Bright and clean
                                                        interface
                                                    </p>
                                                </div>
                                                {theme === "light" && (
                                                    <div className="ml-auto">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${theme === "dark"
                                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                                }`}
                                            onClick={() => {
                                                setTheme("dark");
                                            }}>
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                                                    <DarkMode className="text-gray-700 dark:text-gray-300" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                                        Dark Mode
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Easy on the eyes in low
                                                        light
                                                    </p>
                                                </div>
                                                {theme === "dark" && (
                                                    <div className="ml-auto">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${theme === "system"
                                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                                }`}
                                            onClick={() => {
                                                setTheme("system");
                                            }}>
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                                    <Monitor className="text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                                        System Default
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Matches your device
                                                        preferences
                                                    </p>
                                                </div>
                                                {theme === "system" && (
                                                    <div className="ml-auto">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Info className="text-lg" />
                                            <span>
                                                Currently using:{" "}
                                                <strong className="text-gray-900 dark:text-white">
                                                    {effectiveMode}
                                                </strong>{" "}
                                                mode
                                            </span>
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
                                    <span className="hidden sm:inline">
                                        Language
                                    </span>
                                </div>
                            }
                            value="language">
                            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                                <CardBody className="p-6">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Website Language</h3>
                                    <Select
                                        label="Select Language"
                                        defaultSelectedKeys={["en"]} // Default to English
                                        onChange={(e) =>
                                            handleLanguageChange(e.target.value)
                                        }
                                        className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 rounded-lg shadow-sm transition-colors duration-200"
                                        listboxProps={{
                                            className: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg shadow-lg"
                                        }}
                                    >
                                        {languages.map((lang) => (
                                            <SelectItem key={lang.code} className="hover:bg-blue-100 dark:hover:bg-blue-900/30">
                                                {lang.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                        Note: Language support may be limited in
                                        certain parts of the website.
                                    </p>
                                </CardBody>
                            </Card>
                        </Tab>
                        <Tab
                            key="cookies"
                            title={
                                <div className="flex items-center space-x-2">
                                    <Cookie />
                                    <span className="hidden sm:inline">
                                        Cookie Preferences
                                    </span>
                                </div>
                            }
                            value="cookies">
                            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                                <CardBody className="p-6">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Cookie Preferences</h3>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium">
                                                    Necessary Cookies
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Required for the website to
                                                    function properly
                                                </p>
                                            </div>
                                            <Button
                                                color="primary"
                                                disabled
                                                size="sm">
                                                Always On
                                            </Button>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium">
                                                    Functional Cookies
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Enhance the functionality of
                                                    the website
                                                </p>
                                            </div>
                                            <Button
                                                color={
                                                    componentState
                                                        .UserPreferences
                                                        .cookiePreferences
                                                        .functional
                                                        ? "success"
                                                        : "default"
                                                }
                                                variant={
                                                    componentState
                                                        .UserPreferences
                                                        .cookiePreferences
                                                        .functional
                                                        ? "solid"
                                                        : "bordered"
                                                }
                                                size="sm"
                                                onPress={() =>
                                                    handleCookiePreferenceChange(
                                                        "functional",
                                                        !componentState
                                                            .UserPreferences
                                                            .cookiePreferences
                                                            .functional
                                                    )
                                                }>
                                                {componentState.UserPreferences
                                                    .cookiePreferences
                                                    .functional
                                                    ? "Enabled"
                                                    : "Disabled"}
                                            </Button>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium">
                                                    Performance Cookies
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Enhance the performance of
                                                    the website
                                                </p>
                                            </div>
                                            <Button
                                                color={
                                                    componentState
                                                        .UserPreferences
                                                        .cookiePreferences
                                                        .performance
                                                        ? "success"
                                                        : "default"
                                                }
                                                variant={
                                                    componentState
                                                        .UserPreferences
                                                        .cookiePreferences
                                                        .performance
                                                        ? "solid"
                                                        : "bordered"
                                                }
                                                size="sm"
                                                onPress={() =>
                                                    handleCookiePreferenceChange(
                                                        "performance",
                                                        !componentState
                                                            .UserPreferences
                                                            .cookiePreferences
                                                            .performance
                                                    )
                                                }>
                                                {componentState.UserPreferences
                                                    .cookiePreferences
                                                    .performance
                                                    ? "Enabled"
                                                    : "Disabled"}
                                            </Button>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium">
                                                    Analytics Cookies
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Help us improve by
                                                    collecting anonymous usage
                                                    data
                                                </p>
                                            </div>
                                            <Button
                                                color={
                                                    componentState
                                                        .UserPreferences
                                                        .cookiePreferences
                                                        .analytics
                                                        ? "success"
                                                        : "default"
                                                }
                                                variant={
                                                    componentState
                                                        .UserPreferences
                                                        .cookiePreferences
                                                        .analytics
                                                        ? "solid"
                                                        : "bordered"
                                                }
                                                size="sm"
                                                onPress={() =>
                                                    handleCookiePreferenceChange(
                                                        "analytics",
                                                        !componentState
                                                            .UserPreferences
                                                            .cookiePreferences
                                                            .analytics
                                                    )
                                                }>
                                                {componentState.UserPreferences
                                                    .cookiePreferences.analytics
                                                    ? "Enabled"
                                                    : "Disabled"}
                                            </Button>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium">
                                                    Marketing Cookies
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Used to display personalized
                                                    ads and content
                                                </p>
                                            </div>
                                            <Button
                                                color={
                                                    componentState
                                                        .UserPreferences
                                                        .cookiePreferences
                                                        .marketing
                                                        ? "success"
                                                        : "default"
                                                }
                                                variant={
                                                    componentState
                                                        .UserPreferences
                                                        .cookiePreferences
                                                        .marketing
                                                        ? "solid"
                                                        : "bordered"
                                                }
                                                size="sm"
                                                onPress={() =>
                                                    handleCookiePreferenceChange(
                                                        "marketing",
                                                        !componentState
                                                            .UserPreferences
                                                            .cookiePreferences
                                                            .marketing
                                                    )
                                                }>
                                                {componentState.UserPreferences
                                                    .cookiePreferences.marketing
                                                    ? "Enabled"
                                                    : "Disabled"}
                                            </Button>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Tab>
                        <Tab
                            key="info"
                            title={
                                <div className="flex items-center space-x-2">
                                    <Info />
                                    <span className="hidden sm:inline">
                                        Info
                                    </span>
                                </div>
                            }
                            value="info">
                            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                                <CardBody className="p-6">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Version</h3>{" "}
                                    <div className="flex flex-col gap-2">
                                        <p>
                                            <strong>Current Version:</strong>{" "}
                                            {Config.version}
                                        </p>
                                        <p>
                                            <strong>Release Date:</strong>{" "}
                                            {(() => {
                                                // Parse DD/MM/YYYY format
                                                const [day, month, year] =
                                                    Config.releasedate
                                                        .split("/")
                                                        .map(Number);
                                                const releaseDate = new Date(
                                                    year,
                                                    month - 1,
                                                    day
                                                ); // month is 0-indexed

                                                return isFutureDate(releaseDate)
                                                    ? "Coming " +
                                                    getRelativeTime(
                                                        releaseDate
                                                    )
                                                    : "Released " +
                                                    getRelativeTime(
                                                        releaseDate
                                                    );
                                            })()}
                                        </p>
                                        <Button
                                            as="a"
                                            href={`https://github.com/MeetBhingradiya/MeetBhingradiya/blob/${Config.visiblebranch}/ChangeLog.md`}
                                            target="_blank"
                                            startContent={<Info />}
                                            color="primary"
                                            className="mt-2"
                                            variant="flat">
                                            View Changelog
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        </Tab>
                    </Tabs>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
