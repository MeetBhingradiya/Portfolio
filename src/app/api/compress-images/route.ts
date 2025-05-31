import { NextRequest } from 'next/server';
import sharp from 'sharp';
import { ControllerResponseMap } from '@Utils/ControllerResponseMap';
import { Controller_Response } from '@Types';

interface CompressionSettings {
    quality: number;
    format: 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff' | 'jpg';
    width?: number;
    height?: number;
    progressive?: boolean;
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        
        // Extract compression settings
        const settingsData = formData.get('settings') as string;
        if (!settingsData) {
            const response: Controller_Response = {
                Status: 0,
                Message: 'Compression settings not provided',
                StatusCode: 400
            };
            return ControllerResponseMap(response);
        }
        
        const settings: CompressionSettings = JSON.parse(settingsData);
        
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

        if (files.length > 10) {
            const response: Controller_Response = {
                Status: 0,
                Message: 'Maximum 10 files allowed',
                StatusCode: 400
            };
            return ControllerResponseMap(response);
        }

        const compressedImages = [];

        for (const file of files) {
            try {
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    compressedImages.push({
                        originalName: file.name,
                        error: 'Invalid file type. Only images are supported.'
                    });
                    continue;
                }

                // Convert file to buffer
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                // Setup Sharp instance
                let sharpInstance = sharp(buffer);

                // Get original image metadata
                const metadata = await sharpInstance.metadata();

                // Resize if dimensions are specified
                if ((settings.width && settings.width > 0) || (settings.height && settings.height > 0)) {
                    sharpInstance = sharpInstance.resize(
                        settings.width || null,
                        settings.height || null,
                        { 
                            fit: 'inside',
                            withoutEnlargement: true
                        }
                    );
                }

                // Apply format and quality settings
                let outputBuffer: Buffer;
                let mimeType: string;                switch (settings.format) {
                    case 'jpeg':
                        outputBuffer = await sharpInstance
                            .jpeg({ 
                                quality: settings.quality,
                                progressive: settings.progressive ?? true
                            })
                            .toBuffer();
                        mimeType = 'image/jpeg';
                        break;
                    case 'png':
                        outputBuffer = await sharpInstance
                            .png({ 
                                quality: settings.quality,
                                progressive: settings.progressive ?? true
                            })
                            .toBuffer();
                        mimeType = 'image/png';
                        break;
                    case 'webp':
                        outputBuffer = await sharpInstance
                            .webp({ 
                                quality: settings.quality
                            })
                            .toBuffer();
                        mimeType = 'image/webp';
                        break;
                    case 'avif':
                        outputBuffer = await sharpInstance
                            .avif({ 
                                quality: settings.quality
                            })
                            .toBuffer();
                        mimeType = 'image/avif';
                        break;
                    case 'tiff':
                        outputBuffer = await sharpInstance
                            .tiff({ 
                                quality: settings.quality
                            })
                            .toBuffer();
                        mimeType = 'image/tiff';
                        break;
                    default:
                        outputBuffer = await sharpInstance.toBuffer();
                        mimeType = file.type;
                }

                // Calculate compression ratio
                const originalSize = file.size;
                const compressedSize = outputBuffer.length;
                const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

                // Convert buffer to base64 for response
                const base64Data = outputBuffer.toString('base64');

                compressedImages.push({
                    originalName: file.name,
                    originalSize,
                    compressedSize,
                    compressionRatio: Math.max(0, compressionRatio),
                    data: base64Data,
                    mimeType,
                    originalWidth: metadata.width,
                    originalHeight: metadata.height
                });

            } catch (error) {
                console.error('Error compressing image:', error);
                compressedImages.push({
                    originalName: file.name,
                    error: error instanceof Error ? error.message : 'Unknown compression error'
                });
            }
        }

        const response: Controller_Response = {
            Status: 1,
            Message: 'Images compressed successfully',
            StatusCode: 200,
            Data: {
                images: compressedImages
            }
        };

        return ControllerResponseMap(response);

    } catch (error) {
        console.error('API Error:', error);
        
        const response: Controller_Response = {
            Status: 0,
            Message: 'Internal server error',
            StatusCode: 500,
            Debug: error instanceof Error ? error.message : 'Unknown error'
        };
        
        return ControllerResponseMap(response);
    }
}

// Add OPTIONS handler for CORS if needed
// export async function OPTIONS() {
//     return new NextResponse(null, {
//         status: 200,
//         headers: {
//             'Access-Control-Allow-Origin': '*',
//             'Access-Control-Allow-Methods': 'POST, OPTIONS',
//             'Access-Control-Allow-Headers': 'Content-Type, x-csrf',
//         },
//     });
// }
