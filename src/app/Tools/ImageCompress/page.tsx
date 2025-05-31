"use client";

import React, { useState, useRef } from 'react';
import "@Styles/Tools-ImageCompress.sass";
import {
    CloudUpload,
    Download,
    Delete,
    Image as ImageIcon,
    Compress,
    PhotoSizeSelectLarge,
    Refresh
} from '@mui/icons-material';
import JSZip from 'jszip';
import { Axios } from '@Utils/Axios';
import { Controller_Response } from '@Types';

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
const SUPPORTED_FORMATS = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/webp', 
    'image/tiff', 
    'image/tif',
    'image/avif',
    'image/bmp',
    'image/ico',
    'image/x-icon',
    'image/heic',
    'image/heif',
    'image/svg+xml'
];

export default function ImageCompress() {
    const [images, setImages] = useState<CompressedImage[]>([]);
    const [isCompressing, setIsCompressing] = useState(false);    const [compressionSettings, setCompressionSettings] = useState({
        quality: 80,
        format: 'jpeg' as 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff',
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
        }        // Filter supported formats
        const supportedFiles = fileArray.filter(file => {
            if (!SUPPORTED_FORMATS.includes(file.type)) {
                alert(`File "${file.name}" is not supported. Please upload JPEG, JPG, PNG, WebP, TIFF, AVIF, BMP, ICO, HEIC, HEIF, or SVG images.`);
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
        const pendingImages = images.filter(img => img.status === 'pending');
        if (pendingImages.length === 0) return;

        setIsCompressing(true);

        // Update status to compressing for pending images
        setImages(prev => prev.map(img => 
            img.status === 'pending' ? { ...img, status: 'compressing' } : img
        ));

        try {
            await compressImagesBatch(pendingImages.map(img => img.id));
        } catch (error) {
            console.error('Batch compression error:', error);
        }

        setIsCompressing(false);
    };    const compressImagesBatch = async (imageIds: string[]) => {
        const imagesToCompress = images.filter(img => imageIds.includes(img.id));
        
        try {
            // Create FormData
            const formData = new FormData();
            
            // Add compression settings
            formData.append('settings', JSON.stringify(compressionSettings));
            
            // Add files
            imagesToCompress.forEach((image, index) => {
                formData.append(`file_${index}`, image.originalFile);
            });

            // Make API request using FormData
            const response = await Axios.post('/api/compress-images', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const result: Controller_Response = response.data;

            // Check if the response status indicates success
            if (result.Status !== 1) {
                throw new Error(result.Message || 'Compression failed');
            }

            // Update images with compressed data
            const updatedImages = [...images];

            result.Data?.images?.forEach((compressedImage: any) => {
                const imageIndex = updatedImages.findIndex(
                    img => img.originalFile.name === compressedImage.originalName && 
                           imageIds.includes(img.id)
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

            setImages(updatedImages);

        } catch (error: any) {
            console.error('Compression error:', error);
            
            // Handle Controller_Response error format
            let errorMessage = 'Failed to compress images';
            if (error?.response?.data?.Message) {
                errorMessage = error.response.data.Message;
            } else if (error?.message) {
                errorMessage = error.message;
            }

            // Update specific images to error state
            setImages(prev => prev.map(img =>
                imageIds.includes(img.id) && img.status === 'compressing' 
                    ? { ...img, status: 'error', error: errorMessage } 
                    : img
            ));

            throw error;
        }
    };

    const compressSingle = async (imageId: string) => {
        // Update status to compressing
        setImages(prev => prev.map(img => 
            img.id === imageId ? { ...img, status: 'compressing' } : img
        ));

        try {
            await compressImagesBatch([imageId]);
        } catch (error) {
            // Error handling is done in compressImagesBatch
            console.error('Single compression error:', error);
        }
    };

    const retryCompression = async (imageId: string) => {
        // Reset status to pending and then compress
        setImages(prev => prev.map(img => 
            img.id === imageId ? { ...img, status: 'pending', error: undefined } : img
        ));
        
        // Small delay to ensure state update
        setTimeout(() => {
            compressSingle(imageId);
        }, 100);
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
                    </p>                    <p className="upload-description">
                        Supports JPG, PNG, WebP, TIFF, AVIF, BMP, ICO, HEIC, HEIF, SVG • Max {MAX_FILES} files
                    </p>
                    <button className="select-button">
                        <PhotoSizeSelectLarge style={{ fontSize: '1rem' }} />
                        Select Images
                    </button>                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/tiff,image/tif,image/avif,image/bmp,image/ico,image/x-icon,image/heic,image/heif,image/svg+xml"
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
                            <label className="setting-label">Output Format</label>                            <select
                                value={compressionSettings.format}
                                onChange={(e) => setCompressionSettings(prev => ({ ...prev, format: e.target.value as 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff' }))}
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
                                <option value="avif">AVIF</option>
                                <option value="tiff">TIFF</option>
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
                        <div className="action-buttons">                            <button
                                className={`action-button primary ${isCompressing ? 'loading' : ''}`}
                                onClick={compressImages}
                                disabled={isCompressing || !images.some(img => img.status === 'pending')}
                            >
                                <Compress style={{ fontSize: '1rem' }} />
                                {isCompressing ? 'Compressing...' : `Compress Pending (${images.filter(img => img.status === 'pending').length})`}
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
                                    </div>                                    <div className="image-actions">
                                        <span className={`status-chip ${image.status}`}>
                                            {image.status}
                                        </span>
                                        {image.status === 'pending' && (
                                            <button
                                                className="icon-button compress"
                                                onClick={() => compressSingle(image.id)}
                                                title="Compress this image"
                                            >
                                                <Compress style={{ fontSize: '1rem' }} />
                                            </button>
                                        )}
                                        {image.status === 'error' && (
                                            <button
                                                className="icon-button retry"
                                                onClick={() => retryCompression(image.id)}
                                                title="Retry compression"
                                            >
                                                <Refresh style={{ fontSize: '1rem' }} />
                                            </button>
                                        )}
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
