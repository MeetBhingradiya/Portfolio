"use client";

import React, { useState, useEffect } from "react";
import {
    CopyAll,
    ContentCopy,
    Download,
    Search,
    Error,
    CheckCircle,
    Public,
    CloudDownload,
    Close
} from "@mui/icons-material";
import { CircularProgress } from "@mui/material";
import { Tooltip, Input, Select, SelectItem, Button } from "@heroui/react";
import { Axios } from "../../../Utils/Axios";
import "@Styles/Tools-CRX.sass";

// Extension download URL format (CRX v3 format)
const CRX_URL =
    "https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx3&prodversion=@PRODVERSION&x=id%3D@EXTENSIONID%26installsource%3Dondemand%26uc&nacl_arch=@NACL_ARCH";
// Extension ZIP download URL format (same as CRX but handled differently on the client)
const ZIP_URL =
    "https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx3&prodversion=@PRODVERSION&x=id%3D@EXTENSIONID%26installsource%3Dondemand%26uc&nacl_arch=@NACL_ARCH";
// Chrome Web Store detail page URL format
const WEBSTORE_URL = "https://chromewebstore.google.com/detail/@EXTENSIONID";
// Default extension icon if none is found
const DEFAULT_ICON =
    "https://www.google.com/chrome/static/images/chrome-logo.svg";

// TypeScript interfaces
interface ChromeVersion {
    version: string;
    name?: string;
}

interface ExtensionInfo {
    name: string;
    description: string;
    icon: string;
    users: string;
    rating: string;
    website: string | null;
}

interface AppState {
    id: string;
    version: string;
    versions: ChromeVersion[];
    isFirstRender: boolean;
    isLoading: boolean;
    extension: ExtensionInfo | null;
    error: string | null;
}

