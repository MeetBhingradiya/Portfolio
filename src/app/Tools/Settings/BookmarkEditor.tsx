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
    CheckCircle
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
import Image from "next/image";
import type { IBookmark } from "./Types";
import { DefualtBookmark, ILinkOpenTypes } from "./Types";
import "@Styles/Tools-Bookmark.sass";
import BookmarkItem from "./BookmarkItem";
import BookmarkItemMarketPlace from "./BookmarkItemMarketPlace";
import { motion } from "framer-motion";

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
            generateKeywordSuggestions(value);
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
    const generateKeywordSuggestions = (text: string) => {
        // Split text into words
        const words = text
            .toLowerCase()
            .replace(/[^\w\s]/g, "") // Remove special characters
            .split(/\s+/)
            .filter((word) => word.length > 3); // Only include words longer than 3 characters

        // Remove common words like "and", "the", etc.
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

        // Create suggestions by:
        // 1. Using single words
        // 2. Combining pairs of adjacent words
        const suggestions: string[] = [...filteredWords];

        // Add pairs of words
        for (let i = 0; i < filteredWords.length - 1; i++) {
            suggestions.push(`${filteredWords[i]} ${filteredWords[i + 1]}`);
        }

        // Remove duplicates and limit to 5 suggestions
        const uniqueSuggestions = Array.from(new Set(suggestions)).slice(0, 5);

        // Filter out suggestions that are already in the keywords
        const existingKeywords = editedBookmark.Keywords || [];
        const newSuggestions = uniqueSuggestions.filter(
            (suggestion) => !existingKeywords.includes(suggestion)
        );

        setKeywordSuggestions(newSuggestions);
    };

    // Simple/Advanced mode toggle
    const [isAdvancedMode, setIsAdvancedMode] = React.useState<boolean>(false);
    const [isAutoDetecting, setIsAutoDetecting] = React.useState<boolean>(false);

    // Auto-detect name from URL
    const autoDetectName = async (url: string) => {
        if (!url) return;
        
        try {
            setIsAutoDetecting(true);
            
            // First try direct fetch
            let htmlContent = '';
            let corsUsed = false;

            try {
                const response = await fetch(url, { method: 'GET', mode: 'cors' });
                htmlContent = await response.text();
            } catch {
                // Use CORS proxy if direct fetch fails
                corsUsed = true;
                const corsResponse = await Axios.post('/api/cors', {
                    body: {
                        endpoint: url,
                        method: 'GET',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    }
                });

                if (corsResponse.data.status === 200) {
                    htmlContent = corsResponse.data.data;
                } else {
                    throw new Error('Failed to fetch through CORS proxy');
                }
            }

            // Extract title from HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            const title = doc.querySelector('title')?.textContent?.trim();
            
            if (title) {
                setEditedBookmark(prev => ({
                    ...prev,
                    Name: title
                }));
                toast.success(`Auto-detected name: "${title}" ${corsUsed ? '(via CORS proxy)' : ''}`);
            } else {
                // Fallback to domain name
                const domain = new URL(url).hostname.replace('www.', '');
                const fallbackName = domain.charAt(0).toUpperCase() + domain.slice(1);
                setEditedBookmark(prev => ({
                    ...prev,
                    Name: fallbackName
                }));
                toast.info(`Used domain as name: "${fallbackName}"`);
            }
        } catch (error) {
            console.error('Auto-detect name error:', error);
            // Fallback to domain name on error
            try {
                const domain = new URL(url).hostname.replace('www.', '');
                const fallbackName = domain.charAt(0).toUpperCase() + domain.slice(1);
                setEditedBookmark(prev => ({
                    ...prev,
                    Name: fallbackName
                }));
                toast.info(`Used domain as name: "${fallbackName}"`);
            } catch {
                toast.error('Failed to auto-detect name');
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
    const [faviconDetection, setFaviconDetection] = React.useState({
        isDetecting: false,
        detectedFavicons: [] as Array<{
            url: string;
            size: string;
            type: string;
            source: 'html' | 'default';
            isDefault?: boolean;
        }>,
        selectedFavicon: '',
        error: null as string | null
    });

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

        setFaviconDetection(prev => ({
            ...prev,
            isDetecting: true,
            detectedFavicons: [],
            error: null
        }));

        const detectedFavicons: Array<{
            url: string;
            size: string;
            type: string;
            source: 'html' | 'default';
            isDefault?: boolean;
        }> = [];
        const url = editedBookmark.WebLink;
        const domain = new URL(url).origin;

        try {
            // First, try to fetch the HTML directly
            let htmlContent = '';
            let corsUsed = false;

            try {
                const directResponse = await fetch(url, {
                    method: 'GET',
                    mode: 'cors'
                });
                htmlContent = await directResponse.text();
            } catch (corsError) {
                // If CORS fails, use your CORS proxy API
                console.log('Direct fetch failed, using CORS proxy...');
                corsUsed = true;
                
                const corsResponse = await Axios.post('/api/cors', {
                    body: {
                        endpoint: url,
                        method: 'GET',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    }
                });

                if (corsResponse.data.status === 200) {
                    htmlContent = corsResponse.data.data;
                } else {
                    throw new Error('Failed to fetch through CORS proxy');
                }
            }

            // Parse HTML to find favicon links
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');

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
                    const href = element.getAttribute('href');
                    const sizes = element.getAttribute('sizes') || 'unknown';
                    const type = element.getAttribute('type') || 'unknown';
                    
                    if (href) {
                        let faviconUrl = href;
                        
                        // Handle relative URLs
                        if (href.startsWith('//')) {
                            faviconUrl = `https:${href}`;
                        } else if (href.startsWith('/')) {
                            faviconUrl = `${domain}${href}`;
                        } else if (!href.startsWith('http')) {
                            faviconUrl = `${domain}/${href}`;
                        }
                        
                        detectedFavicons.push({
                            url: faviconUrl,
                            size: sizes,
                            type: type,
                            source: 'html' as const
                        });
                    }
                });
            }

            // Add default favicon.ico if not found in HTML
            const defaultFaviconUrl = `${domain}/favicon.ico`;
            const hasDefaultFavicon = detectedFavicons.some(f => f.url === defaultFaviconUrl);
            
            if (!hasDefaultFavicon) {
                // Check if default favicon exists
                try {
                    let faviconExists = false;
                    
                    try {
                        const response = await fetch(defaultFaviconUrl, { method: 'HEAD' });
                        faviconExists = response.ok;
                    } catch {
                        // Try with CORS proxy
                        if (corsUsed) {
                            const corsResponse = await Axios.post('/api/cors', {
                                body: {
                                    endpoint: defaultFaviconUrl,
                                    method: 'HEAD'
                                }
                            });
                            faviconExists = corsResponse.data.status === 200;
                        }
                    }

                    if (faviconExists) {
                        detectedFavicons.unshift({
                            url: defaultFaviconUrl,
                            size: '16x16',
                            type: 'image/x-icon',
                            source: 'default' as const,
                            isDefault: true
                        });
                    }
                } catch (error) {
                    console.log('Could not verify default favicon:', error);
                }
            }

            // Remove duplicates
            const uniqueFavicons = detectedFavicons.filter((favicon, index, self) => 
                index === self.findIndex(f => f.url === favicon.url)
            );

            // Select default favicon (prefer /favicon.ico, then first HTML found)
            let selectedFavicon = '';
            const defaultFav = uniqueFavicons.find(f => f.isDefault);
            if (defaultFav) {
                selectedFavicon = defaultFav.url;
            } else if (uniqueFavicons.length > 0) {
                selectedFavicon = uniqueFavicons[0].url;
            }

            setFaviconDetection(prev => ({
                ...prev,
                isDetecting: false,
                detectedFavicons: uniqueFavicons,
                selectedFavicon,
                error: null
            }));

            if (uniqueFavicons.length > 0) {
                toast.success(`Found ${uniqueFavicons.length} favicon(s)! ${corsUsed ? '(via CORS proxy)' : ''}`);
            } else {
                toast.warning("No favicons found on this website");
            }

        } catch (error: any) {
            console.error('Favicon detection error:', error);
            setFaviconDetection(prev => ({
                ...prev,
                isDetecting: false,
                error: error.message || 'Failed to detect favicons'
            }));
            toast.error(`Failed to detect favicons: ${error.message}`);
        }
    };

    // Apply selected favicon
    const applySelectedFavicon = () => {
        if (faviconDetection.selectedFavicon) {
            setEditedBookmark(prev => ({
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

    // ? Sync Bookmark to Perent Component for Add/Remove to Device/Cloud
    React.useEffect(() => {
        // For new bookmarks, ensure isCloudSync is enabled if global CloudSync preference is on
        // if (isCreateMode && State?.Preferences?.CloudSync) {
        //     setEditedBookmark(prev => ({
        //         ...prev,
        //         isCloudSync: true
        //     }));
        // }

        setBookmark(editedBookmark);
    }, [editedBookmark]);

    return (
        <div className="Editor w-full mx-auto p-4 gap-6">
            <div className="flex flex-col gap-2 justify-center items-center">
                <Typography
                    variant="h1"
                    className="font-bold text-6xl">
                    {isCreateMode ? (
                        <Book fontSize="inherit" />
                    ) : (
                        <Edit fontSize="inherit" />
                    )}
                </Typography>
                <Typography
                    variant="h4"
                    className="font-bold text-lg">
                    {isCreateMode
                        ? "Create a new bookmark"
                        : "Edit an existing bookmark"}
                </Typography>
                <Typography
                    variant="body1"
                    className="text-gray-500 text-sm">
                    {isCreateMode
                        ? "Fill in the details to create a new bookmark"
                        : "Edit the details of the bookmark below"}
                </Typography>
            </div>

            <div className="flex flex-col gap-7 w-full">
                <div className="flex flex-col gap-4">
                    <motion.div
                        className="flex flex-row gap-5 justify-center items-center flex-wrap "
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
                            style={{
                                width: "20vw"
                            }}
                            drag={true}
                        />
                    </motion.div>
                </div>
            </div>

            <div className="flex flex-col gap-7 w-full">
                {/* Mode Toggle */}
                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            {isAdvancedMode ? (
                                <Security className="text-primary" />
                            ) : (
                                <Star className="text-primary" />
                            )}
                            <div>
                                <h3 className="font-semibold">
                                    {isAdvancedMode ? "Advanced Mode" : "Simple Mode"}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {isAdvancedMode 
                                        ? "Full control with all features" 
                                        : "Quick setup with just URL and name"
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            onPress={() => setIsAdvancedMode(!isAdvancedMode)}>
                            {isAdvancedMode ? "Switch to Simple" : "Advanced Options"}
                        </Button>
                    </div>
                </div>

                {/* Simple Mode */}
                {!isAdvancedMode && (
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Add className="text-primary" />
                                Quick Bookmark Setup
                            </h2>
                            
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex items-start gap-3">
                                    <Info className="text-blue-500 mt-1" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                            Easy Setup
                                        </p>
                                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                            Just enter a URL and we'll automatically detect the website name and icon for you!
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <Input
                                    name="WebLink"
                                    label="Website URL"
                                    placeholder="https://example.com"
                                    value={editedBookmark.WebLink}
                                    onChange={handleInputChange}
                                    isRequired={isCreateMode}
                                    isInvalid={!!errors.URL}
                                    errorMessage={errors.URL}
                                    startContent={<Language className="text-default-400" />}
                                    description="Enter the website URL you want to bookmark"
                                    size="lg"
                                />

                                <Input
                                    name="Name"
                                    label="Bookmark Name (Optional)"
                                    placeholder="We'll auto-detect this from the website"
                                    value={editedBookmark.Name}
                                    onChange={handleInputChange}
                                    startContent={<Label className="text-default-400" />}
                                    description="Leave empty to auto-detect from website title"
                                    size="lg"
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    size="lg"
                                    color="primary"
                                    onPress={handleQuickSetup}
                                    isLoading={isAutoDetecting || faviconDetection.isDetecting}
                                    isDisabled={!editedBookmark.WebLink || !isValidUrl}
                                    className="w-full"
                                    startContent={<CheckCircle />}>
                                    {isAutoDetecting || faviconDetection.isDetecting 
                                        ? "Setting up bookmark..." 
                                        : "Auto-Setup Bookmark"
                                    }
                                </Button>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        onPress={() => window.open(editedBookmark.WebLink, "_blank")}
                                        isDisabled={!editedBookmark.WebLink || !isValidUrl}
                                        startContent={<Language />}>
                                        Test URL
                                    </Button>
                                    <Button
                                        size="sm"
                                        color="secondary"
                                        variant="flat"
                                        onPress={() => setIsAdvancedMode(true)}
                                        startContent={<Security />}>
                                        Advanced Options
                                    </Button>
                                </div>
                            </div>

                            {/* Simple Preview */}
                            {(editedBookmark.Name || editedBookmark.WebLink) && (
                                <div className="mt-4">
                                    <h3 className="text-sm font-semibold mb-3">Preview</h3>
                                    <div className="flex justify-center">
                                        <BookmarkItem
                                            Data={editedBookmark}
                                            isMobileRender={true}
                                            isAdmin={isAdmin}
                                            drag={false}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Advanced Mode */}
                {isAdvancedMode && (
                    <div className="flex flex-col gap-7">
                {/* General Information Tab */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold">Basic Information</h2>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-col gap-2">
                            {editedBookmark.BookmarkID ? (
                                <div className="flex flex-col gap-1">
                                    <p className="text-xs text-gray-500">
                                        Bookmark ID
                                    </p>
                                    <p
                                        className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded flex justify-between items-center"
                                        style={{ color: "var(--font-color)" }}>
                                        {editedBookmark.BookmarkID}
                                        <Button
                                            color="primary"
                                            variant="flat"
                                            isIconOnly
                                            disabled={!isCreateMode}
                                            onPress={RegenerateUUID}>
                                            <Cached />
                                        </Button>
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    <p className="text-xs text-gray-500">
                                        Bookmark ID will be generated on save
                                    </p>
                                </div>
                            )}

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
                </div>
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold">
                        URLs & Platform Links
                    </h2>

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Input
                                name="WebLink"
                                label="Web Link"
                                placeholder="Enter website URL (https://example.com)"
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

                            <div className="flex flex-row gap-2 mt-1">
                                <Button
                                    size="sm"
                                    color="primary"
                                    variant="flat"
                                    onPress={detectFavicon}
                                    isLoading={faviconDetection.isDetecting}
                                    isDisabled={
                                        !isValidUrl || !editedBookmark.WebLink || faviconDetection.isDetecting
                                    }>
                                    {faviconDetection.isDetecting ? "Detecting..." : "Detect Favicon"}
                                </Button>

                                <Button
                                    size="sm"
                                    variant="flat"
                                    isDisabled={
                                        !isValidUrl || !editedBookmark.WebLink
                                    }
                                    onPress={() =>
                                        window.open(
                                            editedBookmark.WebLink,
                                            "_blank"
                                        )
                                    }>
                                    Test URL
                                </Button>
                            </div>

                            {/* Favicon Detection Results */}
                            {(faviconDetection.detectedFavicons.length > 0 || faviconDetection.error) && (
                                <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                        <Photo className="text-default-400" />
                                        Detected Favicons
                                    </h3>
                                    
                                    {faviconDetection.error && (
                                        <div className="text-red-500 text-sm mb-3 flex items-center gap-2">
                                            <Warning className="text-red-500" />
                                            {faviconDetection.error}
                                        </div>
                                    )}

                                    {faviconDetection.detectedFavicons.length > 0 && (
                                        <>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                                {faviconDetection.detectedFavicons.map((favicon, index) => (
                                                    <div
                                                        key={index}
                                                        className={`
                                                            relative border rounded-lg p-2 cursor-pointer transition-all
                                                            ${faviconDetection.selectedFavicon === favicon.url 
                                                                ? 'border-primary bg-primary/10' 
                                                                : 'border-gray-200 dark:border-gray-600 hover:border-primary/50'
                                                            }
                                                        `}
                                                        onClick={() => setFaviconDetection(prev => ({
                                                            ...prev,
                                                            selectedFavicon: favicon.url
                                                        }))}>
                                                        
                                                        <div className="aspect-square flex items-center justify-center mb-2">
                                                            <img
                                                                src={favicon.url}
                                                                alt="Favicon"
                                                                className="max-w-full max-h-full object-contain"
                                                                style={{ maxWidth: '32px', maxHeight: '32px' }}
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                }}
                                                            />
                                                        </div>
                                                        
                                                        <div className="text-xs text-center">
                                                            <div className="font-medium truncate" title={favicon.url}>
                                                                {favicon.isDefault ? 'Default' : favicon.size}
                                                            </div>
                                                            <div className="text-gray-500 truncate">
                                                                {favicon.source === 'default' ? 'favicon.ico' : 'HTML'}
                                                            </div>
                                                        </div>
                                                        
                                                        {faviconDetection.selectedFavicon === favicon.url && (
                                                            <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                                                <CheckCircle style={{ fontSize: '12px', color: 'white' }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <div className="flex justify-between items-center">
                                                <div className="text-xs text-gray-500">
                                                    Selected: {faviconDetection.selectedFavicon || 'None'}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    color="primary"
                                                    isDisabled={!faviconDetection.selectedFavicon}
                                                    onPress={applySelectedFavicon}>
                                                    Apply Favicon
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div className="flex flex-col gap-2">
                                <Input
                                    name="Android"
                                    label="Android App URL/Link"
                                    placeholder="Android app deep link or Play Store URL"
                                    value={editedBookmark.Android || ""}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.Android}
                                    errorMessage={errors.Android}
                                    startContent={
                                        <Android className="text-default-400" />
                                    }
                                    description="For Android app deep links or Play Store URLs"
                                />

                                {editedBookmark.Android &&
                                    detectAndroidAppLink(
                                        editedBookmark.Android
                                    ) && (
                                        <div className="text-xs flex items-center gap-1 text-success">
                                            <Info fontSize="small" />
                                            Detected as Android app link
                                        </div>
                                    )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <Input
                                    name="Windows"
                                    label="Windows App URL/Link"
                                    placeholder="Windows app deep link or Microsoft Store URL"
                                    value={editedBookmark.Windows || ""}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.Windows}
                                    errorMessage={errors.Windows}
                                    startContent={
                                        <Window className="text-default-400" />
                                    }
                                    description="For Windows app deep links or Microsoft Store URLs"
                                />

                                {editedBookmark.Windows &&
                                    detectWindowsAppLink(
                                        editedBookmark.Windows
                                    ) && (
                                        <div className="text-xs flex items-center gap-1 text-success">
                                            <Info fontSize="small" />
                                            Detected as Windows app link
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Keywords & SEO Tab */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold">Keywords</h2>

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-row gap-2 items-end">
                            <div className="flex-1">
                                <Input
                                    name="newKeyword"
                                    label="Add Keyword"
                                    placeholder="Enter a keyword"
                                    value={newKeyword}
                                    onChange={(e) =>
                                        setNewKeyword(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addKeyword();
                                        }
                                    }}
                                    isInvalid={!!errors.keyword}
                                    errorMessage={errors.keyword}
                                />
                            </div>
                            <Button
                                color="primary"
                                onPress={addKeyword}
                                isDisabled={!newKeyword.trim()}>
                                Add
                            </Button>
                        </div>

                        <div className="flex flex-col gap-3">
                            <p className="text-sm font-medium">
                                Current Keywords
                            </p>
                            <p className="text-xs text-gray-500">
                                Drag and drop to reorder
                            </p>

                            {(!editedBookmark.Keywords ||
                                editedBookmark.Keywords.length === 0) && (
                                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center">
                                    <p className="text-sm text-gray-500">
                                        No keywords added yet
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Keywords help improve search visibility
                                    </p>
                                </div>
                            )}

                            {editedBookmark.Keywords &&
                                editedBookmark.Keywords.length > 0 && (
                                    <div className="keywords-container">
                                        <GridContextProvider
                                            onChange={onGridChange}>
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
                        </div>

                        {keywordSuggestions.length > 0 && (
                            <div className="flex flex-col gap-2 mt-2">
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
                </div>

                {/* Icon & Appearance Tab */}
                <div className="flex flex-col gap-6">
                    <h2 className="text-xl font-semibold">Icon & Appearance</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left side - Icon URL + SVG Controls */}
                        <div className="flex flex-col gap-4">
                            <label
                                className="text-sm font-medium"
                                htmlFor="icon-url-input">
                                Icon URL
                            </label>
                            <Input
                                id="icon-url-input"
                                name="Icon"
                                placeholder="Enter icon URL (image or SVG)"
                                value={
                                    (editedBookmark.Icon as string) ||
                                    ("" as string)
                                }
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
                                className="transition-colors"
                            />

                            <div className="flex items-center gap-3 mt-2">
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={
                                                editedBookmark.isSVG || false
                                            }
                                            onChange={handleSwitchChange(
                                                "isSVG"
                                            )}
                                            color="primary"
                                        />
                                    }
                                    label="Is SVG"
                                />
                                <Tooltip content="Toggle if the icon is an SVG string">
                                    <Info
                                        fontSize="small"
                                        className="text-gray-400 cursor-help"
                                    />
                                </Tooltip>
                            </div>

                            {editedBookmark.isSVG && (
                                <div className="flex flex-col gap-3 mt-3">
                                    <label
                                        className="text-sm font-medium"
                                        htmlFor="svg-fill-color">
                                        SVG Color
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            id="svg-fill-color"
                                            type="text"
                                            placeholder="#000000"
                                            value={
                                                editedBookmark?.fillColor ||
                                                "#000000"
                                            }
                                            onChange={(e) =>
                                                setEditedBookmark((prev) => ({
                                                    ...prev,
                                                    fillColor: e.target.value
                                                }))
                                            }
                                            startContent={
                                                <div
                                                    className="w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600"
                                                    style={{
                                                        backgroundColor:
                                                            editedBookmark?.fillColor ||
                                                            "#000000"
                                                    }}
                                                />
                                            }
                                            className="transition-colors"
                                        />
                                        <Input
                                            type="color"
                                            value={
                                                editedBookmark?.fillColor ||
                                                "#000000"
                                            }
                                            onChange={(e) =>
                                                setEditedBookmark((prev) => ({
                                                    ...prev,
                                                    fillColor: e.target.value
                                                }))
                                            }
                                            className="w-12 h-10 p-0 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"
                                            aria-label="Pick SVG fill color"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="mt-4">
                                <Button
                                    color="primary"
                                    variant="flat"
                                    onPress={detectFavicon}
                                    isDisabled={
                                        !isValidUrl || !editedBookmark.WebLink
                                    }
                                    className="transition-opacity disabled:opacity-50">
                                    Auto-detect from URL
                                </Button>
                            </div>
                        </div>

                        {/* Right side - Icon Preview */}
                        <div className="flex flex-col gap-4 items-center">
                            <p className="text-sm font-medium">Icon Preview</p>
                            <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden shadow-inner">
                                {editedBookmark.Icon &&
                                editedBookmark.Icon !== "" &&
                                typeof editedBookmark.Icon === "string" ? (
                                    editedBookmark.isSVG ? (
                                        <SvgComponent
                                            svgString={editedBookmark.Icon as string}
                                            _class="w-20 h-20"
                                            style={{
                                                color:
                                                    editedBookmark?.fillColor ||
                                                    "#000000"
                                            }}
                                        />
                                    ) : (
                                        <Image
                                            src={editedBookmark.Icon as string}
                                            alt={editedBookmark.Name}
                                            width={80}
                                            height={80}
                                            style={{ objectFit: "contain" }}
                                            onError={() =>
                                                setEditedBookmark((prev) => ({
                                                    ...prev,
                                                    Icon: "https://img.icons8.com/fluency/48/bookmark-ribbon.png"
                                                }))
                                            }
                                        />
                                    )
                                ) : (
                                    <Public className="w-20 h-20 text-gray-400" />
                                )}
                            </div>

                            <div className="text-center">
                                <p className="text-sm">
                                    Shown as bookmark icon
                                </p>
                                {editedBookmark.isSVG &&
                                    editedBookmark.Icon && (
                                        <p className="text-xs text-success">
                                            SVG icons scale well on all devices
                                        </p>
                                    )}
                                {!editedBookmark.isSVG &&
                                    editedBookmark.Icon && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            For best results, use a square icon
                                            (64x64 or larger)
                                        </p>
                                    )}
                            </div>
                        </div>
                    </div>

                    {/* Current Icon Display */}
                    {editedBookmark.Icon && typeof editedBookmark.Icon === 'string' && (
                        <div className="mt-2 p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 flex items-center justify-center">
                                    <img
                                        src={editedBookmark.Icon as string}
                                        alt="Current Icon"
                                        className="max-w-full max-h-full object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium">Current Icon</div>
                                    <div className="text-xs text-gray-500 truncate" title={editedBookmark.Icon as string}>
                                        {editedBookmark.Icon as string}
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    color="danger"
                                    variant="light"
                                    onPress={() => setEditedBookmark(prev => ({ ...prev, Icon: '' }))}>
                                    Remove
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Client Options Tab */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold">Platform Priority</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div
                            className={cn(
                                "flex flex-col gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all",
                                editedBookmark.Priority === "web"
                                    ? "border-primary bg-primary/10 dark:bg-primary/20"
                                    : "border-[var(--bookmark-border)] bg-[var(--bookmark)]"
                            )}
                            onClick={() =>
                                handleSelectChange("Priority", "web")
                            }>
                            <div className="flex items-center justify-center">
                                <Language
                                    className={cn(
                                        "w-10 h-10 transition-colors",
                                        editedBookmark.Priority === "web"
                                            ? "text-primary"
                                            : "text-gray-400"
                                    )}
                                />
                            </div>
                            <div className="text-center">
                                <p
                                    className={cn(
                                        "font-medium transition-colors",
                                        editedBookmark.Priority === "web"
                                            ? "text-primary"
                                            : "text-gray-800 dark:text-gray-300"
                                    )}>
                                    Web
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Open in browser
                                </p>
                            </div>
                        </div>
                        <div
                            className={cn(
                                "flex flex-col gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all",
                                editedBookmark.Priority === "android"
                                    ? "border-primary bg-primary/10 dark:bg-primary/20"
                                    : "border-[var(--bookmark-border)] bg-[var(--bookmark)]"
                            )}
                            onClick={() =>
                                handleSelectChange("Priority", "android")
                            }>
                            <div className="flex items-center justify-center">
                                <Android
                                    className={cn(
                                        "w-10 h-10 transition-colors",
                                        editedBookmark.Priority === "android"
                                            ? "text-primary"
                                            : "text-gray-400"
                                    )}
                                />
                            </div>
                            <div className="text-center">
                                <p
                                    className={cn(
                                        "font-medium transition-colors",
                                        editedBookmark.Priority === "android"
                                            ? "text-primary"
                                            : "text-gray-800 dark:text-gray-300"
                                    )}>
                                    Mobile
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Prefer Android app
                                </p>
                            </div>
                        </div>
                        <div
                            className={cn(
                                "flex flex-col gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all",
                                editedBookmark.Priority === "windows"
                                    ? "border-primary bg-primary/10 dark:bg-primary/20"
                                    : "border-[var(--bookmark-border)] bg-[var(--bookmark)]"
                            )}
                            onClick={() =>
                                handleSelectChange("Priority", "windows")
                            }>
                            <div className="flex items-center justify-center">
                                <Window
                                    className={cn(
                                        "w-10 h-10 transition-colors",
                                        editedBookmark.Priority === "windows"
                                            ? "text-primary"
                                            : "text-gray-400"
                                    )}
                                />
                            </div>
                            <div className="text-center">
                                <p
                                    className={cn(
                                        "font-medium transition-colors",
                                        editedBookmark.Priority === "windows"
                                            ? "text-primary"
                                            : "text-gray-800 dark:text-gray-300"
                                    )}>
                                    Desktop
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Prefer Windows app
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold">
                        Cloud & Access Controls
                    </h2>

                    <div className="mt-3 flex flex-col gap-2">
                        <h3 className="text-base font-medium">Restrictions</h3>
                        <div className="flex flex-row items-center gap-4 p-3 shadow-md bg-[var(--bookmark)] border border-[var(--bookmark-border)] rounded-lg">
                            <FormControlLabel
                                className="w-full"
                                control={
                                    <Switch
                                        checked={
                                            editedBookmark.isEditBlock || false
                                        }
                                        onChange={handleSwitchChange(
                                            "isEditBlock"
                                        )}
                                        color="primary"
                                    />
                                }
                                label={
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            Prevent from Edit
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Prevent user from editing this
                                            bookmark
                                        </span>
                                    </div>
                                }
                            />
                            <EditOff
                                className={`text-${editedBookmark.isEditBlock ? "primary" : "gray-400"}`}
                            />
                        </div>

                        <div className="flex flex-row items-center gap-4 p-3 shadow-md bg-[var(--bookmark)] border border-[var(--bookmark-border)] rounded-lg">
                            <FormControlLabel
                                className="w-full"
                                control={
                                    <Switch
                                        checked={
                                            editedBookmark.isDeleteBlock ||
                                            false
                                        }
                                        onChange={handleSwitchChange(
                                            "isDeleteBlock"
                                        )}
                                        color="primary"
                                    />
                                }
                                label={
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            Prevent from Delete
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Prevent user from deleting this
                                            bookmark
                                        </span>
                                    </div>
                                }
                            />
                            <DeleteForever
                                className={`text-${editedBookmark.isDeleteBlock ? "primary" : "gray-400"}`}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="mt-3  flex flex-col gap-2">
                            <h3 className="text-base font-medium">
                                Access Control
                            </h3>

                            {/* For Users */}
                            <div className="flex flex-row items-center gap-4 p-3 shadow-md bg-[var(--bookmark)] border border-[var(--bookmark-border)] rounded-lg">
                                <FormControlLabel
                                    className="w-full select-none"
                                    control={
                                        <Switch
                                            checked={
                                                editedBookmark.isPublished ||
                                                false
                                            }
                                            onChange={handleSwitchChange(
                                                "isPublished"
                                            )}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                Publish
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                When Syncned Bookmark published,
                                                this bookmark will be available
                                                to all users on marketplace
                                            </span>
                                        </div>
                                    }
                                />
                                <Tooltip content="Publishing makes this bookmark accessible to all users">
                                    <Info
                                        fontSize="small"
                                        className="text-gray-400"
                                    />
                                </Tooltip>
                            </div>

                            {/* For Admins */}
                            <div className="flex flex-row items-center gap-4 p-3 shadow-md bg-[var(--bookmark)] border border-[var(--bookmark-border)] rounded-lg">
                                <FormControlLabel
                                    className="w-full"
                                    control={
                                        <Switch
                                            checked={
                                                editedBookmark.isAdminOnly ||
                                                false
                                            }
                                            onChange={handleSwitchChange(
                                                "isAdminOnly"
                                            )}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                Only for Admins
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                When published, this bookmark
                                                will be available to only to
                                                Admin Users
                                            </span>
                                        </div>
                                    }
                                />
                                <Tooltip content="Publishing makes this bookmark accessible to all admins">
                                    <Shield
                                        fontSize="small"
                                        className="text-gray-400"
                                    />
                                </Tooltip>
                            </div>

                            {/* is Sponsors */}
                            <div className="flex flex-row items-center gap-4 p-3 shadow-md bg-[var(--bookmark)] border border-[var(--bookmark-border)] rounded-lg">
                                <FormControlLabel
                                    className="w-full"
                                    control={
                                        <Switch
                                            checked={
                                                editedBookmark.isSponsored ||
                                                false
                                            }
                                            onChange={handleSwitchChange(
                                                "isSponsored"
                                            )}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                Advertisement
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                When published, this bookmark
                                                will serve as a sponsored Tag on
                                                Top Left
                                            </span>
                                        </div>
                                    }
                                />
                                <Tooltip content="Publishing makes this bookmark accessible to all sponsors">
                                    <div
                                        className={cn(
                                            "flex items-center justify-center rounded-md p-1 text-xs font-medium",
                                            editedBookmark.isSponsored
                                                ? "bg-primary text-white"
                                                : "bg-gray-400 text-gray-800"
                                        )}>
                                        AD
                                    </div>
                                </Tooltip>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 mb-2 flex flex-col gap-3">
                        <h3 className="text-base font-medium flex flex-row gap-2">
                            <Cloud className={`text-gray-400`} />
                            Cloud
                        </h3>
                        <div className="flex flex-row items-center gap-4 p-3 shadow-md bg-[var(--bookmark)] border border-[var(--bookmark-border)] rounded-lg">
                            <FormControlLabel
                                className="w-full"
                                disabled={bookmark.isCloudSync && !isCreateMode}
                                control={
                                    <Switch
                                        checked={
                                            editedBookmark.isCloudSync || false
                                        }
                                        onChange={handleSwitchChange(
                                            "isCloudSync"
                                        )}
                                        color="primary"
                                    />
                                }
                                label={
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            Sync on Cloud
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Store this bookmark on the server
                                            for cloud synchronization
                                        </span>
                                    </div>
                                }
                            />
                            <Cloud
                                className={`text-${editedBookmark.isCloudSync ? "primary" : "gray-400"}`}
                            />
                        </div>
                        {bookmark.isCloudSync && !isCreateMode && (
                            <div className="border border-warning rounded-lg p-4 hover:bg-warning/30 backdrop-blur-md shadow-md text-gray-500 hover:text-gray-200 transition-all">
                                <div className="flex flex-row justify-between items-center">
                                    <div className="flex flex-col">
                                        <p className="font-medium text-warning">
                                            Stop Sync
                                        </p>
                                        <p className="text-xs">
                                            Server will Stop Updating this
                                            Bookmark in Your Device, Cloud
                                            Version still available & not Serve
                                            to Users
                                        </p>
                                    </div>
                                    <Button
                                        color="warning"
                                        startContent={<Warning />}>
                                        Stop Sync
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="border border-danger rounded-lg p-4 hover:bg-danger/30 backdrop-blur-md shadow-md text-gray-500 hover:text-gray-200 transition-all duration-300">
                            <div className="flex flex-row justify-between items-center">
                                <div className="flex flex-col">
                                    <p className="font-medium text-danger text-sm">
                                        Delete from Cloud
                                    </p>
                                    <p className="text-xs">
                                        Server will delete this bookmark from
                                        cloud, it will not be available anymore
                                        to others.
                                    </p>
                                </div>
                                <Button
                                    color="danger"
                                    startContent={<Delete />}>
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default BookmarkEditor;
