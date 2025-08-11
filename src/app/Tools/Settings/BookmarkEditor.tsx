"use client";

import React from "react";
import {
    Input,
    Button,
    Tabs,
    Tab,
    Tooltip,
    Checkbox,
    Select,
    SelectItem,
    Chip,
    cn
} from "@heroui/react";
import { useWindowCheck } from "@Hooks/useWindowCheck";
import { imageResolver, ImageResolverPresets } from "@Utils/ImageResolver";
import {
    Cloud,
    Delete,
    Public,
    Publish,
    Edit,
    Add,
    Close,
    Language,
    Android,
    Window,
    Description,
    Link,
    LinkOff,
    Info,
    Label,
    Warning,
    DragIndicator,
    LocalMall,
    Book,
    Cached,
    Security,
    Shield,
    Star,
    EditOff,
    DeleteForever,
    Photo,
    CheckCircle,
    AutoAwesome,
    Code,
    Preview,
    Refresh,
    Launch
} from "@mui/icons-material";
import {
    Card,
    CardContent,
    IconButton,
    TextField,
    Stack,
    FormControlLabel,
    Switch,
    Typography
} from "@mui/material";
import {
    GridContextProvider,
    GridDropZone,
    GridItem,
    swap
} from "react-grid-dnd";
import SvgComponent from "@Components/SVGComponent";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { Axios } from "@Utils/Axios";
import { keywordSuggestionService } from "@Utils/KeywordSuggestionService";
import { nameDetectionService } from "@Utils/NameDetectionService";
import type { IBookmark } from "./Types";
import { DefualtBookmark, ILinkOpenTypes } from "./Types";
import "@Styles/Tools-Bookmark.sass";
import BookmarkItem from "./BookmarkItem";
import BookmarkItemMarketPlace from "./BookmarkItemMarketPlace";
import { motion } from "motion/react";

interface IBookmarkEditorProps {
    bookmark: IBookmark;
    setBookmark: (bookmark: IBookmark) => void;
    isAdmin: boolean;
    isCreateMode: boolean;
}

