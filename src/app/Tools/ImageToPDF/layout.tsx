import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Image to PDF Converter | Convert Images to PDF Online',
    description: 'Convert multiple images to PDF with customizable settings. Supports batch processing up to 20 files with various image formats including JPEG, PNG, WebP, TIFF, and more.',
    keywords: 'image to pdf, convert images pdf, batch image conversion, pdf generator, image converter, online pdf tools',
    openGraph: {
        title: 'Image to PDF Converter | Convert Images to PDF Online',
        description: 'Convert multiple images to PDF with customizable settings. Supports batch processing up to 20 files.',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Image to PDF Converter | Convert Images to PDF Online',
        description: 'Convert multiple images to PDF with customizable settings. Supports batch processing up to 20 files.',
    },
};

export default function ImageToPDFLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
