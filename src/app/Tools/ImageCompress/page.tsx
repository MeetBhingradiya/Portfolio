"use client";

import React, { useState, useRef } from 'react';
import "@Styles/Tools-ImageCompress.sass";
import {
    CloudUpload,
    Download,
    Delete,
    Image as ImageIcon,
    Compress,
    PhotoSizeSelectLarge
} from '@mui/icons-material';
import JSZip from 'jszip';
import { Axios } from '@Utils/Axios';

interface CompressedImage {
    id: string;
    originalFile: File;
    compressedBlob?: Blob;
    originalSize: number;
    compressedSize?: number;
    compressionRatio?: number;
    status: 'pending' | 'compressing' | 'completed' | 'error';
    error?: string;
}

const MAX_FILES = 10;
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'];

export default function ImageCompress() {
    const [images, setImages] = useState<CompressedImage[]>([]);
    const [isCompressing, setIsCompressing] = useState(false);
    const [compressionSettings, setCompressionSettings] = useState({
        quality: 80,
        format: 'jpeg' as 'jpeg' | 'png' | 'webp',
        width: 0, // 0 means keep original
        height: 0, // 0 means keep original
        progressive: true
    });
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }; const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;
        processFiles(Array.from(files));
    };

    const processFiles = (fileArray: File[]) => {
        // Check file limit
        if (images.length + fileArray.length > MAX_FILES) {
            alert(`You can only compress up to ${MAX_FILES} images at once. Please remove some images or select fewer files.`);
            return;
        }

        // Filter supported formats
        const supportedFiles = fileArray.filter(file => {
            if (!SUPPORTED_FORMATS.includes(file.type)) {
                alert(`File "${file.name}" is not supported. Please upload JPEG, PNG, WebP, or TIFF images.`);
                return false;
            }
            return true;
        });

        if (supportedFiles.length === 0) return;

        const newImages: CompressedImage[] = supportedFiles.map(file => ({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            originalFile: file,
            originalSize: file.size,
            status: 'pending'
        }));

        setImages(prev => [...prev, ...newImages]);

        // Clear input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
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

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOver(false);

        const files = Array.from(event.dataTransfer.files);
        processFiles(files);
    };

    const removeImage = (id: string) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };    const compressImages = async () => {
        if (images.length === 0) return;

        setIsCompressing(true);

        try {
            // Convert files to base64 for JSON API
            const filePromises = images
                .filter(image => image.status === 'pending')
                .map(async (image) => {
                    return new Promise<{ name: string; data: string; type: string; size: number }>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const base64 = (reader.result as string).split(',')[1]; // Remove data:image/...;base64, prefix
                            resolve({
                                name: image.originalFile.name,
                                data: base64,
                                type: image.originalFile.type,
                                size: image.originalFile.size
                            });
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(image.originalFile);
                    });
                });

            const files = await Promise.all(filePromises);

            // Make API request using your Axios instance (JSON endpoint)
            const response = await Axios.post('/api/compress-images', {
                files,
                settings: compressionSettings
            });

            const result = response.data;

            if (!result.success) {
                throw new Error('Compression failed');
            }

            // Update images with compressed data
            const updatedImages = [...images];

            result.images.forEach((compressedImage: any, index: number) => {
                const imageIndex = updatedImages.findIndex(
                    img => img.originalFile.name === compressedImage.originalName && img.status === 'pending'
                );

                if (imageIndex !== -1) {
                    if (compressedImage.error) {
                        updatedImages[imageIndex] = {
                            ...updatedImages[imageIndex],
                            status: 'error',
                            error: compressedImage.error
                        };
                    } else {
                        // Convert base64 back to blob
                        const binaryString = atob(compressedImage.data);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        const compressedBlob = new Blob([bytes], { type: compressedImage.mimeType });

                        updatedImages[imageIndex] = {
                            ...updatedImages[imageIndex],
                            compressedBlob,
                            compressedSize: compressedImage.compressedSize,
                            compressionRatio: compressedImage.compressionRatio,
                            status: 'completed'
                        };
                    }
                }
            });

            setImages(updatedImages);        } catch (error: any) {
            console.error('Compression error:', error);
            
            // Handle Axios error response format
            let errorMessage = 'Failed to compress images';
            if (error?.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error?.message) {
                errorMessage = error.message;
            }
            
            alert(errorMessage);

            // Update all pending images to error state
            setImages(prev => prev.map(img =>
                img.status === 'pending' ? { ...img, status: 'error', error: errorMessage } : img
            ));
        }

        setIsCompressing(false);
    };

    const downloadSingle = (image: CompressedImage) => {
        if (!image.compressedBlob) return;

        const url = URL.createObjectURL(image.compressedBlob);
        const link = document.createElement('a');
        link.href = url;

        const originalName = image.originalFile.name;
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
        link.download = `${nameWithoutExt}_compressed.${compressionSettings.format}`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const downloadAll = async () => {
        const compressedImages = images.filter(img => img.status === 'completed' && img.compressedBlob);

        if (compressedImages.length === 0) {
            alert('No compressed images to download.');
            return;
        }

        if (compressedImages.length === 1) {
            downloadSingle(compressedImages[0]);
            return;
        }

        // Create ZIP file for multiple images
        const zip = new JSZip();

        compressedImages.forEach(image => {
            if (image.compressedBlob) {
                const originalName = image.originalFile.name;
                const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
                const fileName = `${nameWithoutExt}_compressed.${compressionSettings.format}`;
                zip.file(fileName, image.compressedBlob);
            }
        });

        try {
            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = `compressed_images_${Date.now()}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error creating ZIP file:', error);
            alert('Error creating ZIP file. Please try downloading images individually.');
        }
    };

    const clearAll = () => {
        setImages([]);
    };

    const totalOriginalSize = images.reduce((sum, img) => sum + img.originalSize, 0);
    const totalCompressedSize = images.reduce((sum, img) => sum + (img.compressedSize || 0), 0);
    const overallCompressionRatio = totalOriginalSize > 0 ?
        ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100 : 0;    return (
        <div className="Page ImageCompress">
            <h1 className="title">Image Compress</h1>
            <p className="description">
                Compress images with batch processing (max {MAX_FILES} files)
            </p>

            {/* Upload Section */}
            <div className="upload-container glass">
                <div 
                    className={`upload-dropzone ${isDragOver ? 'drag-over' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <CloudUpload className="upload-icon" />
                    <p className="upload-text">
                        {isDragOver ? 'Drop images here' : 'Drop images here or click to upload'}
                    </p>
                    <p className="upload-description">
                        Supports JPEG, PNG, WebP, TIFF • Max {MAX_FILES} files
                    </p>
                    <button className="select-button">
                        <PhotoSizeSelectLarge style={{ fontSize: '1rem' }} />
                        Select Images
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/tiff"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                    />
                </div>
            </div>            {/* Compression Settings */}
            {images.length > 0 && (
                <div className="settings-container glass">
                    <h3 className="settings-header">Compression Settings</h3>
                    <div className="settings-grid">
                        <div className="setting-group">
                            <label className="setting-label">Quality: {compressionSettings.quality}%</label>
                            <div className="setting-slider">
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    step="5"
                                    value={compressionSettings.quality}
                                    onChange={(e) => setCompressionSettings(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                                />
                            </div>
                        </div>
                        <div className="setting-group">
                            <label className="setting-label">Output Format</label>
                            <select
                                value={compressionSettings.format}
                                onChange={(e) => setCompressionSettings(prev => ({ ...prev, format: e.target.value as 'jpeg' | 'png' | 'webp' }))}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: 'var(--font-color)'
                                }}
                            >
                                <option value="jpeg">JPEG</option>
                                <option value="png">PNG</option>
                                <option value="webp">WebP</option>
                            </select>
                        </div>
                        <div className="setting-group">
                            <label className="setting-label">Width: {compressionSettings.width}px (0 = keep original)</label>
                            <div className="setting-slider">
                                <input
                                    type="range"
                                    min="0"
                                    max="4000"
                                    step="50"
                                    value={compressionSettings.width}
                                    onChange={(e) => setCompressionSettings(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                                />
                            </div>
                        </div>
                        <div className="setting-group">
                            <label className="setting-label">Height: {compressionSettings.height}px (0 = keep original)</label>
                            <div className="setting-slider">
                                <input
                                    type="range"
                                    min="0"
                                    max="4000"
                                    step="50"
                                    value={compressionSettings.height}
                                    onChange={(e) => setCompressionSettings(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}            {/* Images List */}
            {images.length > 0 && (
                <div className="images-container glass">
                    <div className="images-header">
                        <h3 className="images-title">Images ({images.length}/{MAX_FILES})</h3>
                        <div className="action-buttons">
                            <button
                                className={`action-button primary ${isCompressing ? 'loading' : ''}`}
                                onClick={compressImages}
                                disabled={isCompressing || images.every(img => img.status === 'completed')}
                            >
                                <Compress style={{ fontSize: '1rem' }} />
                                {isCompressing ? 'Compressing...' : 'Compress All'}
                            </button>
                            <button
                                className="action-button success"
                                onClick={downloadAll}
                                disabled={!images.some(img => img.status === 'completed')}
                            >
                                <Download style={{ fontSize: '1rem' }} />
                                Download All
                            </button>
                            <button
                                className="action-button danger"
                                onClick={clearAll}
                            >
                                <Delete style={{ fontSize: '1rem' }} />
                                Clear All
                            </button>
                        </div>
                    </div>

                    {/* Overall Stats */}
                    {totalOriginalSize > 0 && (
                        <div className="stats-container">
                            <div className="stats-row">
                                <span className="stats-label">Original Size: <span className="stats-value">{formatBytes(totalOriginalSize)}</span></span>
                                <span className="stats-label">Compressed Size: <span className="stats-value">{formatBytes(totalCompressedSize)}</span></span>
                                <span className="stats-savings">Saved: {overallCompressionRatio.toFixed(1)}%</span>
                            </div>
                        </div>
                    )}

                    <div className="images-list">
                        {images.map((image) => (
                            <div key={image.id} className="image-item">
                                <div className="image-row">
                                    <div className="image-info">
                                        <ImageIcon className="image-icon" />
                                        <div className="image-details">
                                            <p className="image-name">{image.originalFile.name}</p>
                                            <div className="image-stats">
                                                <span className="stat-item">Original: {formatBytes(image.originalSize)}</span>
                                                {image.compressedSize && (
                                                    <>
                                                        <span className="stat-item">Compressed: {formatBytes(image.compressedSize)}</span>
                                                        <span className="stat-item savings">
                                                            -{image.compressionRatio?.toFixed(1)}%
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="image-actions">
                                        <span className={`status-chip ${image.status}`}>
                                            {image.status}
                                        </span>
                                        {image.status === 'completed' && (
                                            <button
                                                className="icon-button"
                                                onClick={() => downloadSingle(image)}
                                                title="Download compressed image"
                                            >
                                                <Download style={{ fontSize: '1rem' }} />
                                            </button>
                                        )}
                                        <button
                                            className="icon-button"
                                            onClick={() => removeImage(image.id)}
                                            disabled={image.status === 'compressing'}
                                            title="Remove image"
                                        >
                                            <Delete style={{ fontSize: '1rem' }} />
                                        </button>
                                    </div>
                                </div>
                                {image.status === 'compressing' && (
                                    <div className="progress-bar">
                                        <div className="progress-fill"></div>
                                    </div>
                                )}
                                {image.status === 'error' && (
                                    <p className="error-message">{image.error}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
