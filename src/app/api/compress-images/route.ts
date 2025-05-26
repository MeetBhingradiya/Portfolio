import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

interface CompressionSettings {
    quality: number;
    format: 'jpeg' | 'png' | 'webp';
    width?: number;
    height?: number;
    progressive?: boolean;
}

interface FileData {
    name: string;
    data: string; // base64
    type: string;
    size: number;
}

export async function POST(request: NextRequest) {
    try {
        const { files, settings }: { files: FileData[], settings: CompressionSettings } = await request.json();
        
        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files provided' }, { status: 400 });
        }

        if (files.length > 10) {
            return NextResponse.json({ error: 'Maximum 10 files allowed' }, { status: 400 });
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

                // Convert base64 to buffer
                const buffer = Buffer.from(file.data, 'base64');

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
                let mimeType: string;

                switch (settings.format) {
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

        return NextResponse.json({ 
            success: true,
            images: compressedImages 
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' }, 
            { status: 500 }
        );
    }
}

// Add OPTIONS handler for CORS if needed
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, x-csrf',
        },
    });
}
