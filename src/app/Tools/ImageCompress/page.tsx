"use client";

import React, { useState, useRef, useEffect } from "react";
import "@Styles/Tools-ImageCompress.sass";
import {
    CloudUpload,
    Download,
    Delete,
    Image as ImageIcon,
    Compress,
    PhotoSizeSelectLarge,
    Refresh,
    GridView,
    ViewList,
    Visibility
} from "@mui/icons-material";
import { Select, SelectItem } from "@heroui/react";
import JSZip from "jszip";
import { Controller_Response } from "@Types";
import { fetchWithCSRF } from "@Utils/FetchWithCSRF";

interface CompressedImage {
    id: string;
    originalFile: File;
    compressedBlob?: Blob;
    compressedPreview?: string; // Data URL (base64) for compressed image preview
    originalSize: number;
    compressedSize?: number;
    compressionRatio?: number;
    status: "pending" | "compressing" | "completed" | "error";
    error?: string;
    originalPreview?: string; // Base64 preview of original image
}

const MAX_FILES = 10;
const SUPPORTED_FORMATS = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/tiff",
    "image/tif",
    "image/avif",
    "image/bmp",
    "image/ico",
    "image/x-icon",
    "image/heic",
    "image/heif",
    "image/svg+xml"
];

export default function ImageCompress() {
    const [images, setImages] = useState<CompressedImage[]>([]);
    const [isCompressing, setIsCompressing] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    const [previewMode, setPreviewMode] = useState<
        "original" | "compressed" | "comparison"
    >("comparison");
    const [compressionSettings, setCompressionSettings] = useState({
        quality: 80,
        format: "jpeg" as "jpeg" | "png" | "webp" | "avif" | "tiff" | "jpg",
        width: 0, // 0 means keep original
        height: 0, // 0 means keep original
        progressive: true
    });
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize CSRF token on component mount
    useEffect(() => {
        const initializeCSRF = async () => {
            try {
                console.log("[ImageCompress] Initializing CSRF token...");
                const response = await fetch("/api/trace", {
                    method: "POST",
                    credentials: "include"
                });
                const data = await response.json();
                if (data?.Status === 1) {
                    localStorage.setItem("trace", JSON.stringify(data));
                    console.log(
                        "[ImageCompress] CSRF token initialized successfully"
                    );

                    // Check if cookie was set
                    const cookies = document.cookie;
                    console.log("[ImageCompress] Current cookies:", cookies);
                    if (cookies.includes("smnetwork_csrf")) {
                        console.log(
                            "[ImageCompress] CSRF cookie found in document.cookie"
                        );
                    } else {
                        console.warn(
                            "[ImageCompress] CSRF cookie NOT found in document.cookie"
                        );
                    }
                } else {
                    console.warn(
                        "[ImageCompress] Failed to initialize CSRF token:",
                        data
                    );
                }
            } catch (error) {
                console.error(
                    "[ImageCompress] Error initializing CSRF token:",
                    error
                );
            }
        };

        initializeCSRF();
    }, []);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const generateImagePreview = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };
    const generateBlobPreview = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const cleanupBlobUrls = (urls: string[]) => {
        urls.forEach((url) => {
            if (url.startsWith("blob:")) {
                URL.revokeObjectURL(url);
            }
        });
    }; // Cleanup when component unmounts
    React.useEffect(() => {
        return () => {
            // No cleanup needed for data URLs - they're just strings
        };
    }, [images]);
    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = event.target.files;
        if (!files) return;
        await processFiles(Array.from(files));
    };
    const processFiles = async (fileArray: File[]) => {
        // Check file limit
        if (images.length + fileArray.length > MAX_FILES) {
            alert(
                `You can only compress up to ${MAX_FILES} images at once. Please remove some images or select fewer files.`
            );
            return;
        }

        // Filter supported formats
        const supportedFiles = fileArray.filter((file) => {
            if (!SUPPORTED_FORMATS.includes(file.type)) {
                alert(
                    `File "${file.name}" is not supported. Please upload JPEG, JPG, PNG, WebP, TIFF, AVIF, BMP, ICO, HEIC, HEIF, or SVG images.`
                );
                return false;
            }
            return true;
        });

        if (supportedFiles.length === 0) return;

        // Generate previews for supported files
        const newImages: CompressedImage[] = await Promise.all(
            supportedFiles.map(async (file) => {
                let originalPreview: string | undefined;
                try {
                    originalPreview = await generateImagePreview(file);
                } catch (error) {
                    console.warn(
                        `Failed to generate preview for ${file.name}:`,
                        error
                    );
                }

                return {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    originalFile: file,
                    originalSize: file.size,
                    status: "pending" as const,
                    originalPreview
                };
            })
        );

        setImages((prev) => [...prev, ...newImages]);

        // Clear input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOver(false);
    };
    const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOver(false);

        const files = Array.from(event.dataTransfer.files);
        await processFiles(files);
    };
    const removeImage = (id: string) => {
        // Cleanup blob URL before removing
        const imageToRemove = images.find((img) => img.id === id);
        if (imageToRemove?.compressedPreview) {
            URL.revokeObjectURL(imageToRemove.compressedPreview);
        }

        setImages((prev) => prev.filter((img) => img.id !== id));
    };
    const compressImages = async () => {
        const pendingImages = images.filter((img) => img.status === "pending");
        if (pendingImages.length === 0) return;

        setIsCompressing(true);

        // Update status to compressing for pending images
        setImages((prev) =>
            prev.map((img) =>
                img.status === "pending"
                    ? { ...img, status: "compressing" }
                    : img
            )
        );

        try {
            await compressImagesBatch(pendingImages.map((img) => img.id));
        } catch (error) {
            console.error("Batch compression error:", error);
        }

        setIsCompressing(false);
    };

    const compressImagesBatch = async (imageIds: string[]) => {
        const imagesToCompress = images.filter((img) =>
            imageIds.includes(img.id)
        );

        try {
            // Create FormData
            const formData = new FormData();

            // Add compression settings
            formData.append("settings", JSON.stringify(compressionSettings));

            // Add files
            imagesToCompress.forEach((image, index) => {
                formData.append(`file_${index}`, image.originalFile);
            }); // Make API request using FormData with custom fetch
            const response = await fetchWithCSRF("/api/compress-images", {
                method: "POST",
                body: formData
            });

            // Handle multipart response
            if (response.isMultipart && response.metadata && response.files) {
                const result: Controller_Response = response.metadata;

                // Check if the response status indicates success
                if (result.Status !== 1) {
                    throw new Error(result.Message || "Compression failed");
                } // Update images with compressed data
                const updatedImages = [...images];

                // Map files to their corresponding images by original name - use Promise.all for async operations
                const updatePromises =
                    result.Data?.images?.map(
                        async (compressedImageMeta: any, index: number) => {
                            const imageIndex = updatedImages.findIndex(
                                (img) =>
                                    img.originalFile.name ===
                                        compressedImageMeta.originalName &&
                                    imageIds.includes(img.id)
                            );

                            if (imageIndex !== -1) {
                                if (compressedImageMeta.error) {
                                    updatedImages[imageIndex] = {
                                        ...updatedImages[imageIndex],
                                        status: "error",
                                        error: compressedImageMeta.error
                                    };
                                } else {
                                    // Find corresponding file from the FormData response
                                    const correspondingFile =
                                        response.files?.find(
                                            (file, fileIndex) => {
                                                // Match by index or filename pattern
                                                return (
                                                    fileIndex === index ||
                                                    file.filename.includes(
                                                        compressedImageMeta.originalName.split(
                                                            "."
                                                        )[0]
                                                    )
                                                );
                                            }
                                        );

                                    if (correspondingFile) {
                                        const compressedPreview =
                                            await generateBlobPreview(
                                                correspondingFile.blob
                                            );
                                        updatedImages[imageIndex] = {
                                            ...updatedImages[imageIndex],
                                            compressedBlob:
                                                correspondingFile.blob,
                                            compressedPreview:
                                                compressedPreview,
                                            compressedSize:
                                                compressedImageMeta.compressedSize,
                                            compressionRatio:
                                                compressedImageMeta.compressionRatio,
                                            status: "completed"
                                        };
                                    } else {
                                        updatedImages[imageIndex] = {
                                            ...updatedImages[imageIndex],
                                            status: "error",
                                            error: "Compressed file not found in response"
                                        };
                                    }
                                }
                            }
                        }
                    ) || [];

                // Wait for all async operations to complete
                await Promise.all(updatePromises);
                setImages(updatedImages);
            } else {
                // Handle JSON response (fallback for errors)
                const result: Controller_Response = response.data;

                if (result.Status !== 1) {
                    throw new Error(result.Message || "Compression failed");
                }

                // This shouldn't happen for successful compressions, but handle gracefully
                throw new Error(
                    "Expected multipart response but received JSON"
                );
            }
        } catch (error: any) {
            console.error("Compression error:", error);

            // Handle error format from custom fetch or standard error
            let errorMessage = "Failed to compress images";
            if (error?.message) {
                errorMessage = error.message;
            }

            // Update specific images to error state
            setImages((prev) =>
                prev.map((img) =>
                    imageIds.includes(img.id) && img.status === "compressing"
                        ? { ...img, status: "error", error: errorMessage }
                        : img
                )
            );

            throw error;
        }
    };

    const compressSingle = async (imageId: string) => {
        // Update status to compressing
        setImages((prev) =>
            prev.map((img) =>
                img.id === imageId ? { ...img, status: "compressing" } : img
            )
        );

        try {
            await compressImagesBatch([imageId]);
        } catch (error) {
            // Error handling is done in compressImagesBatch
            console.error("Single compression error:", error);
        }
    };

    const retryCompression = async (imageId: string) => {
        // Reset status to pending and then compress
        setImages((prev) =>
            prev.map((img) =>
                img.id === imageId
                    ? { ...img, status: "pending", error: undefined }
                    : img
            )
        );

        // Small delay to ensure state update
        setTimeout(() => {
            compressSingle(imageId);
        }, 100);
    };

    const downloadSingle = (image: CompressedImage) => {
        if (!image.compressedBlob) return;

        const url = URL.createObjectURL(image.compressedBlob);
        const link = document.createElement("a");
        link.href = url;

        const originalName = image.originalFile.name;
        const nameWithoutExt =
            originalName.substring(0, originalName.lastIndexOf(".")) ||
            originalName;
        link.download = `${nameWithoutExt}_compressed.${compressionSettings.format}`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const downloadAll = async () => {
        const compressedImages = images.filter(
            (img) => img.status === "completed" && img.compressedBlob
        );

        if (compressedImages.length === 0) {
            alert("No compressed images to download.");
            return;
        }

        if (compressedImages.length === 1) {
            downloadSingle(compressedImages[0]);
            return;
        }

        // Create ZIP file for multiple images
        const zip = new JSZip();

        compressedImages.forEach((image) => {
            if (image.compressedBlob) {
                const originalName = image.originalFile.name;
                const nameWithoutExt =
                    originalName.substring(0, originalName.lastIndexOf(".")) ||
                    originalName;
                const fileName = `${nameWithoutExt}_compressed.${compressionSettings.format}`;
                zip.file(fileName, image.compressedBlob);
            }
        });

        try {
            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const link = document.createElement("a");
            link.href = url;
            link.download = `compressed_images_${Date.now()}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error creating ZIP file:", error);
            alert(
                "Error creating ZIP file. Please try downloading images individually."
            );
        }
    };

    const clearAll = () => {
        setImages([]);
    };

    const totalOriginalSize = images.reduce(
        (sum, img) => sum + img.originalSize,
        0
    );
    const totalCompressedSize = images.reduce(
        (sum, img) => sum + (img.compressedSize || 0),
        0
    );
    const overallCompressionRatio =
        totalOriginalSize > 0
            ? ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) *
              100
            : 0;
    return (
        <div className="Page ImageCompress">
            <h1 className="title">Image Compress</h1>
            <p className="description">
                Compress images with batch processing (max {MAX_FILES} files)
            </p>

            {/* Upload Section */}
            <div className="upload-container glass">
                <div
                    className={`upload-dropzone ${isDragOver ? "drag-over" : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}>
                    <CloudUpload className="upload-icon" />
                    <p className="upload-text">
                        {isDragOver
                            ? "Drop images here"
                            : "Drop images here or click to upload"}
                    </p>{" "}
                    <p className="upload-description">
                        Supports JPG, PNG, WebP, TIFF, AVIF, BMP, ICO, HEIC,
                        HEIF, SVG • Max {MAX_FILES} files
                    </p>
                    <button className="select-button">
                        <PhotoSizeSelectLarge style={{ fontSize: "1rem" }} />
                        Select Images
                    </button>{" "}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/tiff,image/tif,image/avif,image/bmp,image/ico,image/x-icon,image/heic,image/heif,image/svg+xml"
                        multiple
                        style={{ display: "none" }}
                        onChange={handleFileUpload}
                    />
                </div>
            </div>
            {/* Compression Settings */}
            {images.length > 0 && (
                <div className="settings-container glass">
                    <h3 className="settings-header">Compression Settings</h3>
                    <div className="settings-grid">
                        <div className="setting-group">
                            <label className="setting-label">
                                Quality: {compressionSettings.quality}%
                            </label>
                            <div className="setting-slider">
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    step="5"
                                    value={compressionSettings.quality}
                                    onChange={(e) =>
                                        setCompressionSettings((prev) => ({
                                            ...prev,
                                            quality: parseInt(e.target.value)
                                        }))
                                    }
                                />
                            </div>
                        </div>
                        <div className="setting-group">
                            <label className="setting-label">
                                Output Format
                            </label>
                            <Select
                                selectedKeys={[compressionSettings.format]}
                                onSelectionChange={(keys) => {
                                    const selectedKey = Array.from(
                                        keys
                                    )[0] as string;
                                    setCompressionSettings((prev) => ({
                                        ...prev,
                                        format: selectedKey as
                                            | "jpeg"
                                            | "png"
                                            | "webp"
                                            | "avif"
                                            | "tiff"
                                            | "jpg"
                                    }));
                                }}
                                variant="bordered"
                                classNames={{
                                    trigger:
                                        "bg-white/10 border-white/20 text-[var(--font-color)]"
                                }}>
                                <SelectItem key="jpg">JPG</SelectItem>
                                <SelectItem key="jpeg">JPEG</SelectItem>
                                <SelectItem key="png">PNG</SelectItem>
                                <SelectItem key="webp">WebP</SelectItem>
                                <SelectItem key="avif">AVIF</SelectItem>
                                <SelectItem key="tiff">TIFF</SelectItem>
                            </Select>
                        </div>
                        <div className="setting-group">
                            <label className="setting-label">
                                Width: {compressionSettings.width}px (0 = keep
                                original)
                            </label>
                            <div className="setting-slider">
                                <input
                                    type="range"
                                    min="0"
                                    max="4000"
                                    step="50"
                                    value={compressionSettings.width}
                                    onChange={(e) =>
                                        setCompressionSettings((prev) => ({
                                            ...prev,
                                            width: parseInt(e.target.value)
                                        }))
                                    }
                                />
                            </div>
                        </div>
                        <div className="setting-group">
                            <label className="setting-label">
                                Height: {compressionSettings.height}px (0 = keep
                                original)
                            </label>
                            <div className="setting-slider">
                                <input
                                    type="range"
                                    min="0"
                                    max="4000"
                                    step="50"
                                    value={compressionSettings.height}
                                    onChange={(e) =>
                                        setCompressionSettings((prev) => ({
                                            ...prev,
                                            height: parseInt(e.target.value)
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {images.length > 0 && (
                <div className="images-container glass">
                    <div className="images-header">
                        <h3 className="images-title">
                            Images ({images.length}/{MAX_FILES})
                        </h3>

                        <div className="view-controls">
                            <div className="view-mode-toggle">
                                <button
                                    className={`view-toggle ${viewMode === "list" ? "active" : ""}`}
                                    onClick={() => setViewMode("list")}
                                    title="List view">
                                    <ViewList style={{ fontSize: "1rem" }} />
                                </button>
                                <button
                                    className={`view-toggle ${viewMode === "grid" ? "active" : ""}`}
                                    onClick={() => setViewMode("grid")}
                                    title="Grid view">
                                    <GridView style={{ fontSize: "1rem" }} />
                                </button>
                            </div>
                            <div className="preview-mode-select">
                                <Select
                                    selectedKeys={[previewMode]}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(
                                            keys
                                        )[0] as string;
                                        setPreviewMode(
                                            selectedKey as
                                                | "original"
                                                | "compressed"
                                                | "comparison"
                                        );
                                    }}
                                    variant="bordered"
                                    size="sm"
                                    classNames={{
                                        trigger:
                                            "bg-white/10 border-white/20 text-[var(--font-color)]"
                                    }}
                                    style={{
                                        width: "150px",
                                        marginLeft: "10px"
                                    }}>
                                    <SelectItem key="original">
                                        Original
                                    </SelectItem>
                                    <SelectItem key="compressed">
                                        Compressed
                                    </SelectItem>
                                    <SelectItem key="comparison">
                                        Comparison
                                    </SelectItem>
                                </Select>
                            </div>
                        </div>

                        <div className="action-buttons">
                            <button
                                className={`action-button primary ${isCompressing ? "loading" : ""}`}
                                onClick={compressImages}
                                disabled={
                                    isCompressing ||
                                    !images.some(
                                        (img) => img.status === "pending"
                                    )
                                }>
                                <Compress style={{ fontSize: "1rem" }} />
                                {isCompressing
                                    ? "Compressing..."
                                    : `Compress Pending (${images.filter((img) => img.status === "pending").length})`}
                            </button>
                            <button
                                className="action-button success"
                                onClick={downloadAll}
                                disabled={
                                    !images.some(
                                        (img) => img.status === "completed"
                                    )
                                }>
                                <Download style={{ fontSize: "1rem" }} />
                                Download All
                            </button>
                            <button
                                className="action-button danger"
                                onClick={clearAll}>
                                <Delete style={{ fontSize: "1rem" }} />
                                Clear All
                            </button>
                        </div>
                    </div>{" "}
                    {/* Overall Stats */}
                    {totalOriginalSize > 0 && (
                        <div className="stats-container">
                            <div className="stats-header">
                                <h4>Compression Overview</h4>
                                <span className="stats-savings-badge">
                                    -{overallCompressionRatio.toFixed(1)}% saved
                                </span>
                            </div>

                            <div className="stats-visual">
                                <div className="stats-bar">
                                    <div
                                        className="stats-segment original"
                                        style={{
                                            width: `${((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100}%`
                                        }}>
                                        <span className="segment-label">
                                            Saved:{" "}
                                            {formatBytes(
                                                totalOriginalSize -
                                                    totalCompressedSize
                                            )}
                                        </span>
                                    </div>
                                    <div
                                        className="stats-segment compressed"
                                        style={{
                                            width: `${(totalCompressedSize / totalOriginalSize) * 100}%`
                                        }}>
                                        <span className="segment-label">
                                            Final:{" "}
                                            {formatBytes(totalCompressedSize)}
                                        </span>
                                    </div>
                                </div>

                                <div className="stats-labels">
                                    <div className="stats-item">
                                        <div className="stats-dot original"></div>
                                        <span>
                                            Original:{" "}
                                            {formatBytes(totalOriginalSize)}
                                        </span>
                                    </div>
                                    <div className="stats-item">
                                        <div className="stats-dot compressed"></div>
                                        <span>
                                            Compressed:{" "}
                                            {formatBytes(totalCompressedSize)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className={`images-display ${viewMode}`}>
                        {viewMode === "list" ? (
                            // List View
                            <div className="images-list">
                                {images.map((image) => (
                                    <div
                                        key={image.id}
                                        className="image-item">
                                        <div className="image-row">
                                            <div className="image-info">
                                                {previewMode === "comparison" &&
                                                image.originalPreview &&
                                                image.compressedPreview ? (
                                                    <div className="image-comparison">
                                                        <div className="comparison-side">
                                                            <img
                                                                src={
                                                                    image.originalPreview
                                                                }
                                                                alt="Original"
                                                                className="preview-image original"
                                                            />
                                                            <span className="comparison-label">
                                                                Original
                                                            </span>
                                                        </div>
                                                        <div className="comparison-divider"></div>
                                                        <div className="comparison-side">
                                                            <img
                                                                src={
                                                                    image.compressedPreview
                                                                }
                                                                alt="Compressed"
                                                                className="preview-image compressed"
                                                            />
                                                            <span className="comparison-label">
                                                                Compressed
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : previewMode ===
                                                      "original" &&
                                                  image.originalPreview ? (
                                                    <img
                                                        src={
                                                            image.originalPreview
                                                        }
                                                        alt="Original"
                                                        className="preview-image single"
                                                    />
                                                ) : previewMode ===
                                                      "compressed" &&
                                                  image.compressedPreview ? (
                                                    <img
                                                        src={
                                                            image.compressedPreview
                                                        }
                                                        alt="Compressed"
                                                        className="preview-image single"
                                                    />
                                                ) : (
                                                    <ImageIcon className="image-icon" />
                                                )}

                                                <div className="image-details">
                                                    <p className="image-name">
                                                        {
                                                            image.originalFile
                                                                .name
                                                        }
                                                    </p>
                                                    <div className="image-stats">
                                                        <span className="stat-item">
                                                            Original:{" "}
                                                            {formatBytes(
                                                                image.originalSize
                                                            )}
                                                        </span>
                                                        {image.compressedSize && (
                                                            <>
                                                                <span className="stat-item">
                                                                    Compressed:{" "}
                                                                    {formatBytes(
                                                                        image.compressedSize
                                                                    )}
                                                                </span>
                                                                <span className="stat-item savings">
                                                                    -
                                                                    {image.compressionRatio?.toFixed(
                                                                        1
                                                                    )}
                                                                    %
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="image-actions">
                                                <span
                                                    className={`status-chip ${image.status}`}>
                                                    {image.status}
                                                </span>
                                                {image.status === "pending" && (
                                                    <button
                                                        className="icon-button compress"
                                                        onClick={() =>
                                                            compressSingle(
                                                                image.id
                                                            )
                                                        }
                                                        title="Compress this image">
                                                        <Compress
                                                            style={{
                                                                fontSize: "1rem"
                                                            }}
                                                        />
                                                    </button>
                                                )}
                                                {image.status === "error" && (
                                                    <button
                                                        className="icon-button retry"
                                                        onClick={() =>
                                                            retryCompression(
                                                                image.id
                                                            )
                                                        }
                                                        title="Retry compression">
                                                        <Refresh
                                                            style={{
                                                                fontSize: "1rem"
                                                            }}
                                                        />
                                                    </button>
                                                )}
                                                {image.status ===
                                                    "completed" && (
                                                    <button
                                                        className="icon-button"
                                                        onClick={() =>
                                                            downloadSingle(
                                                                image
                                                            )
                                                        }
                                                        title="Download compressed image">
                                                        <Download
                                                            style={{
                                                                fontSize: "1rem"
                                                            }}
                                                        />
                                                    </button>
                                                )}
                                                <button
                                                    className="icon-button"
                                                    onClick={() =>
                                                        removeImage(image.id)
                                                    }
                                                    disabled={
                                                        image.status ===
                                                        "compressing"
                                                    }
                                                    title="Remove image">
                                                    <Delete
                                                        style={{
                                                            fontSize: "1rem"
                                                        }}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                        {image.status === "compressing" && (
                                            <div className="progress-bar">
                                                <div className="progress-fill"></div>
                                            </div>
                                        )}
                                        {image.status === "error" && (
                                            <p className="error-message">
                                                {image.error}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Grid View
                            <div className="images-grid">
                                {images.map((image) => (
                                    <div
                                        key={image.id}
                                        className="image-card">
                                        <div className="card-preview">
                                            {previewMode === "comparison" &&
                                            image.originalPreview &&
                                            image.compressedPreview ? (
                                                <div className="grid-comparison">
                                                    <div className="grid-comparison-side">
                                                        <img
                                                            src={
                                                                image.originalPreview
                                                            }
                                                            alt="Original"
                                                            className="grid-preview-image"
                                                        />
                                                        <span className="grid-comparison-label">
                                                            Original
                                                        </span>
                                                    </div>
                                                    <div className="grid-comparison-side">
                                                        <img
                                                            src={
                                                                image.compressedPreview
                                                            }
                                                            alt="Compressed"
                                                            className="grid-preview-image"
                                                        />
                                                        <span className="grid-comparison-label">
                                                            Compressed
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : previewMode === "original" &&
                                              image.originalPreview ? (
                                                <img
                                                    src={image.originalPreview}
                                                    alt="Original"
                                                    className="grid-preview-image single"
                                                />
                                            ) : previewMode === "compressed" &&
                                              image.compressedPreview ? (
                                                <img
                                                    src={
                                                        image.compressedPreview
                                                    }
                                                    alt="Compressed"
                                                    className="grid-preview-image single"
                                                />
                                            ) : (
                                                <div className="grid-placeholder">
                                                    <ImageIcon
                                                        style={{
                                                            fontSize: "3rem",
                                                            color: "rgba(255, 255, 255, 0.3)"
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            <div className="card-overlay">
                                                <span
                                                    className={`status-chip ${image.status}`}>
                                                    {image.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="card-info">
                                            <p className="card-title">
                                                {image.originalFile.name}
                                            </p>
                                            <div className="card-stats">
                                                <span className="stat-item">
                                                    Original:{" "}
                                                    {formatBytes(
                                                        image.originalSize
                                                    )}
                                                </span>
                                                {image.compressedSize && (
                                                    <>
                                                        <span className="stat-item">
                                                            Compressed:{" "}
                                                            {formatBytes(
                                                                image.compressedSize
                                                            )}
                                                        </span>
                                                        <span className="stat-item savings">
                                                            -
                                                            {image.compressionRatio?.toFixed(
                                                                1
                                                            )}
                                                            %
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="card-actions">
                                            {image.status === "pending" && (
                                                <button
                                                    className="card-button compress"
                                                    onClick={() =>
                                                        compressSingle(image.id)
                                                    }
                                                    title="Compress this image">
                                                    <Compress
                                                        style={{
                                                            fontSize: "1rem"
                                                        }}
                                                    />
                                                </button>
                                            )}
                                            {image.status === "error" && (
                                                <button
                                                    className="card-button retry"
                                                    onClick={() =>
                                                        retryCompression(
                                                            image.id
                                                        )
                                                    }
                                                    title="Retry compression">
                                                    <Refresh
                                                        style={{
                                                            fontSize: "1rem"
                                                        }}
                                                    />
                                                </button>
                                            )}
                                            {image.status === "completed" && (
                                                <button
                                                    className="card-button download"
                                                    onClick={() =>
                                                        downloadSingle(image)
                                                    }
                                                    title="Download compressed image">
                                                    <Download
                                                        style={{
                                                            fontSize: "1rem"
                                                        }}
                                                    />
                                                </button>
                                            )}
                                            <button
                                                className="card-button delete"
                                                onClick={() =>
                                                    removeImage(image.id)
                                                }
                                                disabled={
                                                    image.status ===
                                                    "compressing"
                                                }
                                                title="Remove image">
                                                <Delete
                                                    style={{ fontSize: "1rem" }}
                                                />
                                            </button>
                                        </div>

                                        {image.status === "compressing" && (
                                            <div className="card-progress">
                                                <div className="progress-bar">
                                                    <div className="progress-fill"></div>
                                                </div>
                                            </div>
                                        )}
                                        {image.status === "error" && (
                                            <p className="card-error">
                                                {image.error}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
