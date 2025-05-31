import { NextRequest } from 'next/server';
import jsPDF from 'jspdf';
import sharp from 'sharp';
import { ControllerResponseMap } from '@Utils/ControllerResponseMap';
import { Controller_Response } from '@Types';

interface PDFSettings {
    pageSize: 'A4' | 'Letter' | 'A3' | 'A5';
    orientation: 'portrait' | 'landscape';
    imageQuality: number;
    margin: number;
    fitToPage: boolean;
    filename: string;
}

// Page size definitions in mm
const PAGE_SIZES = {
    A4: { width: 210, height: 297 },
    Letter: { width: 216, height: 279 },
    A3: { width: 297, height: 420 },
    A5: { width: 148, height: 210 }
};

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        // Extract PDF settings
        const settingsData = formData.get('settings') as string;
        if (!settingsData) {
            const response: Controller_Response = {
                Status: 0,
                Message: 'PDF settings not provided',
                StatusCode: 400
            };
            return ControllerResponseMap(response);
        }

        const settings: PDFSettings = JSON.parse(settingsData);

        // Extract files
        const files: File[] = [];
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('file_') && value && typeof value === 'object' && 'name' in value && 'type' in value) {
                files.push(value as File);
            }
        }

        if (files.length === 0) {
            const response: Controller_Response = {
                Status: 0,
                Message: 'No files provided',
                StatusCode: 400
            };
            return ControllerResponseMap(response);
        }

        if (files.length > 20) {
            const response: Controller_Response = {
                Status: 0,
                Message: 'Maximum 20 files allowed',
                StatusCode: 400
            };
            return ControllerResponseMap(response);
        }

        // Validate file types
        const supportedTypes = [
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

        for (const file of files) {
            if (!supportedTypes.includes(file.type)) {
                const response: Controller_Response = {
                    Status: 0,
                    Message: `Unsupported file type: ${file.type}`,
                    StatusCode: 400
                };
                return ControllerResponseMap(response);
            }

            if (file.size > 50 * 1024 * 1024) { // 50MB limit
                const response: Controller_Response = {
                    Status: 0,
                    Message: `File ${file.name} is too large. Maximum size is 50MB.`,
                    StatusCode: 400
                };
                return ControllerResponseMap(response);
            }
        }

        // Get page dimensions
        const pageSize = PAGE_SIZES[settings.pageSize];
        const isLandscape = settings.orientation === 'landscape';
        const pageWidth = isLandscape ? pageSize.height : pageSize.width;
        const pageHeight = isLandscape ? pageSize.width : pageSize.height;

        // Create PDF
        const pdf = new jsPDF({
            orientation: settings.orientation,
            unit: 'mm',
            format: settings.pageSize.toLowerCase() as any
        });

        // Calculate usable area (accounting for margins)
        const usableWidth = pageWidth - (2 * settings.margin);
        const usableHeight = pageHeight - (2 * settings.margin);

        let isFirstPage = true;        for (const file of files) {
            try {
                // Convert file to buffer and get image info
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                
                // Get image metadata using sharp
                const metadata = await sharp(buffer).metadata();
                const imgWidth = metadata.width || 800;
                const imgHeight = metadata.height || 600;
                const imgAspectRatio = imgWidth / imgHeight;

                // Convert to base64 for jsPDF
                const base64 = buffer.toString('base64');
                const dataUrl = `data:${file.type};base64,${base64}`;                // Make image fill the entire page (no margins, full bleed)
                let finalWidth = pageWidth;
                let finalHeight = pageHeight;
                
                // If we want to maintain aspect ratio and fit the image
                if (settings.fitToPage) {
                    const pageAspectRatio = pageWidth / pageHeight;
                    
                    if (imgAspectRatio > pageAspectRatio) {
                        // Image is wider than page ratio - fit to width
                        finalWidth = pageWidth;
                        finalHeight = pageWidth / imgAspectRatio;
                    } else {
                        // Image is taller than page ratio - fit to height  
                        finalHeight = pageHeight;
                        finalWidth = pageHeight * imgAspectRatio;
                    }
                }

                // Center the image on the page (no margin consideration for full bleed)
                const x = (pageWidth - finalWidth) / 2;
                const y = (pageHeight - finalHeight) / 2;

                // Add new page if not the first image
                if (!isFirstPage) {
                    pdf.addPage();
                }
                isFirstPage = false;

                // Determine image format for jsPDF
                let imageFormat = 'JPEG';
                if (file.type === 'image/png') {
                    imageFormat = 'PNG';
                } else if (file.type === 'image/webp') {
                    imageFormat = 'WEBP';
                }

                // Add image to PDF
                pdf.addImage(
                    dataUrl,
                    imageFormat,
                    x,
                    y,
                    finalWidth,
                    finalHeight
                );

            } catch (error) {
                console.error(`Error processing image ${file.name}:`, error);
                const response: Controller_Response = {
                    Status: 0,
                    Message: `Error processing image ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    StatusCode: 500
                };
                return ControllerResponseMap(response);
            }
        }

        // Generate PDF as base64
        const pdfBase64 = pdf.output('datauristring').split(',')[1];

        const response: Controller_Response = {
            Status: 1,
            Message: 'PDF generated successfully',
            StatusCode: 200,
            Data: pdfBase64
        };

        return ControllerResponseMap(response);

    } catch (error) {
        console.error('Error generating PDF:', error);
        const response: Controller_Response = {
            Status: 0,
            Message: `Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
            StatusCode: 500
        };
        return ControllerResponseMap(response);
    }
}
