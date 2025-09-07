"use client";

import React, { useState, useRef, useCallback } from "react";
import {
    CloudUpload,
    Download,
    Delete,
    MergeType,
    PictureAsPdf,
    DragIndicator,
    Refresh,
    SwapVert,
    Preview
} from "@mui/icons-material";
import { Button } from "@heroui/react";
import { PDFDocument } from "pdf-lib";

interface PDFFile {
    id: string;
    file: File;
    name: string;
    size: string;
    status: "pending" | "processing" | "completed" | "error";
    error?: string;
    order: number;
    pageCount?: number;
}

const MAX_FILES = 50;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function MergePDFs() {
    const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [draggedItem, setDraggedItem] = useState<string | null>(null);
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
            return "File size exceeds 50MB limit";
        }
        return null;
    };

    const countPDFPages = async (file: File): Promise<number> => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            return pdfDoc.getPageCount();
        } catch (error) {
            console.error("Error counting PDF pages:", error);
            return 0;
        }
    };

    const handleFileSelect = async (files: FileList | null) => {
        if (!files) return;

        const newFiles: PDFFile[] = [];
        const currentCount = pdfFiles.length;

        for (let i = 0; i < Math.min(files.length, MAX_FILES - currentCount); i++) {
            const file = files[i];
            const error = validateFile(file);

            if (!error) {
                const id = `pdf-${Date.now()}-${i}`;
                const pageCount = await countPDFPages(file);
                
                newFiles.push({
                    id,
                    file,
                    name: file.name,
                    size: formatFileSize(file.size),
                    status: "pending",
                    order: currentCount + i,
                    pageCount
                });
            }
        }

        setPdfFiles(prev => [...prev, ...newFiles]);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        handleFileSelect(files);
    }, [pdfFiles]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const removePDF = (id: string) => {
        setPdfFiles(prev => prev.filter(pdf => pdf.id !== id));
    };

    const clearAll = () => {
        setPdfFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const moveItem = (dragIndex: number, dropIndex: number) => {
        const draggedPDF = pdfFiles[dragIndex];
        const updatedFiles = [...pdfFiles];
        updatedFiles.splice(dragIndex, 1);
        updatedFiles.splice(dropIndex, 0, draggedPDF);
        
        // Update order numbers
        const reorderedFiles = updatedFiles.map((pdf, index) => ({
            ...pdf,
            order: index
        }));
        
        setPdfFiles(reorderedFiles);
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedItem(id);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    };

    const handleItemDrop = (e: React.DragEvent, dropId: string) => {
        e.preventDefault();
        
        if (!draggedItem || draggedItem === dropId) return;
        
        const dragIndex = pdfFiles.findIndex(pdf => pdf.id === draggedItem);
        const dropIndex = pdfFiles.findIndex(pdf => pdf.id === dropId);
        
        if (dragIndex !== -1 && dropIndex !== -1) {
            moveItem(dragIndex, dropIndex);
        }
    };

    const mergePDFs = async () => {
        if (pdfFiles.length < 2) {
            alert("Please select at least 2 PDF files to merge");
            return;
        }

        setIsProcessing(true);

        try {
            const mergedPdf = await PDFDocument.create();
            
            // Sort files by order
            const sortedFiles = [...pdfFiles].sort((a, b) => a.order - b.order);
            
            for (const pdfFile of sortedFiles) {
                try {
                    const arrayBuffer = await pdfFile.file.arrayBuffer();
                    const pdf = await PDFDocument.load(arrayBuffer);
                    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    copiedPages.forEach((page) => mergedPdf.addPage(page));
                } catch (error) {
                    console.error(`Error processing ${pdfFile.name}:`, error);
                    setPdfFiles(prev => prev.map(pdf => 
                        pdf.id === pdfFile.id 
                            ? { ...pdf, status: "error", error: "Failed to process file" }
                            : pdf
                    ));
                }
            }

            const pdfBytes = await mergedPdf.save();
            const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement("a");
            link.href = url;
            link.download = `merged-document-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            // Update all files to completed status
            setPdfFiles(prev => prev.map(pdf => ({ ...pdf, status: "completed" })));
            
        } catch (error) {
            console.error("Error merging PDFs:", error);
            alert("An error occurred while merging the PDFs. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const totalPages = pdfFiles.reduce((sum, pdf) => sum + (pdf.pageCount || 0), 0);

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="text-center mb-8">
                <MergeType className="mx-auto mb-4 text-6xl text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    Merge PDF Files
                </h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Combine multiple PDF files into a single document. Upload your PDFs, 
                    reorder them as needed, and download the merged result.
                </p>
            </div>

            {/* Upload Section */}
            <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6 hover:border-blue-400 transition-colors"
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
                    disabled={pdfFiles.length >= MAX_FILES}
                >
                    <CloudUpload className="mr-2" />
                    Select PDF Files
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                    Maximum {MAX_FILES} files, up to 50MB each
                </p>
            </div>

            {/* File List */}
            {pdfFiles.length > 0 && (
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            Files to Merge ({pdfFiles.length})
                            {totalPages > 0 && (
                                <span className="text-sm text-gray-500 ml-2">
                                    ({totalPages} pages total)
                                </span>
                            )}
                        </h3>
                        <div className="flex gap-2">
                            <Button
                                color="danger"
                                variant="flat"
                                size="sm"
                                onClick={clearAll}
                            >
                                <Delete className="mr-1" />
                                Clear All
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {pdfFiles
                            .sort((a, b) => a.order - b.order)
                            .map((pdf, index) => (
                                <div
                                    key={pdf.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, pdf.id)}
                                    onDragEnd={handleDragEnd}
                                    onDrop={(e) => handleItemDrop(e, pdf.id)}
                                    onDragOver={(e) => e.preventDefault()}
                                    className={`flex items-center p-4 bg-white rounded-lg border ${
                                        draggedItem === pdf.id
                                            ? "border-blue-400 shadow-md"
                                            : "border-gray-200"
                                    } hover:border-gray-300 transition-all cursor-move`}
                                >
                                    <DragIndicator className="text-gray-400 mr-3" />
                                    <div className="flex-shrink-0 mr-3">
                                        <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                                            {index + 1}
                                        </span>
                                    </div>
                                    <PictureAsPdf className="text-red-500 mr-3" />
                                    <div className="flex-grow">
                                        <p className="font-medium text-gray-800 truncate">
                                            {pdf.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {pdf.size}
                                            {pdf.pageCount && pdf.pageCount > 0 && (
                                                <span className="ml-2">
                                                    • {pdf.pageCount} page{pdf.pageCount !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </p>
                                        {pdf.status === "error" && (
                                            <p className="text-sm text-red-500 mt-1">
                                                {pdf.error}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        isIconOnly
                                        color="danger"
                                        variant="flat"
                                        size="sm"
                                        onClick={() => removePDF(pdf.id)}
                                    >
                                        <Delete />
                                    </Button>
                                </div>
                            ))}
                    </div>

                    {pdfFiles.length >= 2 && (
                        <div className="mt-6 text-center">
                            <Button
                                color="success"
                                size="lg"
                                onClick={mergePDFs}
                                disabled={isProcessing}
                                isLoading={isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Refresh className="mr-2 animate-spin" />
                                        Merging PDFs...
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2" />
                                        Merge & Download PDF
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-6 mt-8">
                <h3 className="font-semibold text-blue-800 mb-2">How to use:</h3>
                <ul className="text-blue-700 space-y-1 list-disc list-inside">
                    <li>Upload multiple PDF files (maximum 50 files, 50MB each)</li>
                    <li>Drag and drop files to reorder them</li>
                    <li>Click &quot;Merge &amp; Download PDF&quot; to combine all files</li>
                    <li>Files are processed locally in your browser for privacy</li>
                </ul>
            </div>
        </div>
    );
}