function CRXDownload() {
    const [state, setState] = useState<AppState>({
        id: "bppamachkoflopbagkdoflbgfjflfnfl", // Default extension ID
        version: "131",
        versions: [],
        isFirstRender: true,
        isLoading: false,
        extension: null,
        error: null
    });

    // Get Chrome browser version
    function getChromeVersion() {
        const pieces = navigator.userAgent.match(
            /Chrom(?:e|ium)\/([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)/
        );
        if (pieces == null || pieces.length != 5) {
            return { major: 131, minor: 0, build: 0, patch: 0 };
        }
        const numPieces = pieces.map((piece) => parseInt(piece, 10));
        return {
            major: numPieces[1],
            minor: numPieces[2],
            build: numPieces[3],
            patch: numPieces[4]
        };
    }

    // Extract extension ID from Chrome Web Store URL
    function extractExtensionId(input: string): string {
        // If the input is already just an ID (alphanumeric string), return it
        if (/^[a-zA-Z0-9]+$/.test(input)) {
            return input;
        }

        // Modern Chrome Web Store URL format: chrome.google.com/webstore/detail/[name]/[id]
        // or chromewebstore.google.com/detail/[name]/[id]
        // or chrome.google.com/webstore/detail/[id]
        // or chromewebstore.google.com/detail/[id]
        const modernPattern =
            /(?:chrome\.google\.com\/webstore\/detail|chromewebstore\.google\.com\/detail)(?:\/[^\/]+)?\/([a-zA-Z0-9]+)/i;
        const modernMatch = input.match(modernPattern);

        if (modernMatch && modernMatch[1]) {
            return modernMatch[1];
        }

        return input; // Return the original input if no pattern matches
    }

    // Get processor architecture for extension compatibility
    function getNaclArch() {
        let naclArch = "arm";
        if (navigator.userAgent.indexOf("x86") > 0) {
            naclArch = "x86-32";
        } else if (navigator.userAgent.indexOf("x64") > 0) {
            naclArch = "x86-64";
        }
        return naclArch;
    }

    // Convert ArrayBuffer to Blob (for ZIP conversion)
    function arrayBufferToBlob(arraybuffer: any) {
        const buf = new Uint8Array(arraybuffer);
        let publicKeyLength, signatureLength, header, zipStartOffset;

        if (buf[4] === 2) {
            header = 16;
            publicKeyLength =
                0 + buf[8] + (buf[9] << 8) + (buf[10] << 16) + (buf[11] << 24);
            signatureLength =
                0 +
                buf[12] +
                (buf[13] << 8) +
                (buf[14] << 16) +
                (buf[15] << 24);
            zipStartOffset = header + publicKeyLength + signatureLength;
        } else {
            publicKeyLength =
                0 +
                buf[8] +
                (buf[9] << 8) +
                (buf[10] << 16) +
                ((buf[11] << 24) >>> 0);
            zipStartOffset = 12 + publicKeyLength;
        }

        return new Blob([new Uint8Array(arraybuffer, zipStartOffset)], {
            type: "application/zip"
        });
    }

    function fetchVersions() {
        if (state.isFirstRender) {
            fetch(
                "https://versionhistory.googleapis.com/v1/chrome/platforms/win/channels/stable/versions"
            )
                .then((res) => res.json())
                .then((data) => {
                    setState({
                        ...state,
                        versions: data.versions,
                        version: data.versions[0]?.version || "131",
                        isFirstRender: false
                    });
                })
                .catch((err) => {
                    console.error("Error fetching Chrome versions:", err);
                    setState({ ...state, isFirstRender: false });
                });
        }
    }
    function downloadCRX() {
        if (!state.id) return;

        // Don't allow download if no extension found and not in error state (error state has its own download buttons)
        if (!state.extension && !state.error) {
            alert(
                "Please search for an extension first before attempting to download."
            );
            return;
        }

        // Extract the extension ID from URL if needed
        const extractedId = extractExtensionId(state.id);

        // Get Chrome version and architecture information
        const chromeVersion = getChromeVersion();
        const versionString = `${chromeVersion.major}.${chromeVersion.minor}.${chromeVersion.build}.${chromeVersion.patch}`;
        const naclArch = getNaclArch();

        // Create the download URL with proper version and architecture parameters
        const url = CRX_URL.replace("@PRODVERSION", versionString)
            .replace("@EXTENSIONID", extractedId)
            .replace("@NACL_ARCH", naclArch);

        // Generate a filename based on the extension name or ID
        const fileName = state.extension?.name
            ? state.extension.name
                  .replace(/[&\/\\#,+()$~%.'":*?<>|{}\s]/g, "-")
                  .replace(/-*$/g, "")
                  .replace(/-+/g, "-")
            : state.id;

        // Create a download link and trigger it
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.crx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Show installation instructions in a popup or alert
        setTimeout(() => {
            alert(
                "Chrome Extension Download Instructions:\n\n" +
                    "1. Chrome may block direct installation with the message: 'apps extensions and user scripts cannot be added from this website'\n" +
                    "2. To install the downloaded CRX file:\n" +
                    "   - Open Chrome and go to chrome://extensions\n" +
                    "   - Enable 'Developer mode' in the top-right corner\n" +
                    "   - Drag and drop the downloaded CRX file into the extensions page\n" +
                    "3. If you still encounter issues, try using the ZIP download method instead."
            );
        }, 1000);
    }

    // Convert CRX to ZIP using the ArrayBuffer approach
    async function convertURLToZip(url: string) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const zipBlob = arrayBufferToBlob(arrayBuffer);
            return URL.createObjectURL(zipBlob);
        } catch (error) {
            console.error("Error converting CRX to ZIP:", error);
            return null;
        }
    }
    async function downloadZIP() {
        if (!state.id) return;

        // Don't allow download if no extension found and not in error state (error state has its own download buttons)
        if (!state.extension && !state.error) {
            alert(
                "Please search for an extension first before attempting to download."
            );
            return;
        }

        // Extract the extension ID from URL if needed
        const extractedId = extractExtensionId(state.id);

        // Get Chrome version and architecture information
        const chromeVersion = getChromeVersion();
        const versionString = `${chromeVersion.major}.${chromeVersion.minor}.${chromeVersion.build}.${chromeVersion.patch}`;
        const naclArch = getNaclArch();

        // Create the CRX URL that we'll convert to ZIP
        const url = CRX_URL.replace("@PRODVERSION", versionString)
            .replace("@EXTENSIONID", extractedId)
            .replace("@NACL_ARCH", naclArch);

        // Set loading state
        setState({ ...state, isLoading: true });

        try {
            // Convert CRX to ZIP
            const zipUrl = await convertURLToZip(url);

            if (zipUrl) {
                // Generate a filename based on the extension name or ID
                const fileName = state.extension?.name
                    ? state.extension.name
                          .replace(/[&\/\\#,+()$~%.'":*?<>|{}\s]/g, "-")
                          .replace(/-*$/g, "")
                          .replace(/-+/g, "-")
                    : state.id;

                // Create a download link and trigger it
                const a = document.createElement("a");
                a.href = zipUrl;
                a.download = `${fileName}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                // Clean up the URL object
                URL.revokeObjectURL(zipUrl);
            } else {
                // Fallback to direct download if conversion fails
                const directZipUrl = ZIP_URL.replace(
                    "@PRODVERSION",
                    versionString
                )
                    .replace("@EXTENSIONID", state.id)
                    .replace("@NACL_ARCH", naclArch);

                window.open(directZipUrl);
            }
        } catch (error) {
            console.error("Error downloading ZIP:", error);
            alert(
                "Failed to convert to ZIP format. Trying direct download instead."
            );

            // Fallback to direct download
            const directZipUrl = ZIP_URL.replace("@PRODVERSION", versionString)
                .replace("@EXTENSIONID", state.id)
                .replace("@NACL_ARCH", naclArch);

            window.open(directZipUrl);
        } finally {
            // Reset loading state
            setState({ ...state, isLoading: false });
        }

        // Show usage instructions
        setTimeout(() => {
            alert(
                "ZIP File Download Instructions:\n\n" +
                    "1. The ZIP file contains the extension source code\n" +
                    "2. To use it for development or inspection:\n" +
                    "   - Extract the ZIP file to a folder\n" +
                    "   - Open Chrome and go to chrome://extensions\n" +
                    "   - Enable 'Developer mode' in the top-right corner\n" +
                    "   - Click 'Load unpacked' and select the extracted folder"
            );
        }, 1000);
    }

    // Try direct API call to Chrome Web Store (as a fallback)
    const tryDirectApiCall = async (extensionId: string) => {
        try {
            // Create a URL that directly fetches the icon via Chrome Web Store API
            const apiIconUrl = `https://chrome.google.com/webstore/detail/icon/${extensionId}`;

            // We can't directly test this with HEAD request due to CORS, so we'll return the URL for the component to try
            return apiIconUrl;
        } catch (error) {
            console.error("Error in direct API call:", error);
            return null;
        }
    };
    async function fetchExtensionInfo() {
        if (!state.id) return;

        // Extract the extension ID from URL if a URL was pasted
        const extractedId = extractExtensionId(state.id);

        // Update state with the extracted ID if it's different
        if (extractedId !== state.id) {
            setState({
                ...state,
                id: extractedId,
                isLoading: true,
                error: null,
                extension: null
            });
        } else {
            setState({
                ...state,
                isLoading: true,
                error: null,
                extension: null
            });
        }

        try {
            // Try multiple approaches to get extension data
            // First, attempt to fetch from the Chrome Web Store detail page
            const extensionUrl = WEBSTORE_URL.replace(
                "@EXTENSIONID",
                extractedId
            );

            // Also try the Chrome Web Store API endpoint
            const apiUrl = `https://chrome.google.com/webstore/ajax/detail?id=${extractedId}&hl=en&gl=US`;

            // Use our CORS proxy API with Axios instance for the main extension page
            const proxyResponse = await Axios.post("/api/cors", {
                body: {
                    endpoint: extensionUrl,
                    method: "GET"
                }
            }); // Extract data from the response
            const proxyData = proxyResponse.data;
            console.log("CORS proxy response status:", proxyResponse.status);

            if (
                !proxyResponse ||
                proxyData.error ||
                proxyResponse.status >= 400
            ) {
                setState({
                    ...state,
                    isLoading: false,
                    error: "Extension not found in Chrome Web Store"
                });
                console.error(
                    "Error in CORS proxy response:",
                    proxyData.error || "HTTP status " + proxyResponse.status
                );
                return;
            }

            // Create a DOM parser to extract data from HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(proxyData.data, "text/html");

            // Extract extension name (usually in h1 or a meta tag)
            const nameElement =
                doc.querySelector("h1") ||
                doc.querySelector('meta[property="og:title"]');
            const name = nameElement
                ? nameElement.textContent || nameElement.getAttribute("content")
                : "Unknown Extension";

            // Extract description (usually in meta description or a specific paragraph)
            const descElement =
                doc.querySelector('meta[name="description"]') ||
                doc.querySelector('meta[property="og:description"]');
            const description = descElement
                ? descElement.getAttribute("content")
                : "No description available"; // Extract icon URL (Chrome Web Store uses img tags for extension icons)
            // Log all image elements for debugging
            console.log("All images in page:", doc.querySelectorAll("img"));

            // Enhanced icon extraction logic with broader selectors
            const iconElement =
                doc.querySelector("img.rBxtY") || // Primary class for extension icon in new Chrome Web Store
                doc.querySelector('img[class*="Icon"]') || // Any image with "Icon" in the class name
                doc.querySelector('img[class*="icon"]') || // Any image with "icon" in the class name (case-insensitive match)
                doc.querySelector('img[alt*="logo"]') || // Any image with "logo" in the alt text
                doc.querySelector('img[alt*="icon"]') || // Any image with "icon" in the alt text
                doc.querySelector('img[src*="googleusercontent"]') || // Common image hosting for extension icons
                doc.querySelector('img[srcset*="googleusercontent"]') || // Using srcset with googleusercontent
                doc.querySelector('meta[property="og:image"]') || // Open Graph image
                doc.querySelector('link[rel="icon"]'); // Favicon

            // Log the selected icon element for debugging
            console.log("Selected icon element:", iconElement);

            let icon = DEFAULT_ICON;
            if (iconElement) {
                // Check which attribute has the image URL based on element type
                if (iconElement.tagName === "IMG") {
                    icon = iconElement.getAttribute("src") || DEFAULT_ICON;

                    // If the src is a relative URL, make it absolute
                    if (icon && !icon.startsWith("http")) {
                        icon = new URL(
                            icon,
                            WEBSTORE_URL.replace("@EXTENSIONID", state.id)
                        ).href;
                    }

                    // If srcset is available, use the highest resolution image
                    const srcset = iconElement.getAttribute("srcset");
                    if (srcset) {
                        const srcsetItems = srcset
                            .split(",")
                            .map((s) => s.trim());
                        // Get the last item in srcset (usually highest resolution)
                        const highestRes = srcsetItems[srcsetItems.length - 1];
                        if (highestRes) {
                            // Extract the URL from srcset (format: "url 2x")
                            const url = highestRes.split(" ")[0];
                            if (url) icon = url;
                        }
                    }
                } else {
                    icon =
                        iconElement.getAttribute("content") ||
                        iconElement.getAttribute("href") ||
                        DEFAULT_ICON;

                    // Make relative URLs absolute
                    if (icon && !icon.startsWith("http")) {
                        icon = new URL(
                            icon,
                            WEBSTORE_URL.replace("@EXTENSIONID", state.id)
                        ).href;
                    }
                }
            }

            // Log the final icon URL
            console.log("Final icon URL:", icon); // If we still don't have a valid icon, try multiple fallback approaches
            if (icon === DEFAULT_ICON || !icon.startsWith("http")) {
                // Try multiple common Chrome Web Store icon patterns
                const iconPatterns = [
                    // Standard Chrome Web Store icon pattern
                    `https://lh3.googleusercontent.com/${state.id}`,
                    // Alternative pattern with size parameter
                    `https://lh3.googleusercontent.com/icon/${state.id}=w128-h128-e365-rj-sc0x00ffffff`,
                    // Chrome Web Store direct CDN path
                    `https://ssl.gstatic.com/chrome/webstore/images/icon_${state.id}_128.png`,
                    // Try the official Chrome Web Store API icon path
                    `https://chrome.google.com/webstore/detail/icon/${state.id}`
                ];

                // Try each pattern with our CORS proxy to avoid CORS issues
                for (const iconUrl of iconPatterns) {
                    try {
                        // Use our CORS proxy to test the icon URL
                        const proxyIconResponse = await Axios.post(
                            "/api/cors",
                            {
                                body: {
                                    endpoint: iconUrl,
                                    method: "HEAD"
                                }
                            }
                        );

                        if (proxyIconResponse.status === 200) {
                            icon = iconUrl;
                            console.log(
                                "Found working icon URL via CORS proxy:",
                                icon
                            );
                            break;
                        }
                    } catch (err) {
                        console.error(
                            `Error checking icon URL ${iconUrl}:`,
                            err
                        );
                    }
                }

                // If still no icon found, try our direct API call method
                if (icon === DEFAULT_ICON) {
                    const directApiIcon = await tryDirectApiCall(state.id);
                    if (directApiIcon) {
                        icon = directApiIcon;
                        console.log("Using direct API icon URL:", icon);
                    }
                }
            }

            // If we couldn't extract the basic info, check for specific structured data
            let structData: any = null;

            // Try to find schema.org structured data
            const scriptElements = doc.querySelectorAll(
                'script[type="application/ld+json"]'
            );
            console.log(
                "Found structured data scripts:",
                scriptElements.length
            );

            scriptElements.forEach((script) => {
                try {
                    const data = JSON.parse(script.textContent || "{}");
                    console.log("Structured data found:", data);
                    if (data && (data.name || data.description)) {
                        structData = data;
                    }
                } catch (e) {
                    console.error("Error parsing structured data:", e);
                }
            });

            // Try to extract data from additional potential sources
            const jsonLinkedData = doc.querySelector(
                'script[type="application/ld+json"]'
            );
            const userCountElement = doc.querySelector(
                '[title*="user"], [aria-label*="user"], [data-users]'
            );
            const ratingElement = doc.querySelector(
                '[aria-label*="rating"], [data-rating]'
            );

            // Extract users count
            const usersCount = userCountElement
                ? userCountElement.getAttribute("title") ||
                  userCountElement.getAttribute("aria-label") ||
                  userCountElement.getAttribute("data-users")
                : "Unknown";

            // Extract rating
            const rating = ratingElement
                ? ratingElement.getAttribute("aria-label") ||
                  ratingElement.getAttribute("data-rating")
                : "N/A";
            setState({
                ...state,
                isLoading: false,
                extension: {
                    name: structData?.name || name || "Unknown Extension",
                    description:
                        structData?.description ||
                        description ||
                        "No description available",
                    icon: structData?.image || icon || DEFAULT_ICON,
                    users:
                        structData?.interactionCount || usersCount || "Unknown",
                    rating:
                        structData?.aggregateRating?.ratingValue ||
                        rating ||
                        "N/A",
                    website: structData?.url || extensionUrl
                }
            });

            // Add comprehensive logging
            console.log("Successfully fetched extension info:", {
                id: state.id,
                icon: structData?.image || icon || DEFAULT_ICON,
                iconSource: structData?.image
                    ? "structured data"
                    : icon !== DEFAULT_ICON
                      ? "HTML extraction"
                      : "default icon"
            });
        } catch (err) {
            console.error("Error fetching extension info:", err);
            setState({
                ...state,
                isLoading: false,
                error: "Failed to fetch extension information"
            });
        }
    }

    useEffect(() => {
        fetchVersions();
    }, []);

    return (
        <div className="Page CRXDownload">
            <h1 className="title">Chrome Extension Download</h1>
            <p className="description">
                Download any Chrome extension as CRX or ZIP file directly from
                the Chrome Web Store
            </p>

            <div className="utility-box glass">
                <div className="utility-header">
                    <h2>Extension Finder</h2>
                    <Search />
                </div>
                <div className="utility-content">
                    <div className="input-group">
                        <label>Extension ID or URL</label>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <Input
                                placeholder="Enter Extension ID or Chrome Web Store URL"
                                value={state.id}
                                onChange={(e) =>
                                    setState({ ...state, id: e.target.value })
                                }
                                className="w-full"
                            />

                            {state.id && (
                                <>
                                    <Tooltip title="Copy URL">
                                        <Button
                                            onPress={() => {
                                                const url =
                                                    WEBSTORE_URL.replace(
                                                        "@EXTENSIONID",
                                                        state.id
                                                    );
                                                navigator.clipboard.writeText(
                                                    url
                                                );
                                                alert(
                                                    "Extension URL copied to clipboard: " +
                                                        url
                                                );
                                            }}
                                            isIconOnly
                                            color="primary"
                                            variant="light">
                                            <CopyAll />
                                        </Button>
                                    </Tooltip>
                                    <Tooltip title="Clear input">
                                        <Button
                                            onPress={() =>
                                                setState({ ...state, id: "" })
                                            }
                                            isIconOnly
                                            color="danger"
                                            variant="light">
                                            <Close />
                                        </Button>
                                    </Tooltip>
                                </>
                            )}

                            <Tooltip title="Find extension info">
                                <Button
                                    onPress={fetchExtensionInfo}
                                    isIconOnly
                                    color="primary"
                                    variant="light">
                                    <Search />
                                </Button>
                            </Tooltip>
                        </div>
                        <div className="helper-text">
                            Paste the full Chrome Web Store URL or just the
                            extension ID from:
                            chrome.google.com/webstore/detail/[name]/
                            <span className="text-accent font-bold">
                                [extension-id]
                            </span>
                        </div>
                    </div>
                    <div className="action-buttons">
                        <Button
                            onPress={downloadCRX}
                            startContent={<Download />}
                            disabled={!state.extension}>
                            Download CRX
                        </Button>
                        {/* <Button
                            onPress={downloadZIP}
                            startContent={<CloudDownload />}
                            disabled={!state.extension}
                        >
                            Download ZIP
                        </Button> */}
                    </div>
                    <div className="installation-note">
                        <p>
                            <strong>Note:</strong> Chrome blocks direct
                            installation from non-Chrome Web Store sites. See
                            the &quot;How to Use&quot; section below for
                            installation instructions.
                        </p>
                    </div>
                </div>
            </div>

            {/* Loading indicator */}
            {state.isLoading && (
                <div className="loading-container glass">
                    <CircularProgress size={48} />
                    <p>Fetching extension information...</p>
                </div>
            )}

            {/* Extension information card */}
            {state.extension && (
                <div className="utility-box glass extension-info">
                    <div className="utility-header">
                        <h2>Extension Information</h2>
                        <CheckCircle />
                    </div>
                    <div className="utility-content">
                        <div className="extension-card">
                            <div className="extension-icon">
                                <img
                                    src={state.extension.icon}
                                    alt={`${state.extension.name} Icon`}
                                    onError={(e) => {
                                        // If the image fails to load, replace with default icon
                                        console.log(
                                            "Icon failed to load, using default:",
                                            e
                                        );
                                        (e.target as HTMLImageElement).src =
                                            DEFAULT_ICON;
                                    }}
                                />
                                {/* {state.extension.icon !== DEFAULT_ICON && (
                                    <button
                                        className="reload-icon"
                                        onClick={() => {
                                            // Try another icon source pattern on click
                                            const currentIcon = state.extension?.icon || '';
                                            const iconPatterns = [
                                                `https://lh3.googleusercontent.com/${state.id}`,
                                                `https://lh3.googleusercontent.com/icon/${state.id}=w128-h128-e365-rj-sc0x00ffffff`,
                                                `https://ssl.gstatic.com/chrome/webstore/images/icon_${state.id}_128.png`,
                                                `https://chrome.google.com/webstore/detail/icon/${state.id}`
                                            ];

                                            // Find the current pattern in the list
                                            const currentIndex = iconPatterns.findIndex(pattern => pattern === currentIcon);
                                            // Try the next pattern (or loop back to the first)
                                            const nextIndex = (currentIndex + 1) % iconPatterns.length;

                                            // Update the extension info with the new icon URL
                                            if (state.extension) {
                                                setState({
                                                    ...state,
                                                    extension: {
                                                        ...state.extension,
                                                        icon: iconPatterns[nextIndex]
                                                    }
                                                });
                                            }
                                        }}
                                        title="Try another icon source"
                                    >
                                        🔄
                                    </button>
                                )} */}
                            </div>
                            <div className="extension-details">
                                <h3 className="extension-name">
                                    {state.extension.name}
                                </h3>
                                <p className="extension-description">
                                    {state.extension.description}
                                </p>

                                {/* <div className="extension-meta">
                                    <div className="meta-item">
                                        <span className="meta-label">Users:</span>
                                        <span className="meta-value">{state.extension.users}</span> 
                                        <span className="meta-value">Coming Soon!</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Rating:</span>
                                        <span className="meta-value">{state.extension.rating}</span>
                                        <span className="meta-value">Coming Soon !</span>
                                    </div>
                                </div> */}
                                {state.extension.website && (
                                    <div className="extension-website">
                                        <Button
                                            startContent={<Public />}
                                            onPress={() =>
                                                state.extension?.website &&
                                                window.open(
                                                    state.extension.website
                                                )
                                            }>
                                            Visit Store
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error message */}
            {state.error && (
                <div className="utility-box glass extension-error">
                    <div className="utility-header">
                        <h2>Extension Not Found</h2>
                        <Error />
                    </div>
                    <div className="utility-content">
                        {" "}
                        <div className="error-message">
                            <p>{state.error}</p>
                            <p className="error-hint">
                                {state.id.length > 32
                                    ? `The extension from the URL was not found in the Chrome Web Store. Please check the URL and try again.`
                                    : `The extension with ID <code>${state.id}</code> was not found in the Chrome Web Store. Please check the ID and try again.`}
                            </p>
                        </div>
                        <div className="extension-actions">
                            <Button
                                onPress={downloadCRX}
                                startContent={<Download />}
                                //     sx={{
                                //         background: "var(--accent-color)",
                                //         color: "var(--font-color-dark)"
                                //     }}
                            >
                                Try Direct CRX Download
                            </Button>
                            <Button
                                onPress={downloadZIP}
                                startContent={<CloudDownload />}
                                // sx={{
                                //     background: "var(--secondary-color)",
                                //     color: "var(--font-color-dark)"
                                // }}
                            >
                                Try Direct ZIP Download
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="utility-box glass">
                <div className="utility-header">
                    <h2>How to Use</h2>
                    <Public />{" "}
                </div>{" "}
                <div className="utility-content">
                    <ol className="instructions-list">
                        <li>
                            Copy the Chrome Web Store URL of the extension you
                            want to download
                        </li>
                        <li>
                            Paste the URL directly in the input field above (or
                            just enter the extension ID)
                        </li>
                        <li>
                            Click &quot;Search&quot; to get extension
                            information
                        </li>
                        <li>
                            Choose between downloading as CRX (Chrome extension
                            file) or ZIP (for unpacking)
                        </li>
                        <li>
                            If the extension isn&apos;t found in the Web Store,
                            you can still try direct download
                        </li>
                    </ol>

                    <div className="installation-steps">
                        <h4>How to Install Downloaded Extensions:</h4>
                        <div className="install-method">
                            <h5>Method 1: Install CRX File (Developer Mode)</h5>
                            <ol>
                                <li>
                                    Open Chrome and go to{" "}
                                    <code>chrome://extensions</code>
                                </li>{" "}
                                <li>
                                    Enable &quot;Developer mode&quot; in the
                                    top-right corner
                                </li>
                                <li>
                                    Drag and drop the downloaded CRX file into
                                    the extensions page
                                </li>
                                <li>
                                    If you see &quot;apps extensions and user
                                    scripts cannot be added from this
                                    website&quot;, follow method 2
                                </li>
                            </ol>
                        </div>
                        <div className="install-method">
                            <h5>
                                Method 2: Install Unpacked Extension (ZIP File)
                            </h5>
                            <ol>
                                <li>Download the extension as ZIP</li>
                                <li>
                                    Extract the ZIP file to a folder on your
                                    computer
                                </li>
                                <li>
                                    Open Chrome and go to{" "}
                                    <code>chrome://extensions</code>
                                </li>{" "}
                                <li>
                                    Enable &quot;Developer mode&quot; in the
                                    top-right corner
                                </li>
                                <li>
                                    Click &quot;Load unpacked&quot; and select
                                    the extracted folder
                                </li>
                            </ol>
                        </div>

                        <div className="tips-section">
                            <h4>Tips:</h4>
                            <ul>
                                <li>
                                    Chrome&apos;s security policy restricts
                                    installing extensions from outside the
                                    Chrome Web Store
                                </li>
                                <li>
                                    Developer mode lets you bypass this
                                    restriction for development and testing
                                </li>
                                <li>
                                    ZIP files are useful for inspecting the
                                    extension code
                                </li>
                                <li>
                                    Some extensions might not be available for
                                    direct download
                                </li>
                                <li>
                                    Keep extensions from trusted sources only
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CRXDownload;
