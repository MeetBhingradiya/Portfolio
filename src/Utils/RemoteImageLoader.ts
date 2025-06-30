import { ImageLoaderProps } from 'next/image';

export default function RemoteImageLoader({ src, width, quality }: ImageLoaderProps): string {
    // For local images (starting with /), return as-is
    if (src.startsWith('/')) {
        return src;
    }
    
    // For external/remote images, you can add optimization logic here
    if (src.startsWith('http')) {
        // Just return the URL as-is for now
        return src;
    }
    
    // Fallback - return src as-is
    return src;
}