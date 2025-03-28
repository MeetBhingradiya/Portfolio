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
    Chip
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
    DragIndicator
} from "@mui/icons-material";
import {
    Card,
    CardContent,
    IconButton,
    TextField,
    Stack,
    FormControlLabel,
    Switch
} from "@mui/material";
import {
    GridContextProvider,
    GridDropZone,
    GridItem,
    swap
} from "react-grid-dnd";
import SvgComponent from "@Components/SVGComponent";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "react-toastify";
import Image from "next/image";

import type {
    IBookmark
} from "./Types";
import {
    DefualtBookmark,
    ILinkOpenTypes
} from "./Types";

interface IBookmarkEditorProps {
    bookmark: IBookmark;
    isAdmin: boolean; // ? If true then you have access to publish, delete & Terminate Bookmark Control Buttons Visible
    isCreateMode: boolean; // ? Validations will be less strict in create mode
    onSave?: (bookmark: IBookmark) => void;
    onCancel?: () => void;
}

function BookmarkEditor({
    bookmark = DefualtBookmark,
    isAdmin = false,
    isCreateMode = false,
    onSave,
    onCancel
}: IBookmarkEditorProps) {
    // Main bookmark state
    const [editedBookmark, setEditedBookmark] = React.useState<IBookmark>({ ...bookmark });

    // UI states
    const [activeTab, setActiveTab] = React.useState<string>("general");
    const [newKeyword, setNewKeyword] = React.useState<string>("");
    const [keywordSuggestions, setKeywordSuggestions] = React.useState<string[]>([]);
    const [isValidUrl, setIsValidUrl] = React.useState<boolean>(true);
    const [isValidAndroidUrl, setIsValidAndroidUrl] = React.useState<boolean>(true);
    const [isValidWindowsUrl, setIsValidWindowsUrl] = React.useState<boolean>(true);
    const [errors, setErrors] = React.useState<{ [key: string]: string }>({});
    const [iconPreviewUrl, setIconPreviewUrl] = React.useState<string>(bookmark.Icon || "");

    // URL validation function
    const validateUrl = (url: string, type: 'main' | 'android' | 'windows'): boolean => {
        if (!url.trim()) return true; // Empty URL is valid (optional fields)

        try {
            new URL(url);

            // For main URL, ensure it's not empty in create mode
            if (type === 'main' && isCreateMode && !url.trim()) {
                setErrors(prev => ({ ...prev, URL: "URL is required" }));
                return false;
            }

            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[type === 'main' ? 'URL' : type === 'android' ? 'Android' : 'Windows'];
                return newErrors;
            });

            return true;
        } catch (e) {
            setErrors(prev => ({
                ...prev,
                [type === 'main' ? 'URL' : type === 'android' ? 'Android' : 'Windows']: "Invalid URL format"
            }));
            return false;
        }
    };

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'URL') {
            const isValid = validateUrl(value, 'main');
            setIsValidUrl(isValid);
        } else if (name === 'Android') {
            const isValid = validateUrl(value, 'android');
            setIsValidAndroidUrl(isValid);
        } else if (name === 'Windows') {
            const isValid = validateUrl(value, 'windows');
            setIsValidWindowsUrl(isValid);
        } else if (name === 'Name' && isCreateMode && !value.trim()) {
            setErrors(prev => ({ ...prev, Name: "Name is required" }));
        } else if (name === 'Name') {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.Name;
                return newErrors;
            });
        }

        setEditedBookmark(prev => ({
            ...prev,
            [name]: value
        }));

        // Generate keyword suggestions when name or description changes
        if ((name === 'Name' || name === 'Description') && value.length > 2) {
            generateKeywordSuggestions(value);
        }
    };

    // Handle switch/checkbox changes
    const handleSwitchChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;

        if (name === 'isServer' && !isAdmin) {
            // Non-admin users cannot change isServer
            return;
        }

        setEditedBookmark(prev => {
            if (name.includes('.')) {
                // Handle nested properties like ClientOptions.isSearchVisible
                const [parent, child] = name.split('.');
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
        setEditedBookmark(prev => {
            if (name.includes('.')) {
                // Handle nested properties
                const [parent, child] = name.split('.');
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
            .replace(/[^\w\s]/g, '') // Remove special characters
            .split(/\s+/)
            .filter(word => word.length > 3); // Only include words longer than 3 characters

        // Remove common words like "and", "the", etc.
        const commonWords = ['and', 'the', 'this', 'that', 'with', 'from', 'your', 'have'];
        const filteredWords = words.filter(word => !commonWords.includes(word));

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
            suggestion => !existingKeywords.includes(suggestion)
        );

        setKeywordSuggestions(newSuggestions);
    };

    // Try to detect favicon from URL
    const detectFavicon = () => {
        toast.info("Favicon Detection Currently not Available");
        // if (!editedBookmark.URL) return;

        // const url = new URL(editedBookmark.URL);
        // const faviconUrl = `${url.protocol}//${url.hostname}/favicon.ico`;

        // // Check if the favicon URL is valid by making a request
        // fetch(faviconUrl)
        //     .then(response => {
        //         if (response.ok) {
        //             setIconPreviewUrl(faviconUrl);

        //             // Update the bookmark with the favicon URL
        //             setEditedBookmark(prev => ({
        //                 ...prev,
        //                 Icon: faviconUrl,
        //                 isSVG: false
        //             }));
        //         } else {
        //             console.error('Favicon not found:', faviconUrl);
        //         }
        //     })
        //     .catch(error => {
        //         fetch(editedBookmark.URL)
        //             .then((response) => response.text())
        //             .then((html) => {
        //                 const parser = new DOMParser();
        //                 const doc = parser.parseFromString(html, 'text/html');
        //                 const link = doc.querySelector("link[rel*='icon']") || doc.querySelector("link[rel*='shortcut icon']");
        //                 const href = link?.getAttribute('href');

        //                 if (href) {
        //                     // Attempt to find HD icon by checking for larger sizes
        //                     const hdLink = doc.querySelector("link[rel*='icon'][sizes='192x192']") ||
        //                         doc.querySelector("link[rel*='icon'][sizes='512x512']") ||
        //                         link;

        //                     const hdHref = hdLink?.getAttribute('href') || href;

        //                     setIconPreviewUrl(hdHref);

        //                     // Update the bookmark with the favicon URL
        //                     setEditedBookmark(prev => ({
        //                         ...prev,
        //                         Icon: hdHref,
        //                         isSVG: false
        //                     }));
        //                 }
        //             })
        //             .catch((error) => {
        //                 console.error('Error fetching website HTML:', error);
        //             });
        //     });
    };

    // Detect if a URL is an Android app deep link
    const detectAndroidAppLink = (url: string): boolean => {
        return url.startsWith('android-app://') ||
            url.startsWith('intent://') ||
            url.includes('market://') ||
            url.includes('play.google.com/store/apps');
    };

    // Detect if a URL is a Windows app deep link
    const detectWindowsAppLink = (url: string): boolean => {
        return url.startsWith('ms-') ||
            url.startsWith('windows://') ||
            url.includes('microsoft.com/store/apps/');
    };

    // Add a new keyword
    const addKeyword = () => {
        if (!newKeyword.trim()) return;

        const keywords = editedBookmark.Keywords || [];

        // Check if keyword already exists
        if (keywords.includes(newKeyword.trim())) {
            setErrors(prev => ({ ...prev, keyword: "Keyword already exists" }));
            return;
        }

        setEditedBookmark(prev => ({
            ...prev,
            Keywords: [...(prev.Keywords || []), newKeyword.trim()]
        }));

        setNewKeyword("");
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.keyword;
            return newErrors;
        });
    };

    // Remove a keyword
    const removeKeyword = (keywordToRemove: string) => {
        setEditedBookmark(prev => ({
            ...prev,
            Keywords: (prev.Keywords || []).filter(keyword => keyword !== keywordToRemove)
        }));
    };

    // Add a suggested keyword
    const addSuggestedKeyword = (suggestion: string) => {
        const keywords = editedBookmark.Keywords || [];

        // Check if keyword already exists
        if (keywords.includes(suggestion.trim())) return;

        setEditedBookmark(prev => ({
            ...prev,
            Keywords: [...(prev.Keywords || []), suggestion.trim()]
        }));

        // Remove from suggestions
        setKeywordSuggestions(prev => prev.filter(s => s !== suggestion));
    };

    // Handle grid changes (drag and drop for keywords)
    const onGridChange = (sourceId: string, sourceIndex: number, targetIndex: number) => {
        if (sourceId === 'keywords') {
            const keywords = [...(editedBookmark.Keywords || [])];
            const newKeywords = swap(keywords, sourceIndex, targetIndex);

            setEditedBookmark(prev => ({
                ...prev,
                Keywords: newKeywords
            }));
        }
    };

    return (
        <div className="flex flex-col w-full max-w-4xl mx-auto p-4 gap-6">
            <h1 className="text-2xl font-bold">
                {isCreateMode ? "Create New Bookmark" : "Edit Bookmark"}
            </h1>
            <div className="flex flex-col gap-4 w-full">
                {/* General Information Tab */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold">Basic Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <Input
                                name="Name"
                                label="Bookmark Name"
                                placeholder="Enter bookmark name"
                                value={editedBookmark.Name}
                                onChange={handleInputChange}
                                isRequired={isCreateMode}
                                isInvalid={!!errors.Name}
                                errorMessage={errors.Name}
                                startContent={<Label className="text-default-400" />}
                            />

                            <Input
                                name="Description"
                                label="Description"
                                placeholder="Enter bookmark description"
                                value={editedBookmark.Description || ""}
                                onChange={handleInputChange}
                                startContent={<Description className="text-default-400" />}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex flex-row gap-2 items-center">
                                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                                    {editedBookmark.Icon ? (
                                        editedBookmark.isSVG ? (
                                            <SvgComponent
                                                svgString={editedBookmark.Icon}
                                                _class="w-10 h-10"
                                                style={{
                                                    color: editedBookmark.SVGStyles?.fill || "#000000"
                                                }}
                                            />
                                        ) : (
                                            <Image
                                                src={editedBookmark.Icon}
                                                alt={editedBookmark.Name}
                                                width={48}
                                                height={48}
                                                style={{
                                                    objectFit: "contain"
                                                }}
                                            />
                                        )
                                    ) : (
                                        <Public className="w-10 h-10 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex flex-col flex-1">
                                    <p className="text-sm font-medium">Bookmark Preview</p>
                                    <p className="text-xs text-gray-500">
                                        Configure icon in the Appearance tab
                                    </p>
                                </div>
                            </div>

                            {editedBookmark.BookmarkID ? (
                                <div className="flex flex-col gap-1">
                                    <p className="text-xs text-gray-500">Bookmark ID</p>
                                    <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                        {editedBookmark.BookmarkID}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    <p className="text-xs text-gray-500">Bookmark ID will be generated on save</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold">URLs & Platform Links</h2>

                    <Card>
                        <CardContent>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <Input
                                        name="URL"
                                        label="Web URL"
                                        placeholder="Enter website URL (https://example.com)"
                                        value={editedBookmark.URL}
                                        onChange={handleInputChange}
                                        isRequired={isCreateMode}
                                        isInvalid={!!errors.URL}
                                        errorMessage={errors.URL}
                                        startContent={<Language className="text-default-400" />}
                                        description="The main web URL for this bookmark"
                                    />

                                    <div className="flex flex-row gap-2 mt-1">
                                        <Button
                                            size="sm"
                                            color="primary"
                                            variant="flat"
                                            onClick={detectFavicon}
                                            isDisabled={!isValidUrl || !editedBookmark.URL}
                                        >
                                            Detect Favicon
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="flat"
                                            isDisabled={!isValidUrl || !editedBookmark.URL}
                                            onClick={() => window.open(editedBookmark.URL, '_blank')}
                                        >
                                            Test URL
                                        </Button>
                                    </div>
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
                                            startContent={<Android className="text-default-400" />}
                                            description="For Android app deep links or Play Store URLs"
                                        />

                                        {editedBookmark.Android && detectAndroidAppLink(editedBookmark.Android) && (
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
                                            startContent={<Window className="text-default-400" />}
                                            description="For Windows app deep links or Microsoft Store URLs"
                                        />

                                        {editedBookmark.Windows && detectWindowsAppLink(editedBookmark.Windows) && (
                                            <div className="text-xs flex items-center gap-1 text-success">
                                                <Info fontSize="small" />
                                                Detected as Windows app link
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col gap-2 mt-2">
                        <h3 className="text-lg font-medium">URL Format Tips</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                                <p className="font-medium">Web URL</p>
                                <p className="text-xs mt-1">Format: https://example.com</p>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                                <p className="font-medium">Android App</p>
                                <p className="text-xs mt-1">Examples:</p>
                                <p className="text-xs">• market://details?id=com.example.app</p>
                                <p className="text-xs">• android-app://com.example.app</p>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                                <p className="font-medium">Windows App</p>
                                <p className="text-xs mt-1">Examples:</p>
                                <p className="text-xs">• ms-windows-store://pdp/?productid=XXX</p>
                                <p className="text-xs">• ms-settings://bluetooth</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Keywords & SEO Tab */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold">Keywords & SEO</h2>

                    <Card>
                        <CardContent>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-row gap-2 items-end">
                                    <div className="flex-1">
                                        <Input
                                            name="newKeyword"
                                            label="Add Keyword"
                                            placeholder="Enter a keyword"
                                            value={newKeyword}
                                            onChange={(e) => setNewKeyword(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
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
                                        onClick={addKeyword}
                                        isDisabled={!newKeyword.trim()}
                                    >
                                        Add
                                    </Button>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <p className="text-sm font-medium">Current Keywords</p>
                                    <p className="text-xs text-gray-500">Drag and drop to reorder</p>

                                    {(!editedBookmark.Keywords || editedBookmark.Keywords.length === 0) && (
                                        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center">
                                            <p className="text-sm text-gray-500">No keywords added yet</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Keywords help improve search visibility
                                            </p>
                                        </div>
                                    )}

                                    {(editedBookmark.Keywords && editedBookmark.Keywords.length > 0) && (
                                        <div className="keywords-container">
                                            <GridContextProvider onChange={onGridChange}>
                                                <GridDropZone
                                                    id="keywords"
                                                    boxesPerRow={3}
                                                    rowHeight={40}
                                                    style={{
                                                        height: `${Math.ceil(editedBookmark.Keywords.length / 3) * 40}px`,
                                                        minHeight: '80px',
                                                    }}
                                                >
                                                    {editedBookmark.Keywords.map((keyword, index) => (
                                                        <GridItem key={`${keyword}-${index}`}>
                                                            <div className="flex items-center p-1">
                                                                <Chip
                                                                    variant="flat"
                                                                    className="cursor-move"
                                                                    startContent={<DragIndicator fontSize="small" />}
                                                                    onClose={() => removeKeyword(keyword)}
                                                                >
                                                                    {keyword}
                                                                </Chip>
                                                            </div>
                                                        </GridItem>
                                                    ))}
                                                </GridDropZone>
                                            </GridContextProvider>
                                        </div>
                                    )}
                                </div>

                                {keywordSuggestions.length > 0 && (
                                    <div className="flex flex-col gap-2 mt-2">
                                        <p className="text-sm font-medium">Suggested Keywords</p>
                                        <div className="flex flex-wrap gap-2">
                                            {keywordSuggestions.map((suggestion, index) => (
                                                <Chip
                                                    key={`suggestion-${index}`}
                                                    variant="flat"
                                                    color="secondary"
                                                    startContent={<Add fontSize="small" />}
                                                    className="cursor-pointer hover:bg-secondary-200"
                                                    onClick={() => addSuggestedKeyword(suggestion)}
                                                >
                                                    {suggestion}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-2 mt-4">
                                    <p className="text-sm font-medium">Description for SEO</p>
                                    <Input
                                        name="Description"
                                        placeholder="Enter a detailed description for better search visibility"
                                        value={editedBookmark.Description || ""}
                                        onChange={handleInputChange}
                                        startContent={<Description className="text-default-400" />}
                                    />
                                    <p className="text-xs text-gray-500">
                                        A good description helps in search results and suggestions
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col gap-2 mt-2">
                        <h3 className="text-lg font-medium">Keyword Tips</h3>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                            <ul className="list-disc ml-5 text-sm space-y-1">
                                <li>Use specific, relevant keywords</li>
                                <li>Include both broad and specific terms</li>
                                <li>Consider including alternative spellings</li>
                                <li>Keep keywords concise (1-3 words each)</li>
                                <li>Arrange most important keywords first</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Icon & Appearance Tab */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold">Icon & Appearance</h2>

                    <Card>
                        <CardContent>
                            <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-3">
                                        <p className="text-sm font-medium">Icon URL</p>
                                        <Input
                                            name="Icon"
                                            placeholder="Enter icon URL (image or SVG)"
                                            value={editedBookmark.Icon || ""}
                                            onChange={(e) => {
                                                setEditedBookmark(prev => ({
                                                    ...prev,
                                                    Icon: e.target.value
                                                }));
                                            }}
                                            startContent={<Public className="text-default-400" />}
                                        />

                                        <div className="flex flex-row items-center gap-2 mt-1">
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={editedBookmark.isSVG || false}
                                                        onChange={handleSwitchChange('isSVG')}
                                                        color="primary"
                                                    />
                                                }
                                                label="Is SVG"
                                            />
                                            <Tooltip content="Toggle if the icon is an SVG string">
                                                <Info fontSize="small" className="text-gray-400" />
                                            </Tooltip>
                                        </div>

                                        {editedBookmark.isSVG && (
                                            <div className="flex flex-col gap-2 mt-2">
                                                <p className="text-sm font-medium">SVG Color</p>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <Input
                                                        type="text"
                                                        placeholder="#000000"
                                                        value={editedBookmark.SVGStyles?.fill || "#000000"}
                                                        onChange={(e) => {
                                                            setEditedBookmark(prev => ({
                                                                ...prev,
                                                                SVGStyles: {
                                                                    ...prev.SVGStyles,
                                                                    fill: e.target.value
                                                                }
                                                            }));
                                                        }}
                                                        startContent={
                                                            <div
                                                                className="w-4 h-4 rounded-full"
                                                                style={{ backgroundColor: editedBookmark.SVGStyles?.fill || "#000000" }}
                                                            />
                                                        }
                                                    />
                                                    <Input
                                                        type="color"
                                                        value={editedBookmark.SVGStyles?.fill || "#000000"}
                                                        onChange={(e) => {
                                                            setEditedBookmark(prev => ({
                                                                ...prev,
                                                                SVGStyles: {
                                                                    ...prev.SVGStyles,
                                                                    fill: e.target.value
                                                                }
                                                            }));
                                                        }}
                                                        className="w-12 h-10"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-3">
                                            <Button
                                                color="primary"
                                                variant="flat"
                                                onClick={detectFavicon}
                                                isDisabled={!isValidUrl || !editedBookmark.URL}
                                            >
                                                Auto-detect from URL
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 items-center">
                                        <p className="text-sm font-medium">Icon Preview</p>
                                        <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                                            {editedBookmark.Icon ? (
                                                editedBookmark.isSVG ? (
                                                    <SvgComponent
                                                        svgString={editedBookmark.Icon}
                                                        _class="w-20 h-20"
                                                        style={{
                                                            color: editedBookmark.SVGStyles?.fill || "#000000"
                                                        }}
                                                    />
                                                ) : (
                                                    <Image
                                                        src={editedBookmark.Icon}
                                                        alt={editedBookmark.Name}
                                                        width={80}
                                                        height={80}
                                                        style={{
                                                            objectFit: "contain"
                                                        }}
                                                        onError={() => {
                                                            setEditedBookmark(prev => ({
                                                                ...prev,
                                                                Icon: ""
                                                            }));
                                                        }}
                                                    />
                                                )
                                            ) : (
                                                <Public className="w-20 h-20 text-gray-400" />
                                            )}
                                        </div>

                                        <div className="mt-3 text-center">
                                            <p className="text-sm">Shown as bookmark icon</p>
                                            {editedBookmark.isSVG && editedBookmark.Icon && (
                                                <p className="text-xs text-success">SVG icons scale well on all devices</p>
                                            )}
                                            {!editedBookmark.isSVG && editedBookmark.Icon && (
                                                <p className="text-xs text-gray-500">For best results, use a square icon (64x64 or larger)</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col gap-2 mt-2">
                        <h3 className="text-lg font-medium">Icon Tips</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                                <p className="font-medium">SVG Icons</p>
                                <p className="text-xs mt-1">
                                    • Provide the raw SVG code<br />
                                    • Toggle &quot;Is SVG&quot; switch<br />
                                    • Adjust the SVG color<br />
                                    • Best for sharp, scalable icons
                                </p>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                                <p className="font-medium">Image Icons</p>
                                <p className="text-xs mt-1">
                                    • Provide a direct image URL<br />
                                    • Make sure &quot;Is SVG&quot; is off<br />
                                    • Use PNG or JPG format<br />
                                    • Square aspect ratio works best
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Client Options Tab */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold">Client Options</h2>

                    <Card>
                        <CardContent>
                            <div className="flex flex-col gap-5">
                                <div className="flex flex-col gap-3">
                                    <p className="text-sm font-medium">Link Platform Priority</p>
                                    <p className="text-xs text-gray-500 mb-2">
                                        When a user clicks on this bookmark, which platform should be prioritized?
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div
                                            className={`flex flex-col gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${editedBookmark.ClientOptions?.OpenLinkPlatformPriority === "web"
                                                ? "border-primary bg-primary-50 dark:bg-primary-900/10"
                                                : "border-gray-200 dark:border-gray-700"
                                                }`}
                                            onClick={() => handleSelectChange("ClientOptions.OpenLinkPlatformPriority", "web")}
                                        >
                                            <div className="flex items-center justify-center">
                                                <Language className={`w-10 h-10 ${editedBookmark.ClientOptions?.OpenLinkPlatformPriority === "web"
                                                    ? "text-primary"
                                                    : "text-gray-400"
                                                    }`} />
                                            </div>
                                            <div className="text-center">
                                                <p className={`font-medium ${editedBookmark.ClientOptions?.OpenLinkPlatformPriority === "web"
                                                    ? "text-primary"
                                                    : ""
                                                    }`}>Web</p>
                                                <p className="text-xs text-gray-500">Open in browser</p>
                                            </div>
                                        </div>

                                        <div
                                            className={`flex flex-col gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${editedBookmark.ClientOptions?.OpenLinkPlatformPriority === "mobile"
                                                ? "border-primary bg-primary-50 dark:bg-primary-900/10"
                                                : "border-gray-200 dark:border-gray-700"
                                                }`}
                                            onClick={() => handleSelectChange("ClientOptions.OpenLinkPlatformPriority", "mobile")}
                                        >
                                            <div className="flex items-center justify-center">
                                                <Android className={`w-10 h-10 ${editedBookmark.ClientOptions?.OpenLinkPlatformPriority === "mobile"
                                                    ? "text-primary"
                                                    : "text-gray-400"
                                                    }`} />
                                            </div>
                                            <div className="text-center">
                                                <p className={`font-medium ${editedBookmark.ClientOptions?.OpenLinkPlatformPriority === "mobile"
                                                    ? "text-primary"
                                                    : ""
                                                    }`}>Mobile</p>
                                                <p className="text-xs text-gray-500">Prefer Android app</p>
                                            </div>
                                        </div>

                                        <div
                                            className={`flex flex-col gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${editedBookmark.ClientOptions?.OpenLinkPlatformPriority === "desktop"
                                                ? "border-primary bg-primary-50 dark:bg-primary-900/10"
                                                : "border-gray-200 dark:border-gray-700"
                                                }`}
                                            onClick={() => handleSelectChange("ClientOptions.OpenLinkPlatformPriority", "desktop")}
                                        >
                                            <div className="flex items-center justify-center">
                                                <Window className={`w-10 h-10 ${editedBookmark.ClientOptions?.OpenLinkPlatformPriority === "desktop"
                                                    ? "text-primary"
                                                    : "text-gray-400"
                                                    }`} />
                                            </div>
                                            <div className="text-center">
                                                <p className={`font-medium ${editedBookmark.ClientOptions?.OpenLinkPlatformPriority === "desktop"
                                                    ? "text-primary"
                                                    : ""
                                                    }`}>Desktop</p>
                                                <p className="text-xs text-gray-500">Prefer Windows app</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 mt-2">
                                    <p className="text-sm font-medium">Link Open Method</p>
                                    <p className="text-xs text-gray-500 mb-2">
                                        How should the link be opened when a user clicks on this bookmark?
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        {Object.values(ILinkOpenTypes).map((method) => (
                                            <div
                                                key={method}
                                                className={`flex flex-col gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${editedBookmark.ClientOptions?.OpenLinkMethod === method
                                                    ? "border-primary bg-primary-50 dark:bg-primary-900/10"
                                                    : "border-gray-200 dark:border-gray-700"
                                                    }`}
                                                onClick={() => handleSelectChange("ClientOptions.OpenLinkMethod", method)}
                                            >
                                                <div className="flex items-center justify-center">
                                                    {method === ILinkOpenTypes.NEW_TAB && (
                                                        <svg viewBox="0 0 24 24" className={`w-8 h-8 ${editedBookmark.ClientOptions?.OpenLinkMethod === method
                                                            ? "text-primary"
                                                            : "text-gray-400"
                                                            }`}>
                                                            <path fill="currentColor" d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83l1.41 1.41L19 6.41V10h2V3h-7z" />
                                                        </svg>
                                                    )}
                                                    {method === ILinkOpenTypes.CURRENT_TAB && (
                                                        <svg viewBox="0 0 24 24" className={`w-8 h-8 ${editedBookmark.ClientOptions?.OpenLinkMethod === method
                                                            ? "text-primary"
                                                            : "text-gray-400"
                                                            }`}>
                                                            <path fill="currentColor" d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83l1.41 1.41L19 6.41V10h2V3h-7z" />
                                                        </svg>
                                                    )}
                                                    {method === ILinkOpenTypes.NEW_WINDOW && (
                                                        <svg viewBox="0 0 24 24" className={`w-8 h-8 ${editedBookmark.ClientOptions?.OpenLinkMethod === method
                                                            ? "text-primary"
                                                            : "text-gray-400"
                                                            }`}>
                                                            <path fill="currentColor" d="M6 8c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm6 12c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm-6 0c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm0-6c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm6 0c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm4-8c0 1.1.9 2 2 2s2-.9 2-2s-.9-2-2-2s-2 .9-2 2zm-4 2c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm6 6c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm0 6c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2z" />
                                                        </svg>
                                                    )}
                                                    {method === ILinkOpenTypes.FULL_SCREEN && (
                                                        <svg viewBox="0 0 24 24" className={`w-8 h-8 ${editedBookmark.ClientOptions?.OpenLinkMethod === method
                                                            ? "text-primary"
                                                            : "text-gray-400"
                                                            }`}>
                                                            <path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="text-center">
                                                    <p className={`font-medium text-sm ${editedBookmark.ClientOptions?.OpenLinkMethod === method
                                                        ? "text-primary"
                                                        : ""
                                                        }`}>
                                                        {method === ILinkOpenTypes.NEW_TAB && "New Tab"}
                                                        {method === ILinkOpenTypes.CURRENT_TAB && "Current Tab"}
                                                        {method === ILinkOpenTypes.NEW_WINDOW && "New Window"}
                                                        {method === ILinkOpenTypes.FULL_SCREEN && "Full Screen"}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 mt-2">
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={editedBookmark.ClientOptions?.isSearchVisible || false}
                                                onChange={handleSwitchChange('ClientOptions.isSearchVisible')}
                                                color="primary"
                                            />
                                        }
                                        label={
                                            <div className="flex flex-col">
                                                <span className="font-medium">Show in Search Results</span>
                                                <span className="text-xs text-gray-500">
                                                    When enabled, this bookmark will appear in search results
                                                </span>
                                            </div>
                                        }
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Admin Controls Tab */}
                {isAdmin && (
                    <div className="flex flex-col gap-4">
                        <h2 className="text-xl font-semibold">Admin Controls</h2>

                        <Card>
                            <CardContent>
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-base font-medium">Publishing Options</h3>
                                        <div className="flex flex-row items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={editedBookmark.isPublished || false}
                                                        onChange={handleSwitchChange('isPublished')}
                                                        color="primary"
                                                    />
                                                }
                                                label={
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">Publish Bookmark</span>
                                                        <span className="text-xs text-gray-500">
                                                            When published, this bookmark will be available to all users
                                                        </span>
                                                    </div>
                                                }
                                            />
                                            <Tooltip content="Publishing makes this bookmark accessible to all users">
                                                <Info fontSize="small" className="text-gray-400" />
                                            </Tooltip>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-base font-medium">Server Options</h3>
                                        <div className="flex flex-row items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={editedBookmark.isServer || false}
                                                        onChange={handleSwitchChange('isServer')}
                                                        color="primary"
                                                    />
                                                }
                                                label={
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">Server-Stored Bookmark</span>
                                                        <span className="text-xs text-gray-500">
                                                            Store this bookmark on the server for cloud synchronization
                                                        </span>
                                                    </div>
                                                }
                                            />
                                            <Cloud className={`text-${editedBookmark.isServer ? 'primary' : 'gray-400'}`} />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 mt-3">
                                        <h3 className="text-base font-medium">Danger Zone</h3>
                                        <div className="border border-danger rounded-lg p-4">
                                            <div className="flex flex-row justify-between items-center">
                                                <div className="flex flex-col">
                                                    <p className="font-medium text-danger">Delete Bookmark</p>
                                                    <p className="text-xs text-gray-500">
                                                        This action cannot be undone
                                                    </p>
                                                </div>
                                                <Button
                                                    color="danger"
                                                    startContent={<Delete />}
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to delete this bookmark? This action cannot be undone.')) {
                                                            setEditedBookmark(prev => ({
                                                                ...prev,
                                                                isDeleted: true
                                                            }));

                                                            onSave && onSave({
                                                                ...editedBookmark,
                                                                isDeleted: true
                                                            });
                                                        }
                                                    }}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {!isCreateMode && (
                                        <div className="flex flex-col gap-2 mt-2">
                                            <p className="text-sm font-medium">Bookmark ID</p>
                                            <div className="flex flex-row gap-2 items-center">
                                                <code className="bg-gray-100 dark:bg-gray-800 p-2 rounded flex-1 font-mono text-sm">
                                                    {editedBookmark.BookmarkID || "No ID"}
                                                </code>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="flat"
                                                    onClick={() => {
                                                        if (editedBookmark.BookmarkID) {
                                                            navigator.clipboard.writeText(editedBookmark.BookmarkID);
                                                        }
                                                    }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                    </svg>
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Buttons at the bottom */}
                <div className="flex flex-row justify-between mt-4">
                    <div className="flex flex-row gap-2">
                        <Button
                            color="danger"
                            variant="flat"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                    </div>

                    <div className="flex flex-row gap-2">
                        <Button
                            color="primary"
                            onClick={() => onSave && onSave(editedBookmark)}
                        >
                            {isCreateMode ? "Create Bookmark" : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BookmarkEditor;