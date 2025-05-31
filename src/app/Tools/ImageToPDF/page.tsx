"use client";

import React, { useState, useRef, useEffect } from 'react';
import "@Styles/Tools-ImageToPDF.sass";
import {
    CloudUpload,
    Download,
    Delete,
    Image as ImageIcon,
    PictureAsPdf,
    PhotoSizeSelectLarge,
    Refresh,
    GridView,
    ViewList,
    Visibility,
    DragIndicator
} from '@mui/icons-material';
import {
    Select,
    SelectItem,
    Button
} from '@heroui/react';
import { Axios } from '@Utils/Axios';
import { Controller_Response } from '@Types';
import { fetchWithCSRF } from '@Utils/FetchWithCSRF';

interface ImageToPDF {
    id: string;
    file: File;
    preview: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    error?: string;
    order: number;
}

const MAX_FILES = 20;
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

export default function ImageToPDF() {
    const [images, setImages] = useState<ImageToPDF[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');    const [pdfSettings, setPdfSettings] = useState({
        pageSize: 'A4' as 'A4' | 'Letter' | 'A3' | 'A5',
        orientation: 'portrait' as 'portrait' | 'landscape',
        margin: 0,
        fitToPage: true,
        filename: 'images-to-pdf'
    });    const [isDragOver, setIsDragOver] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const generateImagePreview = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const validateFile = (file: File): boolean => {
        if (!SUPPORTED_FORMATS.includes(file.type)) {
            alert(`File ${file.name} is not a supported image format.`);
            return false;
        }
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            alert(`File ${file.name} is too large. Maximum size is 50MB.`);
            return false;
        }
        return true;
    };

    const handleFiles = async (files: FileList | File[]) => {
        const fileArray = Array.from(files);
        
        if (images.length + fileArray.length > MAX_FILES) {
            alert(`Maximum ${MAX_FILES} files allowed. You can add ${MAX_FILES - images.length} more files.`);
            return;
        }

        const validFiles = fileArray.filter(validateFile);
        
        const newImages: ImageToPDF[] = [];
        
        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            try {
                const preview = await generateImagePreview(file);
                const newImage: ImageToPDF = {
                    id: Date.now().toString() + i,
                    file,
                    preview,
                    status: 'pending',
                    order: images.length + newImages.length
                };
                newImages.push(newImage);
            } catch (error) {
                console.error('Error generating preview for', file.name, error);
            }
        }

        setImages(prev => [...prev, ...newImages]);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(e.target.files);
        }
    };

    const removeImage = (id: string) => {
        setImages(prev => prev.filter(img => img.id !== id).map((img, index) => ({ ...img, order: index })));
    };

    const clearAllImages = () => {
        setImages([]);
    };    const moveImage = (dragIndex: number, hoverIndex: number) => {
        const newImages = [...images];
        const draggedImage = newImages[dragIndex];
        newImages.splice(dragIndex, 1);
        newImages.splice(hoverIndex, 0, draggedImage);
        
        // Update order
        const reorderedImages = newImages.map((img, index) => ({ ...img, order: index }));
        setImages(reorderedImages);
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', '');
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleDragOverItem = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (draggedIndex !== null && draggedIndex !== index) {
            moveImage(draggedIndex, index);
            setDraggedIndex(index);
        }
    };

    const handleDropItem = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDraggedIndex(null);
    };

    const generatePDF = async () => {
        if (images.length === 0) {
            alert('Please add at least one image.');
            return;
        }

        setIsProcessing(true);

        try {
            const formData = new FormData();
            formData.append('settings', JSON.stringify(pdfSettings));
            
            // Sort images by order and append to form data
            const sortedImages = [...images].sort((a, b) => a.order - b.order);
            sortedImages.forEach((image, index) => {
                formData.append(`file_${index}`, image.file);
            });            const response = await fetchWithCSRF('/api/images-to-pdf', {
                method: 'POST',
                body: formData,
            });

            // Get the response data (Controller_Response structure)
            const result: Controller_Response = response.data;

            if (result.Status === 1 && result.Data) {
                // Create download link
                const byteCharacters = atob(result.Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${pdfSettings.filename}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                // Mark all images as completed
                setImages(prev => prev.map(img => ({ ...img, status: 'completed' })));
            } else {
                throw new Error(result.Message || 'Failed to generate PDF');
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
            setImages(prev => prev.map(img => ({ ...img, status: 'error', error: 'Failed to generate PDF' })));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="ImageToPDF">
            <div className="title">Image to PDF Converter</div>
            <div className="description">
                Convert your images to PDF with customizable settings. Supports up to {MAX_FILES} files.
            </div>

            {/* Upload Section */}
            <div className="upload-container glass">
                <div
                    className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <CloudUpload className="upload-icon" />
                    <div className="upload-text">
                        <div className="main-text">
                            Drop images here or click to browse
                        </div>
                        <div className="sub-text">
                            Supports: JPEG, PNG, WebP, TIFF, AVIF, BMP, ICO, HEIC, HEIF, SVG
                        </div>
                        <div className="sub-text">
                            Maximum {MAX_FILES} files, 50MB each
                        </div>
                    </div>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={SUPPORTED_FORMATS.join(',')}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
            </div>

            {/* PDF Settings */}
            {images.length > 0 && (
                <div className="settings-container glass">
                    <h3>PDF Settings</h3>
                    <div className="settings-grid">                        <div className="setting-item">
                            <label>Page Size:</label>
                            <Select
                                selectedKeys={[pdfSettings.pageSize]}
                                onSelectionChange={(keys) => {
                                    const selectedKey = Array.from(keys)[0] as string;
                                    setPdfSettings(prev => ({ ...prev, pageSize: selectedKey as any }));
                                }}
                                className="setting-select"
                            >
                                <SelectItem key="A4">A4</SelectItem>
                                <SelectItem key="Letter">Letter</SelectItem>
                                <SelectItem key="A3">A3</SelectItem>
                                <SelectItem key="A5">A5</SelectItem>
                            </Select>
                        </div>

                        <div className="setting-item">
                            <label>Orientation:</label>
                            <Select
                                selectedKeys={[pdfSettings.orientation]}
                                onSelectionChange={(keys) => {
                                    const selectedKey = Array.from(keys)[0] as string;
                                    setPdfSettings(prev => ({ ...prev, orientation: selectedKey as any }));
                                }}
                                className="setting-select"
                            >
                                <SelectItem key="portrait">Portrait</SelectItem>
                                <SelectItem key="landscape">Landscape</SelectItem>
                            </Select>                        </div>

                        <div className="setting-item">
                            <label>Filename:</label>
                            <input
                                type="text"
                                value={pdfSettings.filename}
                                onChange={(e) => setPdfSettings(prev => ({ ...prev, filename: e.target.value }))}
                                className="filename-input"
                                placeholder="Enter PDF filename"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Images List/Grid */}
            {images.length > 0 && (
                <div className="images-container glass">
                    <div className="images-header">
                        <div className="images-info">
                            <span className="images-count">{images.length} image{images.length !== 1 ? 's' : ''} selected</span>
                        </div>

                        <div className="images-actions">
                            <button
                                className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                                title="List view"
                            >
                                <ViewList />
                            </button>
                            <button
                                className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="Grid view"
                            >
                                <GridView />
                            </button>
                            <button
                                className="clear-all-btn"
                                onClick={clearAllImages}
                                title="Clear all images"
                            >
                                <Delete />
                                Clear All
                            </button>
                        </div>
                    </div>                    <div className={`images-list ${viewMode}`}>
                        {images
                            .sort((a, b) => a.order - b.order)
                            .map((image, index) => (
                                <div 
                                    key={image.id} 
                                    className={`image-item ${draggedIndex === index ? 'dragging' : ''}`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => handleDragOverItem(e, index)}
                                    onDrop={(e) => handleDropItem(e, index)}
                                >
                                    <div className="image-preview">
                                        <img src={image.preview} alt={image.file.name} />
                                        <div className="image-overlay">
                                            <div className="image-order">#{index + 1}</div>
                                            <DragIndicator className="drag-handle" />
                                        </div>
                                    </div>

                                    <div className="image-info">
                                        <div className="image-name" title={image.file.name}>
                                            {image.file.name}
                                        </div>
                                        <div className="image-details">
                                            <span className="image-size">{formatBytes(image.file.size)}</span>
                                            <span className="image-status status-${image.status}">
                                                {image.status}
                                            </span>
                                        </div>
                                        {image.error && (
                                            <div className="image-error">{image.error}</div>
                                        )}
                                    </div>

                                    <div className="image-actions">
                                        <button
                                            className="action-btn remove-btn"
                                            onClick={() => removeImage(image.id)}
                                            title="Remove image"
                                        >
                                            <Delete />
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>

                    <div className="generate-pdf-section">
                        <Button
                            color="primary"
                            size="lg"
                            startContent={<PictureAsPdf />}
                            onClick={generatePDF}
                            disabled={isProcessing || images.length === 0}
                            className="generate-pdf-btn"
                        >
                            {isProcessing ? 'Generating PDF...' : 'Generate PDF'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
