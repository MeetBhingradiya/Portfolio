"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    CloudUpload,
    Download,
    Delete,
    PhotoLibrary,
    PictureAsPdf,
    Refresh,
    Settings,
    Image as ImageIcon,
    GetApp,
    Warning
} from "@mui/icons-material";
import { Button, Select, SelectItem, Slider } from "@heroui/react";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";

interface PDFConversion {
    id: string;
    file: File;
    name: string;
    size: string;
    status: "pending" | "processing" | "completed" | "error";
    error?: string;
    pageCount: number;
    selectedPages: number[];
    images: { pageNumber: number; dataUrl: string; name: string }[];
}

const IMAGE_FORMATS = [
    { key: "png", label: "PNG (High Quality)" },
    { key: "jpeg", label: "JPEG (Compressed)" },
    { key: "webp", label: "WebP (Modern)" }
];

const MAX_FILES = 10;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export default function PDFToImage() {
    const [pdfs, setPdfs] = useState<PDFConversion[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [outputFormat, setOutputFormat] = useState("png");
    const [quality, setQuality] = useState(90);
    const [scale, setScale] = useState(2); // DPI multiplier
    const [showWarning, setShowWarning] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const validateFile = (file: File): string | null => {
        if (file.type !== "application/pdf") {
            return "Only PDF files are allowed";
        }
        if (file.size > MAX_FILE_SIZE) {
            return "File size exceeds 100MB limit";
        }
        return null;
    };

    const loadPDF = async (file: File): Promise<{ pageCount: number; doc: any }> => {
        const arrayBuffer = await file.arrayBuffer();
        const doc = await PDFDocument.load(arrayBuffer);
        return { pageCount: doc.getPageCount(), doc };
    };

    const handleFileSelect = async (files: FileList | null) => {
        if (!files) return;

        const newPdfs: PDFConversion[] = [];
        const currentCount = pdfs.length;

        for (let i = 0; i < Math.min(files.length, MAX_FILES - currentCount); i++) {
            const file = files[i];
            const error = validateFile(file);

            if (!error) {
                try {
                    const { pageCount } = await loadPDF(file);
                    const id = `pdf-${Date.now()}-${i}`;
                    
                    newPdfs.push({
                        id,
                        file,
                        name: file.name,
                        size: formatFileSize(file.size),
                        status: "pending",
                        pageCount,
                        selectedPages: Array.from({ length: pageCount }, (_, i) => i + 1),
                        images: []
                    });
                } catch (error) {
                    console.error("Error loading PDF:", error);
                }
            }
        }

        setPdfs(prev => [...prev, ...newPdfs]);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        handleFileSelect(files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const removePDF = (id: string) => {
        setPdfs(prev => prev.filter(pdf => pdf.id !== id));
    };

    const clearAll = () => {
        setPdfs([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const togglePageSelection = (pdfId: string, pageNumber: number) => {
        setPdfs(prev => prev.map(pdf => {
            if (pdf.id === pdfId) {
                const selectedPages = pdf.selectedPages.includes(pageNumber)
                    ? pdf.selectedPages.filter(p => p !== pageNumber)
                    : [...pdf.selectedPages, pageNumber].sort((a, b) => a - b);
                return { ...pdf, selectedPages };
            }
            return pdf;
        }));
    };

    const selectAllPages = (pdfId: string) => {
        setPdfs(prev => prev.map(pdf => {
            if (pdf.id === pdfId) {
                return { 
                    ...pdf, 
                    selectedPages: Array.from({ length: pdf.pageCount }, (_, i) => i + 1)
                };
            }
            return pdf;
        }));
    };

    const deselectAllPages = (pdfId: string) => {
        setPdfs(prev => prev.map(pdf => {
            if (pdf.id === pdfId) {
                return { ...pdf, selectedPages: [] };
            }
            return pdf;
        }));
    };

    const convertPDFToImages = async (pdf: PDFConversion) => {
        // Note: This is a placeholder implementation
        // PDF to image conversion requires server-side processing or a more complex client-side setup
        throw new Error("PDF to Image conversion requires server-side processing. This feature will be implemented in a future update.");
    };

    const processConversions = async () => {
        if (pdfs.length === 0) {
            alert("Please select at least one PDF file");
            return;
        }

        const pdfToProcess = pdfs.filter(pdf => pdf.selectedPages.length > 0);
        if (pdfToProcess.length === 0) {
            alert("Please select at least one page to convert");
            return;
        }

        alert("PDF to Image conversion is currently under development. This feature will be available soon!");
        
        /* 
        // This would be the actual implementation when server-side processing is ready
        setIsProcessing(true);

        try {
            for (const pdf of pdfToProcess) {
                setPdfs(prev => prev.map(p => 
                    p.id === pdf.id ? { ...p, status: "processing" } : p
                ));

                try {
                    const images = await convertPDFToImages(pdf);
                    setPdfs(prev => prev.map(p => 
                        p.id === pdf.id 
                            ? { ...p, status: "completed", images }
                            : p
                    ));
                } catch (error) {
                    setPdfs(prev => prev.map(p => 
                        p.id === pdf.id 
                            ? { ...p, status: "error", error: "Failed to convert PDF" }
                            : p
                    ));
                }
            }
        } finally {
            setIsProcessing(false);
        }
        */
    };

    const downloadImage = (dataUrl: string, fileName: string) => {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadAllAsZip = async (pdf: PDFConversion) => {
        const zip = new JSZip();
        
        for (const image of pdf.images) {
            // Convert data URL to blob
            const response = await fetch(image.dataUrl);
            const blob = await response.blob();
            zip.file(image.name, blob);
        }
        
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(zipBlob);
        link.download = `${pdf.name.replace('.pdf', '')}_images.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="text-center mb-8">
                <PhotoLibrary className="mx-auto mb-4 text-6xl text-purple-600" />
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    PDF to Image Converter
                </h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Convert PDF pages to high-quality images. Choose your output format, 
                    select specific pages, and download individual images or as a ZIP file.
                </p>
                
                {/* Development Notice */}
                {showWarning && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start">
                            <Warning className="text-yellow-500 mr-3 mt-0.5" />
                            <div className="text-left">
                                <h4 className="font-medium text-yellow-800 mb-1">
                                    Feature Under Development
                                </h4>
                                <p className="text-sm text-yellow-700 mb-3">
                                    PDF to Image conversion is currently being developed and will require server-side processing for optimal performance. 
                                    You can still upload and preview PDFs, but the conversion functionality will be available in a future update.
                                </p>
                                <button
                                    onClick={() => setShowWarning(false)}
                                    className="text-sm text-yellow-600 hover:text-yellow-800 underline"
                                >
                                    Dismiss this notice
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Settings */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Conversion Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Output Format
                        </label>
                        <Select
                            selectedKeys={[outputFormat]}
                            onSelectionChange={(keys) => setOutputFormat(Array.from(keys)[0] as string)}
                        >
                            {IMAGE_FORMATS.map((format) => (
                                <SelectItem key={format.key}>
                                    {format.label}
                                </SelectItem>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quality: {quality}%
                        </label>
                        <Slider
                            value={quality}
                            onChange={(value) => setQuality(value as number)}
                            minValue={10}
                            maxValue={100}
                            step={5}
                            isDisabled={outputFormat === "png"}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Resolution Scale: {scale}x
                        </label>
                        <Slider
                            value={scale}
                            onChange={(value) => setScale(value as number)}
                            minValue={1}
                            maxValue={4}
                            step={0.5}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Upload Section */}
            <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6 hover:border-purple-400 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <CloudUpload className="mx-auto mb-4 text-4xl text-gray-400" />
                <p className="text-lg text-gray-600 mb-4">
                    Drag and drop PDF files here, or click to select
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                />
                <Button
                    color="primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={pdfs.length >= MAX_FILES}
                >
                    <CloudUpload className="mr-2" />
                    Select PDF Files
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                    Maximum {MAX_FILES} files, up to 100MB each
                </p>
            </div>

            {/* PDF List */}
            {pdfs.length > 0 && (
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            PDF Files ({pdfs.length})
                        </h3>
                        <div className="flex gap-2">
                            <Button
                                color="warning"
                                onClick={processConversions}
                                disabled={isProcessing || pdfs.every(pdf => pdf.selectedPages.length === 0)}
                                isLoading={isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Refresh className="mr-2" />
                                        Converting...
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon className="mr-2" />
                                        Preview Conversion (Demo)
                                    </>
                                )}
                            </Button>
                            <Button
                                color="danger"
                                variant="flat"
                                onClick={clearAll}
                            >
                                <Delete className="mr-1" />
                                Clear All
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {pdfs.map((pdf) => (
                            <div
                                key={pdf.id}
                                className="bg-white rounded-lg border border-gray-200 p-4"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center">
                                        <PictureAsPdf className="text-red-500 mr-3" />
                                        <div>
                                            <p className="font-medium text-gray-800">{pdf.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {pdf.size} • {pdf.pageCount} pages • {pdf.selectedPages.length} selected
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {pdf.status === "completed" && (
                                            <Button
                                                size="sm"
                                                color="success"
                                                variant="flat"
                                                onClick={() => downloadAllAsZip(pdf)}
                                            >
                                                <GetApp className="mr-1" />
                                                Download ZIP
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            onClick={() => selectAllPages(pdf.id)}
                                            variant="flat"
                                        >
                                            Select All
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => deselectAllPages(pdf.id)}
                                            variant="flat"
                                        >
                                            Deselect All
                                        </Button>
                                        <Button
                                            size="sm"
                                            color="danger"
                                            variant="flat"
                                            onClick={() => removePDF(pdf.id)}
                                        >
                                            <Delete />
                                        </Button>
                                    </div>
                                </div>

                                {pdf.status === "error" && (
                                    <div className="text-red-500 text-sm mb-3">
                                        {pdf.error}
                                    </div>
                                )}

                                {/* Page Selection */}
                                <div className="mb-3">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Select Pages:</p>
                                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                        {Array.from({ length: pdf.pageCount }, (_, i) => i + 1).map((pageNumber) => (
                                            <button
                                                key={pageNumber}
                                                onClick={() => togglePageSelection(pdf.id, pageNumber)}
                                                className={`px-3 py-1 text-sm rounded border transition-colors ${
                                                    pdf.selectedPages.includes(pageNumber)
                                                        ? "bg-purple-500 text-white border-purple-500"
                                                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                                }`}
                                            >
                                                {pageNumber}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Converted Images */}
                                {pdf.status === "completed" && pdf.images.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">Converted Images:</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                            {pdf.images.map((image) => (
                                                <div key={image.pageNumber} className="relative group">
                                                    <img
                                                        src={image.dataUrl}
                                                        alt={`Page ${image.pageNumber}`}
                                                        className="w-full h-20 object-cover rounded border"
                                                    />
                                                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                                                        <Button
                                                            size="sm"
                                                            color="primary"
                                                            onClick={() => downloadImage(image.dataUrl, image.name)}
                                                        >
                                                            <Download />
                                                        </Button>
                                                    </div>
                                                    <p className="text-xs text-center mt-1">Page {image.pageNumber}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="font-semibold text-purple-800 mb-2">How to use:</h3>
                <ul className="text-purple-700 space-y-1 list-disc list-inside">
                    <li>Upload PDF files (maximum 10 files, 100MB each)</li>
                    <li>Choose output format: PNG for quality, JPEG/WebP for smaller files</li>
                    <li>Adjust quality and resolution settings as needed</li>
                    <li>Select specific pages or use &quot;Select All&quot; for entire document</li>
                    <li><strong>Note:</strong> Full conversion functionality coming soon!</li>
                    <li>Current version allows PDF preview and page selection</li>
                </ul>
                
                <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-2">Development Status:</h4>
                    <p className="text-sm text-purple-700">
                        This tool is actively being developed. PDF to image conversion requires complex 
                        rendering capabilities that will be implemented with server-side processing 
                        for better performance and reliability.
                    </p>
                </div>
            </div>
        </div>
    );
}
