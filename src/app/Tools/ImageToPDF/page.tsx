"use client";

import React, { useState, useRef, useEffect } from 'react';
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
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [pdfSettings, setPdfSettings] = useState({
        pageSize: 'A4' as 'A4' | 'Letter' | 'A3' | 'A5',
        orientation: 'portrait' as 'portrait' | 'landscape',
        margin: 0,
        fitToPage: true,
        filename: 'images-to-pdf'
    });
    const [isDragOver, setIsDragOver] = useState(false);
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
    }; const moveImage = (dragIndex: number, hoverIndex: number) => {
        const newImages = [...images];
        const draggedImage = newImages[dragIndex];
        newImages.splice(dragIndex, 1);
        newImages.splice(hoverIndex, 0, draggedImage);

        // Update order
        const reorderedImages = newImages.map((img, index) => ({ ...img, order: index }));
        setImages(reorderedImages);
    }; const handleDragStart = (e: React.DragEvent, index: number) => {
        const sortedImages = [...images].sort((a, b) => a.order - b.order);
        const actualIndex = images.findIndex(img => img.id === sortedImages[index].id);
        setDraggedIndex(actualIndex);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', '');
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleDragOverItem = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (draggedIndex !== null) {
            const sortedImages = [...images].sort((a, b) => a.order - b.order);
            const actualDropIndex = images.findIndex(img => img.id === sortedImages[index].id);

            if (draggedIndex !== actualDropIndex) {
                moveImage(draggedIndex, actualDropIndex);
                setDraggedIndex(actualDropIndex);
            }
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
            }); const response = await fetchWithCSRF('/api/images-to-pdf', {
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
    }; return (
        <div className="flex flex-col items-center w-full max-w-5xl mx-auto px-4 py-6 min-h-max pb-16">
            <div className="text-3xl font-bold mb-2 text-center text-white">
                Image to PDF Converter
            </div>
            <div className="text-base text-gray-400 mb-8 text-center">
                Convert your images to PDF with customizable settings. Supports up to {MAX_FILES} files.
            </div>

            {/* Upload Section */}
            <div className="flex flex-col mb-6 w-full max-w-3xl bg-black/10 backdrop-blur-lg border border-white/20 rounded-lg p-4 transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] hover:border-white/30">
                <div
                    className={`flex flex-col items-center justify-center border-2 border-dashed ${isDragOver ? 'border-accent bg-white/10' : 'border-white/30 bg-white/5'
                        } rounded-lg p-8 cursor-pointer transition-all duration-300 hover:border-accent hover:bg-white/10 hover:-translate-y-0.5`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <CloudUpload className="text-5xl text-accent mb-4" />
                    <div className="text-center text-white">
                        <div className="text-xl font-semibold mb-2">
                            Drop images here or click to browse
                        </div>
                        <div className="text-sm text-gray-400 mb-1">
                            Supports: JPEG, PNG, WebP, TIFF, AVIF, BMP, ICO, HEIC, HEIF, SVG
                        </div>
                        <div className="text-sm text-gray-400">
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
                    className="hidden"
                />
            </div>

            {/* PDF Settings */}
            {images.length > 0 && (
                <div className="w-full max-w-3xl mb-6 bg-black/10 backdrop-blur-lg border border-white/20 rounded-lg p-4 transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] hover:border-white/30">
                    <h3 className="text-white mb-4 text-xl font-semibold">PDF Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-white font-medium text-sm">Page Size:</label>
                            <Select
                                selectedKeys={[pdfSettings.pageSize]}
                                onSelectionChange={(keys) => {
                                    const selectedKey = Array.from(keys)[0] as string;
                                    setPdfSettings(prev => ({ ...prev, pageSize: selectedKey as any }));
                                }}
                                variant="bordered"
                                size="sm"
                                classNames={{
                                    trigger: "bg-white/10 border-white/20 text-white"
                                }}
                            >
                                <SelectItem key="A4">A4</SelectItem>
                                <SelectItem key="Letter">Letter</SelectItem>
                                <SelectItem key="A3">A3</SelectItem>
                                <SelectItem key="A5">A5</SelectItem>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-white font-medium text-sm">Orientation:</label>
                            <Select
                                selectedKeys={[pdfSettings.orientation]}
                                onSelectionChange={(keys) => {
                                    const selectedKey = Array.from(keys)[0] as string;
                                    setPdfSettings(prev => ({ ...prev, orientation: selectedKey as any }));
                                }}
                                variant="bordered"
                                size="sm"
                                classNames={{
                                    trigger: "bg-white/10 border-white/20 text-white"
                                }}
                            >
                                <SelectItem key="portrait">Portrait</SelectItem>
                                <SelectItem key="landscape">Landscape</SelectItem>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-white font-medium text-sm">Filename:</label>
                            <input
                                type="text"
                                value={pdfSettings.filename}
                                onChange={(e) => setPdfSettings(prev => ({ ...prev, filename: e.target.value }))}
                                className="px-3 py-2 border border-white/20 rounded-md bg-white/10 text-white text-sm transition-all duration-300 focus:outline-none focus:border-accent focus:bg-white/15 placeholder:text-gray-400"
                                placeholder="Enter PDF filename"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Images List/Grid */}
            {images.length > 0 && (
                <div className="w-full max-w-4xl bg-black/10 backdrop-blur-lg border border-white/20 rounded-lg p-4 transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] hover:border-white/30">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                        <h3 className="text-xl font-semibold text-white">Images ({images.length})</h3>

                        <div className="flex items-center gap-4">
                            <div className="flex border border-white/20 rounded overflow-hidden">
                                <button
                                    className={`p-2 bg-white/10 border-none text-gray-400 cursor-pointer transition-all duration-300 flex items-center justify-center hover:bg-white/20 hover:text-white ${viewMode === 'list' ? 'bg-accent text-white' : ''
                                        }`}
                                    onClick={() => setViewMode('list')}
                                    title="List view"
                                >
                                    <ViewList style={{ fontSize: '1rem' }} />
                                </button>
                                <button
                                    className={`p-2 bg-white/10 border-none text-gray-400 cursor-pointer transition-all duration-300 flex items-center justify-center hover:bg-white/20 hover:text-white ${viewMode === 'grid' ? 'bg-accent text-white' : ''
                                        }`}
                                    onClick={() => setViewMode('grid')}
                                    title="Grid view"
                                >
                                    <GridView style={{ fontSize: '1rem' }} />
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            <button
                                className={`px-4 py-2 rounded border border-white/20 bg-white/10 text-white cursor-pointer transition-all duration-300 flex items-center gap-2 text-sm font-medium hover:bg-white/20 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed ${isProcessing
                                    ? 'bg-accent border-accent text-white animate-pulse'
                                    : 'bg-accent border-accent text-white hover:bg-accent/80 hover:border-accent/80'
                                    }`}
                                onClick={generatePDF}
                                disabled={isProcessing || images.length === 0}
                            >
                                <PictureAsPdf style={{ fontSize: '1rem' }} />
                                {isProcessing ? 'Generating PDF...' : 'Generate PDF'}
                            </button>
                            <button
                                className="px-4 py-2 rounded border border-red-500/30 bg-red-500/10 text-red-400 cursor-pointer transition-all duration-300 flex items-center gap-2 text-sm font-medium hover:bg-red-500/20 hover:border-red-500/50"
                                onClick={clearAllImages}
                            >
                                <Delete style={{ fontSize: '1rem' }} />
                                Clear All
                            </button>
                        </div>
                    </div>                    <div className={`${viewMode === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                        : 'flex flex-col gap-3'
                        }`}>
                        {images
                            .sort((a, b) => a.order - b.order)
                            .map((image, sortedIndex) => {
                                const actualIndex = images.findIndex(img => img.id === image.id);
                                return (<div
                                    key={image.id}
                                    className={`${viewMode === 'grid'
                                        ? 'flex flex-col overflow-hidden'
                                        : 'flex items-center p-3'
                                        } bg-white/5 border border-white/10 rounded-lg transition-all duration-300 cursor-move hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 hover:cursor-grab active:cursor-grabbing ${draggedIndex === actualIndex
                                            ? 'opacity-60 scale-95 rotate-1 bg-white/20 border-accent shadow-[0_8px_25px_rgba(0,0,0,0.3)] z-10'
                                            : ''
                                        }`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, sortedIndex)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => handleDragOverItem(e, sortedIndex)}
                                    onDrop={(e) => handleDropItem(e, sortedIndex)}
                                >                                        <div className={`relative ${viewMode === 'grid'
                                    ? 'w-full h-36'
                                    : 'w-16 h-16 mr-4 flex-shrink-0 rounded-md'
                                    } overflow-hidden`}>
                                        <img
                                            src={image.preview}
                                            alt={image.file.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                                            <div className="absolute top-1 left-1 bg-accent text-white px-1.5 py-0.5 rounded text-xs font-semibold">
                                                #{sortedIndex + 1}
                                            </div>
                                            <DragIndicator className="text-white text-2xl cursor-grab hover:scale-110 hover:opacity-100 active:cursor-grabbing active:scale-95 transition-all duration-300" />
                                        </div>
                                        {viewMode === 'grid' && (
                                            <button
                                                className="absolute top-2 right-2 p-1.5 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 hover:border-red-500/50 rounded-full text-red-400 hover:text-red-300 cursor-pointer transition-all duration-300 backdrop-blur-sm"
                                                onClick={() => removeImage(image.id)}
                                                title="Remove image"
                                            >
                                                <Delete fontSize="small" />
                                            </button>
                                        )}
                                    </div>

                                    <div className={`flex-1 min-w-0 ${viewMode === 'grid'
                                        ? 'text-center p-3'
                                        : ''
                                        }`}>
                                        <div className="text-white font-medium mb-1 overflow-hidden text-ellipsis whitespace-nowrap" title={image.file.name}>
                                            {image.file.name}
                                        </div>
                                        <div className={`flex items-center gap-4 text-xs ${viewMode === 'grid' ? 'justify-center' : ''}`}>
                                            <span className="text-gray-400">{formatBytes(image.file.size)}</span>
                                            <span className={`px-1.5 py-0.5 rounded font-medium text-xs capitalize ${image.status === 'pending' ? 'bg-gray-500/20 text-gray-400' :
                                                image.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                                                    image.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                                        'bg-red-500/20 text-red-400'
                                                }`}>
                                                {image.status}
                                            </span>
                                        </div>
                                        {image.error && (
                                            <div className="text-red-400 text-xs mt-1">{image.error}</div>
                                        )}
                                    </div>
                                    {
                                        viewMode === 'list' && (
                                            <div className={`flex items-center gap-2`}>
                                                <button
                                                    className="p-2 bg-white/10 border border-white/20 rounded text-white cursor-pointer transition-all duration-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
                                                    onClick={() => removeImage(image.id)}
                                                    title="Remove image"
                                                >
                                                    <Delete fontSize="small" />
                                                </button>
                                            </div>
                                        )
                                    }
                                </div>
                                );
                            })}
                    </div>
                </div>
            )}
        </div>
    );
}