function BookmarkEditor({
    bookmark = DefualtBookmark,
    setBookmark = () => {},
    isAdmin = false,
    isCreateMode = false
}: IBookmarkEditorProps) {
    const constraintsRef = React.useRef<HTMLDivElement>(null);
    const isClient = useWindowCheck();

    // Main bookmark state
    const [editedBookmark, setEditedBookmark] = React.useState<IBookmark>({
        ...bookmark
    });

    const [newKeyword, setNewKeyword] = React.useState<string>("");
    const [keywordSuggestions, setKeywordSuggestions] = React.useState<
        string[]
    >([]);
    const [isValidUrl, setIsValidUrl] = React.useState<boolean>(true);
    const [isSelected, setIsSelected] = React.useState<boolean>(false);
    const [errors, setErrors] = React.useState<{ [key: string]: string }>({});

    // Dynamic icon state for advanced mode
    const [dynamicIconState, setDynamicIconState] = React.useState<{
        template: string;
        isValidating: boolean;
        previewUrl: string;
        error: string;
        isEnabled: boolean;
        preview: string;
        selectedPreset: string;
    }>({
        template: "",
        isValidating: false,
        previewUrl: "",
        error: "",
        isEnabled: false,
        preview: "",
        selectedPreset: ""
    });

    // Favicon detection state
    const [faviconDetection, setFaviconDetection] = React.useState({
        isDetecting: false,
        detectedFavicons: [] as Array<{
            url: string;
            size: string;
            type: string;
            source: "html" | "default";
            isDefault?: boolean;
        }>,
        selectedFavicon: "",
        error: null as string | null
    });

    // Safe window open function to avoid hydration issues
    const safeWindowOpen = (url: string, target: string = "_blank") => {
        if (isClient && typeof window !== "undefined") {
            window.open(url, target);
        }
    };

    function RegenerateUUID() {
        setEditedBookmark({
            ...editedBookmark,
            BookmarkID: uuidv4()
        });
    }

    // URL validation function
    const validateUrl = (
        url: string,
        type: "main" | "android" | "windows"
    ): boolean => {
        if (!url.trim()) return true; // Empty URL is valid (optional fields)

        try {
            new URL(url);

            // For main URL, ensure it's not empty in create mode
            if (type === "main" && isCreateMode && !url.trim()) {
                setErrors((prev) => ({ ...prev, URL: "URL is required" }));
                return false;
            }

            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[
                    type === "main"
                        ? "URL"
                        : type === "android"
                          ? "Android"
                          : "Windows"
                ];
                return newErrors;
            });

            return true;
        } catch (e) {
            setErrors((prev) => ({
                ...prev,
                [type === "main"
                    ? "URL"
                    : type === "android"
                      ? "Android"
                      : "Windows"]: "Invalid URL format"
            }));
            return false;
        }
    };

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === "WebLink") {
            const isValid = validateUrl(value, "main");
            setIsValidUrl(isValid);

            // Auto-detect name and favicon when URL is entered (both simple and advanced mode)
            if (isValid && value.trim()) {
                // Show immediate feedback
                toast.info("🔍 Analyzing website...");

                // Debounce the auto-detection for better UX
                setTimeout(() => {
                    if (value === editedBookmark.WebLink) {
                        // Only if URL hasn't changed
                        // Auto-detect name if not already set or in create mode
                        if (!editedBookmark.Name.trim() || isCreateMode) {
                            autoDetectName(value);
                        }
                        // Always try to detect favicon
                        detectFavicon();
                    }
                }, 800);
            }
        } else if (name === "Android") {
            const isValid = validateUrl(value, "android");
        } else if (name === "Windows") {
            const isValid = validateUrl(value, "windows");
        } else if (name === "Name" && isCreateMode && !value.trim()) {
            setErrors((prev) => ({ ...prev, Name: "Name is required" }));
        } else if (name === "Name") {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.Name;
                return newErrors;
            });
        }

        setEditedBookmark((prev) => ({
            ...prev,
            [name]: value
        }));

        // Generate keyword suggestions when name or description changes
        if ((name === "Name" || name === "Description") && value.length > 2) {
            // Use debounced async call for better performance
            setTimeout(() => {
                generateKeywordSuggestions(value);
            }, 300);
        }
    };

    const handleSwitchChange =
        (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
            const checked = e.target.checked;

            if (
                name === "isPublished" &&
                editedBookmark.isCloudSync === false &&
                editedBookmark.isPublished === false
            ) {
                toast.error(
                    "can't Publish a Bookmark that is not Synced with Cloud"
                );
                return;
            }

            if (name === "isCloudSync" && editedBookmark.isPublished === true) {
                toast.error(
                    "can't Disable Cloud Store for a Published Bookmark instead of Delete the Bookmark"
                );
                return;
            }

            setEditedBookmark((prev) => {
                if (name.includes(".")) {
                    // Handle nested properties like ClientOptions.isSearchVisible
                    const [parent, child] = name.split(".");
                    const parentKey = parent as keyof IBookmark;

                    // Create a new object with the updated property
                    const updatedParent = {
                        ...(prev[parentKey] as Record<string, any>),
                        [child]: checked
                    };

                    return {
                        ...prev,
                        [parentKey]: updatedParent
                    };
                }

                return {
                    ...prev,
                    [name]: checked
                };
            });
        };

    // Handle select changes
    const handleSelectChange = (name: string, value: any) => {
        setEditedBookmark((prev) => {
            if (name.includes(".")) {
                // Handle nested properties
                const [parent, child] = name.split(".");
                const parentKey = parent as keyof IBookmark;

                // Create a new object with the updated property
                const updatedParent = {
                    ...(prev[parentKey] as Record<string, any>),
                    [child]: value
                };

                return {
                    ...prev,
                    [parentKey]: updatedParent
                };
            }

            return {
                ...prev,
                [name]: value
            };
        });
    };

    // Generate keyword suggestions based on the name and description
    const generateKeywordSuggestions = async (text: string) => {
        try {
            // Get enhanced suggestions from external APIs
            const suggestions = await keywordSuggestionService.getSuggestions(
                text,
                editedBookmark.Keywords || []
            );

            // Also get domain-specific suggestions if URL is available
            let domainSuggestions: any[] = [];
            if (editedBookmark.WebLink) {
                domainSuggestions =
                    await keywordSuggestionService.getDomainSuggestions(
                        editedBookmark.WebLink
                    );
            }

            // Combine all suggestions
            const allSuggestions = [...suggestions, ...domainSuggestions];

            // Remove duplicates and limit to top 8
            const uniqueSuggestions = allSuggestions
                .filter(
                    (suggestion, index, self) =>
                        index ===
                        self.findIndex(
                            (s) =>
                                s.keyword.toLowerCase() ===
                                suggestion.keyword.toLowerCase()
                        )
                )
                .sort((a, b) => b.relevance - a.relevance)
                .slice(0, 8)
                .map((s) => s.keyword);

            setKeywordSuggestions(uniqueSuggestions);
        } catch (error) {
            console.error(
                "Enhanced keyword suggestions failed, falling back to local:",
                error
            );

            // Fallback to local suggestions
            const words = text
                .toLowerCase()
                .replace(/[^\w\s]/g, "")
                .split(/\s+/)
                .filter((word) => word.length > 3);

            const commonWords = [
                "and",
                "the",
                "this",
                "that",
                "with",
                "from",
                "your",
                "have"
            ];
            const filteredWords = words.filter(
                (word) => !commonWords.includes(word)
            );

            const suggestions: string[] = [...filteredWords];
            for (let i = 0; i < filteredWords.length - 1; i++) {
                suggestions.push(`${filteredWords[i]} ${filteredWords[i + 1]}`);
            }

            const uniqueSuggestions = Array.from(new Set(suggestions)).slice(
                0,
                5
            );
            const existingKeywords = editedBookmark.Keywords || [];
            const newSuggestions = uniqueSuggestions.filter(
                (suggestion) => !existingKeywords.includes(suggestion)
            );

            setKeywordSuggestions(newSuggestions);
        }
    };

    // Simple/Advanced mode toggle
    const [isAdvancedMode, setIsAdvancedMode] = React.useState<boolean>(false);
    const [isAutoDetecting, setIsAutoDetecting] =
        React.useState<boolean>(false);

    // Auto-detect name from URL using enhanced service
    const autoDetectName = async (url: string) => {
        if (!url) return;

        try {
            setIsAutoDetecting(true);

            const result = await nameDetectionService.detectName(url);

            if (result.name && result.confidence > 0.3) {
                setEditedBookmark((prev) => ({
                    ...prev,
                    Name: result.name
                }));

                toast.success(
                    `Auto-detected name: "${result.name}" (${result.source}, confidence: ${Math.round(result.confidence * 100)}%)`
                );

                // Auto-detect favicon in simple mode
                if (!isAdvancedMode) {
                    setTimeout(() => {
                        detectFavicon();
                    }, 500);
                }

                // Also try to get description if available
                if (result.confidence > 0.7) {
                    try {
                        const description =
                            await nameDetectionService.getDescription(url);
                        if (
                            description &&
                            !(editedBookmark.Description || "").trim()
                        ) {
                            setEditedBookmark((prev) => ({
                                ...prev,
                                Description: description
                            }));
                        }
                    } catch (error) {
                        console.warn("Failed to get description:", error);
                    }
                }

                // Auto-apply detected favicon if available
                if (faviconDetection.selectedFavicon) {
                    setEditedBookmark((prev) => ({
                        ...prev,
                        Icon: faviconDetection.selectedFavicon
                    }));
                }
            } else {
                toast.warning(
                    `Low confidence name detection: "${result.name}"`
                );
            }
        } catch (error) {
            console.error("Enhanced auto-detect name error:", error);

            // Fallback to simple domain name
            try {
                const domain = new URL(url).hostname.replace("www.", "");
                const fallbackName =
                    domain.charAt(0).toUpperCase() + domain.slice(1);
                setEditedBookmark((prev) => ({
                    ...prev,
                    Name: fallbackName
                }));
                toast.info(`Used domain as name: "${fallbackName}"`);

                // Auto-detect favicon in simple mode even for fallback
                if (!isAdvancedMode) {
                    setTimeout(() => {
                        detectFavicon();
                    }, 500);
                }

                // Auto-apply detected favicon if available after detection
                setTimeout(() => {
                    if (faviconDetection.selectedFavicon) {
                        setEditedBookmark((prev) => ({
                            ...prev,
                            Icon: faviconDetection.selectedFavicon
                        }));
                    }
                }, 1000);
            } catch {
                toast.error("Failed to auto-detect name");
            }
        } finally {
            setIsAutoDetecting(false);
        }
    };

    // Quick setup from URL only
    const handleQuickSetup = async () => {
        if (!editedBookmark.WebLink) {
            toast.error("Please enter a URL first");
            return;
        }

        // Auto-detect name if not provided
        if (!editedBookmark.Name.trim()) {
            await autoDetectName(editedBookmark.WebLink);
        }

        // Auto-detect favicon
        await detectFavicon();
    };

    // Try to detect favicon from URL
    const detectFavicon = async () => {
        if (!editedBookmark.WebLink) {
            toast.error("Please enter a web link first");
            return;
        }

        try {
            new URL(editedBookmark.WebLink);
        } catch {
            toast.error("Please enter a valid URL");
            return;
        }

        setFaviconDetection((prev) => ({
            ...prev,
            isDetecting: true,
            detectedFavicons: [],
            error: null
        }));

        const detectedFavicons: Array<{
            url: string;
            size: string;
            type: string;
            source: "html" | "default";
            isDefault?: boolean;
        }> = [];
        const url = editedBookmark.WebLink;
        const domain = new URL(url).origin;

        try {
            // First, try to fetch the HTML directly
            let htmlContent = "";
            let corsUsed = false;

            try {
                const directResponse = await fetch(url, {
                    method: "GET",
                    mode: "cors"
                });
                htmlContent = await directResponse.text();
            } catch (corsError) {
                // If CORS fails, use your CORS proxy API
                console.log("Direct fetch failed, using CORS proxy...");
                corsUsed = true;

                const corsResponse = await Axios.post("/api/cors", {
                    body: {
                        endpoint: url,
                        method: "GET",
                        headers: {
                            "User-Agent":
                                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                        }
                    }
                });

                if (corsResponse.data.status === 200) {
                    htmlContent = corsResponse.data.data;
                } else {
                    throw new Error("Failed to fetch through CORS proxy");
                }
            }

            // Parse HTML to find favicon links
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, "text/html");

            // Standard favicon selectors
            const faviconSelectors = [
                'link[rel="icon"]',
                'link[rel="shortcut icon"]',
                'link[rel="apple-touch-icon"]',
                'link[rel="apple-touch-icon-precomposed"]',
                'link[rel="mask-icon"]',
                'link[rel="fluid-icon"]'
            ];

            // Extract favicons from HTML
            for (const selector of faviconSelectors) {
                const elements = doc.querySelectorAll(selector);
                elements.forEach((element: Element) => {
                    const href = element.getAttribute("href");
                    const sizes = element.getAttribute("sizes") || "unknown";
                    const type = element.getAttribute("type") || "unknown";

                    if (href) {
                        let faviconUrl = href;

                        // Handle relative URLs
                        if (href.startsWith("//")) {
                            faviconUrl = `https:${href}`;
                        } else if (href.startsWith("/")) {
                            faviconUrl = `${domain}${href}`;
                        } else if (!href.startsWith("http")) {
                            faviconUrl = `${domain}/${href}`;
                        }

                        detectedFavicons.push({
                            url: faviconUrl,
                            size: sizes,
                            type: type,
                            source: "html" as const
                        });
                    }
                });
            }

            // Add default favicon.ico if not found in HTML
            const defaultFaviconUrl = `${domain}/favicon.ico`;
            const hasDefaultFavicon = detectedFavicons.some(
                (f) => f.url === defaultFaviconUrl
            );

            if (!hasDefaultFavicon) {
                // Check if default favicon exists
                try {
                    let faviconExists = false;

                    try {
                        const response = await fetch(defaultFaviconUrl, {
                            method: "HEAD"
                        });
                        faviconExists = response.ok;
                    } catch {
                        // Try with CORS proxy
                        if (corsUsed) {
                            const corsResponse = await Axios.post("/api/cors", {
                                body: {
                                    endpoint: defaultFaviconUrl,
                                    method: "HEAD"
                                }
                            });
                            faviconExists = corsResponse.data.status === 200;
                        }
                    }

                    if (faviconExists) {
                        detectedFavicons.unshift({
                            url: defaultFaviconUrl,
                            size: "16x16",
                            type: "image/x-icon",
                            source: "default" as const,
                            isDefault: true
                        });
                    }
                } catch (error) {
                    console.log("Could not verify default favicon:", error);
                }
            }

            // Remove duplicates
            const uniqueFavicons = detectedFavicons.filter(
                (favicon, index, self) =>
                    index === self.findIndex((f) => f.url === favicon.url)
            );

            // Select default favicon (prefer /favicon.ico, then first HTML found)
            let selectedFavicon = "";
            const defaultFav = uniqueFavicons.find((f) => f.isDefault);
            if (defaultFav) {
                selectedFavicon = defaultFav.url;
            } else if (uniqueFavicons.length > 0) {
                selectedFavicon = uniqueFavicons[0].url;
            }

            setFaviconDetection((prev) => ({
                ...prev,
                isDetecting: false,
                detectedFavicons: uniqueFavicons,
                selectedFavicon,
                error: null
            }));

            if (uniqueFavicons.length > 0) {
                toast.success(
                    `Found ${uniqueFavicons.length} favicon(s)! ${corsUsed ? "(via CORS proxy)" : ""}`
                );

                // Auto-apply the selected favicon immediately
                if (selectedFavicon) {
                    setEditedBookmark((prev) => ({
                        ...prev,
                        Icon: selectedFavicon
                    }));
                }
            } else {
                toast.warning("No favicons found on this website");
            }
        } catch (error: any) {
            console.error("Favicon detection error:", error);
            setFaviconDetection((prev) => ({
                ...prev,
                isDetecting: false,
                error: error.message || "Failed to detect favicons"
            }));
            toast.error(`Failed to detect favicons: ${error.message}`);
        }
    };

    // Apply selected favicon
    const applySelectedFavicon = () => {
        if (faviconDetection.selectedFavicon) {
            setEditedBookmark((prev) => ({
                ...prev,
                Icon: faviconDetection.selectedFavicon
            }));
            toast.success("Favicon applied successfully!");
        }
    };

    // Detect if a URL is an Android app deep link
    const detectAndroidAppLink = (url: string): boolean => {
        return (
            url.startsWith("android-app://") ||
            url.startsWith("intent://") ||
            url.includes("market://") ||
            url.includes("play.google.com/store/apps")
        );
    };

    // Detect if a URL is a Windows app deep link
    const detectWindowsAppLink = (url: string): boolean => {
        return (
            url.startsWith("ms-") ||
            url.startsWith("windows://") ||
            url.includes("microsoft.com/store/apps/")
        );
    };

    // Add a new keyword
    const addKeyword = () => {
        if (!newKeyword.trim()) return;

        const keywords = editedBookmark.Keywords || [];

        // Check if keyword already exists
        if (keywords.includes(newKeyword.trim())) {
            setErrors((prev) => ({
                ...prev,
                keyword: "Keyword already exists"
            }));
            return;
        }

        setEditedBookmark((prev) => ({
            ...prev,
            Keywords: [...(prev.Keywords || []), newKeyword.trim()]
        }));

        setNewKeyword("");
        setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.keyword;
            return newErrors;
        });
    };

    // Remove a keyword
    const removeKeyword = (keywordToRemove: string) => {
        setEditedBookmark((prev) => ({
            ...prev,
            Keywords: (prev.Keywords || []).filter(
                (keyword) => keyword !== keywordToRemove
            )
        }));
    };

    // Add a suggested keyword
    const addSuggestedKeyword = (suggestion: string) => {
        const keywords = editedBookmark.Keywords || [];

        // Check if keyword already exists
        if (keywords.includes(suggestion.trim())) return;

        setEditedBookmark((prev) => ({
            ...prev,
            Keywords: [...(prev.Keywords || []), suggestion.trim()]
        }));

        // Remove from suggestions
        setKeywordSuggestions((prev) => prev.filter((s) => s !== suggestion));
    };

    // Handle grid changes (drag and drop for keywords)
    const onGridChange = (
        sourceId: string,
        sourceIndex: number,
        targetIndex: number
    ) => {
        if (sourceId === "keywords") {
            const keywords = [...(editedBookmark.Keywords || [])];
            const newKeywords = swap(keywords, sourceIndex, targetIndex);

            setEditedBookmark((prev) => ({
                ...prev,
                Keywords: newKeywords
            }));
        }
    };

    // Dynamic Icon Resolver functions
    const handleDynamicIconToggle = (enabled: boolean) => {
        setDynamicIconState((prev) => ({
            ...prev,
            isEnabled: enabled,
            template: enabled ? prev.template || "${DATE_ISO}" : "",
            preview: enabled
                ? imageResolver.previewResolvedUrl(
                      prev.template || "${DATE_ISO}"
                  )
                : ""
        }));

        if (enabled) {
            // Set bookmark as dynamic
            setEditedBookmark((prev) => ({
                ...prev,
                isDynamicIcon: true,
                iconTemplate: dynamicIconState.template || "${DATE_ISO}"
            }));
        } else {
            // Remove dynamic properties
            setEditedBookmark((prev) => ({
                ...prev,
                isDynamicIcon: false,
                iconTemplate: undefined
            }));
        }
    };

    const handleTemplateChange = (template: string) => {
        setDynamicIconState((prev) => ({
            ...prev,
            template,
            preview: imageResolver.previewResolvedUrl(template)
        }));

        setEditedBookmark((prev) => ({
            ...prev,
            iconTemplate: template
        }));
    };

    const handlePresetSelect = (presetKey: string) => {
        const presetTemplate =
            ImageResolverPresets[
                presetKey as keyof typeof ImageResolverPresets
            ];
        if (presetTemplate) {
            setDynamicIconState((prev) => ({
                ...prev,
                selectedPreset: presetKey,
                template: presetTemplate,
                preview: imageResolver.previewResolvedUrl(presetTemplate)
            }));

            setEditedBookmark((prev) => ({
                ...prev,
                iconTemplate: presetTemplate,
                Icon: imageResolver.previewResolvedUrl(presetTemplate)
            }));
        }
    };

    const validateDynamicIcon = async () => {
        if (!dynamicIconState.template) return;

        setDynamicIconState((prev) => ({ ...prev, isValidating: true }));

        try {
            const resolvedUrl = await imageResolver.resolveIcon(
                dynamicIconState.template
            );
            setEditedBookmark((prev) => ({
                ...prev,
                Icon: resolvedUrl
            }));

            setDynamicIconState((prev) => ({
                ...prev,
                preview: resolvedUrl,
                isValidating: false
            }));
        } catch (error) {
            console.error("Failed to validate dynamic icon:", error);
            setDynamicIconState((prev) => ({ ...prev, isValidating: false }));
        }
    };

    const insertVariableAtCursor = (variable: string) => {
        const newTemplate = dynamicIconState.template + `\${${variable}}`;
        handleTemplateChange(newTemplate);
    };

    // ? Sync Bookmark to Parent Component for Add/Remove to Device/Cloud
    React.useEffect(() => {
        setBookmark(editedBookmark);

        // Auto-save notification in simple mode when bookmark is complete
        if (
            !isAdvancedMode &&
            isCreateMode &&
            editedBookmark.Name &&
            editedBookmark.WebLink &&
            editedBookmark.Icon
        ) {
            // Show success message that bookmark is ready
            const timer = setTimeout(() => {
                toast.success(
                    "🎉 Bookmark ready! All details detected automatically."
                );
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [editedBookmark, isAdvancedMode, isCreateMode]);

    // Add client-side check to prevent hydration issues
    if (!isClient) {
        return (
            <div className="Editor w-full mx-auto p-4 gap-6">
                <div className="flex justify-center items-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-500">
                            Loading bookmark editor...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
                <div className="text-5xl text-primary mb-2">
                    {isCreateMode ? (
                        <Book fontSize="inherit" />
                    ) : (
                        <Edit fontSize="inherit" />
                    )}
                </div>
                <h1 className="text-2xl font-bold">
                    {isCreateMode ? "Create Bookmark" : "Edit Bookmark"}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    {isCreateMode
                        ? "Add a new bookmark to your collection"
                        : "Update bookmark details"}
                </p>
            </div>

            {/* Preview Section */}
            <div className="flex justify-center">
                <motion.div
                    className="flex gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
                    ref={constraintsRef}>
                    <BookmarkItem
                        dragConstraints={constraintsRef}
                        Data={editedBookmark}
                        isMobileRender={true}
                        isAdmin={isAdmin}
                        drag={true}
                    />
                    <BookmarkItemMarketPlace
                        dragConstraints={constraintsRef}
                        Data={editedBookmark}
                        isAdmin={isAdmin}
                        isSelected={isSelected}
                        toggleSelectBookmark={() => {}}
                        style={{ width: "20vw" }}
                        drag={true}
                    />
                </motion.div>
            </div>

            {/* Mode Toggle */}
            <div className="flex justify-center">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex">
                    <button
                        onClick={() => setIsAdvancedMode(false)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                            !isAdvancedMode
                                ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}>
                        <Star fontSize="small" />
                        Simple
                    </button>
                    <button
                        onClick={() => setIsAdvancedMode(true)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                            isAdvancedMode
                                ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}>
                        <Security fontSize="small" />
                        Advanced
                    </button>
                </div>
            </div>

            {/* Simple Mode */}
            {!isAdvancedMode && (
                <div className="space-y-6">
                    {/* URL Input */}
                    <div className="space-y-4">
                        <Input
                            name="WebLink"
                            label="Website URL"
                            placeholder="https://example.com"
                            value={editedBookmark.WebLink}
                            onChange={handleInputChange}
                            isRequired={isCreateMode}
                            isInvalid={!!errors.URL}
                            errorMessage={errors.URL}
                            startContent={
                                <Language className="text-default-400" />
                            }
                            description="Paste any website URL - we'll detect everything automatically"
                            size="lg"
                        />

                        {/* Website Preview */}
                        {editedBookmark.WebLink && isValidUrl && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center gap-4">
                                    {/* Icon */}
                                    <div className="w-12 h-12 rounded-lg bg-white dark:bg-gray-700 border flex items-center justify-center overflow-hidden">
                                        {editedBookmark.Icon &&
                                        typeof editedBookmark.Icon ===
                                            "string" ? (
                                            <img
                                                src={
                                                    editedBookmark.Icon as string
                                                }
                                                alt="Website icon"
                                                className="w-8 h-8 object-contain"
                                                onError={(e) => {
                                                    const target =
                                                        e.target as HTMLImageElement;
                                                    target.style.display =
                                                        "none";
                                                    const fallback =
                                                        target.nextElementSibling as HTMLElement;
                                                    if (fallback)
                                                        fallback.style.display =
                                                            "flex";
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className="w-8 h-8 flex items-center justify-center text-gray-400"
                                            style={{
                                                display: editedBookmark.Icon
                                                    ? "none"
                                                    : "flex"
                                            }}>
                                            {faviconDetection.isDetecting ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                            ) : (
                                                <Language fontSize="small" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                            {editedBookmark.Name ||
                                                (isAutoDetecting
                                                    ? "Detecting..."
                                                    : new URL(
                                                          editedBookmark.WebLink
                                                      ).hostname)}
                                        </h3>
                                        <p className="text-sm text-gray-500 truncate">
                                            {
                                                new URL(editedBookmark.WebLink)
                                                    .hostname
                                            }
                                        </p>
                                        {editedBookmark.Description && (
                                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                                {editedBookmark.Description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Status */}
                                    <div className="flex items-center gap-2 text-xs">
                                        <span
                                            className={
                                                editedBookmark.Name
                                                    ? "text-green-500"
                                                    : "text-gray-400"
                                            }>
                                            {editedBookmark.Name ? "✓" : "○"}{" "}
                                            Name
                                        </span>
                                        <span
                                            className={
                                                editedBookmark.Icon
                                                    ? "text-green-500"
                                                    : "text-gray-400"
                                            }>
                                            {editedBookmark.Icon ? "✓" : "○"}{" "}
                                            Icon
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Name Override */}
                        {editedBookmark.Name && (
                            <Input
                                name="Name"
                                label="Bookmark Name"
                                placeholder="Custom name (optional)"
                                value={editedBookmark.Name}
                                onChange={handleInputChange}
                                startContent={
                                    <Label className="text-default-400" />
                                }
                                description="Auto-detected - you can change it if needed"
                            />
                        )}

                        {/* Empty State */}
                        {!editedBookmark.WebLink && (
                            <div className="text-center py-12 px-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                                <Language className="mx-auto text-gray-400 text-5xl mb-4" />
                                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                                    Add Your First Bookmark
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Paste any website URL and we&apos;ll
                                    automatically detect the name, icon, and
                                    description
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Advanced Mode */}
            {isAdvancedMode && (
                <div className="space-y-8">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">
                            Basic Information
                        </h2>

                        {editedBookmark.BookmarkID && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">
                                            Bookmark ID
                                        </p>
                                        <code className="text-sm font-mono">
                                            {editedBookmark.BookmarkID}
                                        </code>
                                    </div>
                                    {isCreateMode && (
                                        <Button
                                            variant="flat"
                                            isIconOnly
                                            onPress={RegenerateUUID}
                                            title="Generate new ID">
                                            <Cached />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="grid gap-4">
                            <Input
                                name="Name"
                                label="Bookmark Name"
                                placeholder="Enter bookmark name"
                                value={editedBookmark.Name}
                                onChange={handleInputChange}
                                isRequired={isCreateMode}
                                isInvalid={!!errors.Name}
                                errorMessage={errors.Name}
                                startContent={
                                    <Label className="text-default-400" />
                                }
                            />

                            <Input
                                name="Description"
                                label="Description"
                                placeholder="Enter bookmark description"
                                value={editedBookmark.Description || ""}
                                onChange={handleInputChange}
                                startContent={
                                    <Description className="text-default-400" />
                                }
                            />
                        </div>
                    </div>

                    {/* URLs & Links */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">
                            URLs & Platform Links
                        </h2>

                        <Input
                            name="WebLink"
                            label="Web Link"
                            placeholder="https://example.com"
                            value={editedBookmark.WebLink}
                            onChange={handleInputChange}
                            isRequired={isCreateMode}
                            isInvalid={!!errors.URL}
                            errorMessage={errors.URL}
                            startContent={
                                <Language className="text-default-400" />
                            }
                            description="The main web URL for this bookmark"
                        />

                        <div className="flex gap-2">
                            <Button
                                variant="flat"
                                onPress={detectFavicon}
                                isLoading={faviconDetection.isDetecting}
                                isDisabled={
                                    !isValidUrl || !editedBookmark.WebLink
                                }
                                startContent={<Photo />}>
                                Detect Favicon
                            </Button>
                        </div>

                        {/* Favicon Detection Results */}
                        {faviconDetection.detectedFavicons.length > 0 && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <h3 className="text-sm font-semibold mb-3">
                                    Detected Favicons
                                </h3>

                                <div className="grid grid-cols-4 gap-3 mb-4">
                                    {faviconDetection.detectedFavicons.map(
                                        (favicon, index) => (
                                            <div
                                                key={index}
                                                className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md relative ${
                                                    faviconDetection.selectedFavicon ===
                                                    favicon.url
                                                        ? "border-primary bg-primary/10"
                                                        : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                                                }`}
                                                onClick={() =>
                                                    setFaviconDetection(
                                                        (prev) => ({
                                                            ...prev,
                                                            selectedFavicon:
                                                                favicon.url
                                                        })
                                                    )
                                                }>
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded border flex items-center justify-center overflow-hidden">
                                                        <img
                                                            src={favicon.url}
                                                            alt="Favicon"
                                                            className="w-6 h-6 object-contain"
                                                            onError={(e) => {
                                                                (
                                                                    e.target as HTMLImageElement
                                                                ).style.display =
                                                                    "none";
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="text-center">
                                                        <p
                                                            className="text-xs font-medium truncate w-full"
                                                            title={
                                                                favicon.size
                                                            }>
                                                            {favicon.size}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {favicon.source ===
                                                            "default"
                                                                ? "Default"
                                                                : "HTML"}
                                                            {favicon.isDefault &&
                                                                " ⭐"}
                                                        </p>
                                                    </div>
                                                </div>
                                                {faviconDetection.selectedFavicon ===
                                                    favicon.url && (
                                                    <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                                        <CheckCircle
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                                color: "white"
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>

                                <div className="flex justify-between items-center">
                                    <div className="text-xs text-gray-500">
                                        Selected:{" "}
                                        {faviconDetection.selectedFavicon ||
                                            "None"}
                                    </div>
                                    <Button
                                        size="sm"
                                        color="primary"
                                        isDisabled={
                                            !faviconDetection.selectedFavicon
                                        }
                                        onPress={applySelectedFavicon}>
                                        Apply Favicon
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                name="Android"
                                label="Android App Link"
                                placeholder="Android deep link or Play Store URL"
                                value={editedBookmark.Android || ""}
                                onChange={handleInputChange}
                                isInvalid={!!errors.Android}
                                errorMessage={errors.Android}
                                startContent={
                                    <Android className="text-default-400" />
                                }
                                description="For Android app deep links"
                            />

                            <Input
                                name="Windows"
                                label="Windows App Link"
                                placeholder="Windows deep link or Microsoft Store URL"
                                value={editedBookmark.Windows || ""}
                                onChange={handleInputChange}
                                isInvalid={!!errors.Windows}
                                errorMessage={errors.Windows}
                                startContent={
                                    <Window className="text-default-400" />
                                }
                                description="For Windows app deep links"
                            />
                        </div>
                    </div>

                    {/* Keywords */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Keywords</h2>

                        <div className="flex gap-2">
                            <Input
                                name="newKeyword"
                                label="Add Keyword"
                                placeholder="Enter a keyword"
                                value={newKeyword}
                                onChange={(e) => setNewKeyword(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addKeyword();
                                    }
                                }}
                                isInvalid={!!errors.keyword}
                                errorMessage={errors.keyword}
                                className="flex-1"
                            />
                            <Button
                                color="primary"
                                onPress={addKeyword}
                                isDisabled={!newKeyword.trim()}>
                                Add
                            </Button>
                        </div>

                        {!editedBookmark.Keywords ||
                        editedBookmark.Keywords.length === 0 ? (
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                                <p className="text-sm text-gray-500">
                                    No keywords added yet
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Keywords help improve search visibility
                                </p>
                            </div>
                        ) : (
                            <div className="keywords-container">
                                <GridContextProvider onChange={onGridChange}>
                                    <GridDropZone
                                        id="keywords"
                                        boxesPerRow={4}
                                        rowHeight={40}
                                        style={{
                                            height: `${Math.ceil(editedBookmark.Keywords.length / 4) * 40}px`,
                                            minHeight: "80px"
                                        }}>
                                        {editedBookmark.Keywords.map(
                                            (keyword, index) => (
                                                <GridItem
                                                    key={`${keyword}-${index}`}>
                                                    <div className="flex items-center p-1">
                                                        <Chip
                                                            variant="flat"
                                                            className="cursor-move"
                                                            startContent={
                                                                <DragIndicator fontSize="small" />
                                                            }
                                                            onClose={() =>
                                                                removeKeyword(
                                                                    keyword
                                                                )
                                                            }>
                                                            {keyword}
                                                        </Chip>
                                                    </div>
                                                </GridItem>
                                            )
                                        )}
                                    </GridDropZone>
                                </GridContextProvider>
                            </div>
                        )}

                        {keywordSuggestions.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium">
                                    Suggested Keywords
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {keywordSuggestions.map(
                                        (suggestion, index) => (
                                            <Chip
                                                key={`suggestion-${index}`}
                                                variant="flat"
                                                color="secondary"
                                                startContent={
                                                    <Add fontSize="small" />
                                                }
                                                className="cursor-pointer hover:bg-secondary-200"
                                                onClick={() =>
                                                    addSuggestedKeyword(
                                                        suggestion
                                                    )
                                                }>
                                                {suggestion}
                                            </Chip>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Icon & Appearance */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">
                            Icon & Appearance
                        </h2>

                        <Input
                            name="Icon"
                            label="Icon URL"
                            placeholder="Enter icon URL (image or SVG)"
                            value={(editedBookmark.Icon as string) || ""}
                            onChange={(e) =>
                                setEditedBookmark((prev) => ({
                                    ...prev,
                                    Icon: e.target.value
                                }))
                            }
                            isClearable
                            onClear={() =>
                                setEditedBookmark((prev) => ({
                                    ...prev,
                                    Icon: ""
                                }))
                            }
                            startContent={
                                <Public className="text-default-400" />
                            }
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default BookmarkEditor;
