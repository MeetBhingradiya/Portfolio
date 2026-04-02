import type { ComponentType } from "react";
import {
    Layers,
    Scissors,
    Zap,
    Lock,
    Unlock,
    RotateCw,
    ArrowUpDown,
    Hash,
    Type,
    Tags,
    PenTool,
    Palette,
    FileImage,
    ImagePlus,
    FileText,
    Wrench
} from "@/app/tools/paperknife/_lib/muiLucide";

import MergeTool from "./components/tools/MergeTool";
import SplitTool from "./components/tools/SplitTool";
import ProtectTool from "./components/tools/ProtectTool";
import UnlockTool from "./components/tools/UnlockTool";
import CompressTool from "./components/tools/CompressTool";
import PdfToImageTool from "./components/tools/PdfToImageTool";
import RotateTool from "./components/tools/RotateTool";
import PdfToTextTool from "./components/tools/PdfToTextTool";
import RearrangeTool from "./components/tools/RearrangeTool";
import WatermarkTool from "./components/tools/WatermarkTool";
import PageNumberTool from "./components/tools/PageNumberTool";
import MetadataTool from "./components/tools/MetadataTool";
import ImageToPdfTool from "./components/tools/ImageToPdfTool";
import SignatureTool from "./components/tools/SignatureTool";
import RepairTool from "./components/tools/RepairTool";
import ExtractImagesTool from "./components/tools/ExtractImagesTool";
import GrayscaleTool from "./components/tools/GrayscaleTool";

export type PaperKnifeCategory = "Edit" | "Secure" | "Convert" | "Optimize";

export interface PaperKnifeTool {
    slug: string;
    title: string;
    description: string;
    category: PaperKnifeCategory;
    icon: ComponentType<{ size?: number; className?: string }>;
    component: ComponentType;
}

export const PAPERKNIFE_TOOLS: PaperKnifeTool[] = [
    {
        slug: "merge",
        title: "Merge PDF",
        description: "Combine multiple PDF files into one document.",
        category: "Edit",
        icon: Layers,
        component: MergeTool
    },
    {
        slug: "split",
        title: "Split PDF",
        description: "Visually extract specific pages or ranges.",
        category: "Edit",
        icon: Scissors,
        component: SplitTool
    },
    {
        slug: "compress",
        title: "Compress PDF",
        description: "Optimize your file size for easier sharing.",
        category: "Optimize",
        icon: Zap,
        component: CompressTool
    },
    {
        slug: "protect",
        title: "Protect PDF",
        description: "Secure your documents with strong encryption.",
        category: "Secure",
        icon: Lock,
        component: ProtectTool
    },
    {
        slug: "unlock",
        title: "Unlock PDF",
        description: "Remove passwords from your protected files.",
        category: "Secure",
        icon: Unlock,
        component: UnlockTool
    },
    {
        slug: "rotate-pdf",
        title: "Rotate PDF",
        description: "Fix page orientation permanently.",
        category: "Edit",
        icon: RotateCw,
        component: RotateTool
    },
    {
        slug: "rearrange-pdf",
        title: "Rearrange PDF",
        description: "Drag and drop pages to reorder them.",
        category: "Edit",
        icon: ArrowUpDown,
        component: RearrangeTool
    },
    {
        slug: "page-numbers",
        title: "Page Numbers",
        description: "Add numbering to your documents automatically.",
        category: "Edit",
        icon: Hash,
        component: PageNumberTool
    },
    {
        slug: "watermark",
        title: "Watermark",
        description: "Overlay custom text for branding or security.",
        category: "Edit",
        icon: Type,
        component: WatermarkTool
    },
    {
        slug: "metadata",
        title: "Metadata",
        description: "Edit document properties for better privacy.",
        category: "Secure",
        icon: Tags,
        component: MetadataTool
    },
    {
        slug: "signature",
        title: "Signature",
        description: "Add your electronic signature to any document.",
        category: "Edit",
        icon: PenTool,
        component: SignatureTool
    },
    {
        slug: "grayscale",
        title: "Grayscale",
        description: "Convert all document pages to black and white.",
        category: "Optimize",
        icon: Palette,
        component: GrayscaleTool
    },
    {
        slug: "pdf-to-image",
        title: "PDF to Image",
        description: "Convert document pages into high-quality images.",
        category: "Convert",
        icon: FileImage,
        component: PdfToImageTool
    },
    {
        slug: "image-to-pdf",
        title: "Image to PDF",
        description: "Convert JPG, PNG, and WebP into a professional PDF.",
        category: "Convert",
        icon: ImagePlus,
        component: ImageToPdfTool
    },
    {
        slug: "extract-images",
        title: "Extract Images",
        description: "Pull out all original images embedded in a PDF.",
        category: "Convert",
        icon: FileImage,
        component: ExtractImagesTool
    },
    {
        slug: "pdf-to-text",
        title: "PDF to Text",
        description: "Extract plain text from your PDF documents.",
        category: "Convert",
        icon: FileText,
        component: PdfToTextTool
    },
    {
        slug: "repair",
        title: "Repair PDF",
        description: "Attempt to fix corrupted or unreadable documents.",
        category: "Optimize",
        icon: Wrench,
        component: RepairTool
    }
];

export const PAPERKNIFE_TOOL_MAP = new Map(PAPERKNIFE_TOOLS.map((tool) => [tool.slug, tool]));

export const PAPERKNIFE_CATEGORIES: PaperKnifeCategory[] = ["Edit", "Secure", "Convert", "Optimize"];
