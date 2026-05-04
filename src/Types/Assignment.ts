/**
 * Assignment Document System Types
 * Comprehensive type definitions for assignment documents, blocks, and related entities
 */

export enum AssignmentPrivacy {
    Public = "public",
    Unlisted = "unlisted",
    Private = "private"
}

export enum BlockType {
    CodeSnippet = "codeSnippet",
    CodeBlock = "codeBlock",
    StepsBlock = "stepsBlock",
    Table = "table",
    TextBlock = "textBlock",
    Image = "image"
}

export enum CodeBlockLanguage {
    JavaScript = "javascript",
    TypeScript = "typescript",
    Python = "python",
    Java = "java",
    CSharp = "csharp",
    Cpp = "cpp",
    C = "c",
    SQL = "sql",
    HTML = "html",
    CSS = "css",
    Bash = "bash",
    Shell = "shell",
    JSON = "json",
    XML = "xml",
    YAML = "yaml",
    Markdown = "markdown",
    PlainText = "plaintext"
}

export interface CodeSnippetBlock {
    type: BlockType.CodeSnippet;
    code: string;
    language: CodeBlockLanguage;
    description?: string;
    fileName?: string;
}

export interface CodeBlockStep {
    lineNumber: number;
    description: string;
    code: string;
    language: CodeBlockLanguage;
    outputImage?: string; // CDN asset ID
    terminalOutput?: string;
}

export interface CodeBlock {
    type: BlockType.CodeBlock;
    title: string;
    description?: string;
    steps: CodeBlockStep[];
}

export interface StepsBlockStep {
    stepNumber: number;
    title: string;
    description: string;
    isBullet?: boolean;
    imageUrl?: string; // CDN asset ID
    code?: string;
    language?: CodeBlockLanguage;
}

export interface StepsBlock {
    type: BlockType.StepsBlock;
    title: string;
    description?: string;
    steps: StepsBlockStep[];
}

export interface TableColumn {
    header: string;
    key: string;
    type?: "text" | "number" | "boolean" | "date";
}

export interface TableBlock {
    type: BlockType.Table;
    title: string;
    description?: string;
    columns: TableColumn[];
    rows: Record<string, any>[];
}

export interface TextBlock {
    type: BlockType.TextBlock;
    title: string;
    content: string; // Markdown supported
    format?: "markdown" | "html" | "plain";
}

export interface ImageBlock {
    type: BlockType.Image;
    title?: string;
    description?: string;
    imageUrl: string; // CDN asset ID
    caption?: string;
}

export type ContentBlock = CodeSnippetBlock | CodeBlock | StepsBlock | TableBlock | TextBlock | ImageBlock;

export interface AssignmentMetadata {
    assignmentNo: string;
    assignmentTitle: string;
    studentName: string;
    studentEnrollmentNo: string;
    subject?: string;
    subjectCode?: string;
    description?: string;
    createdAt: Date;
    editedAt?: Date;
    watermarkEnabled?: boolean;
    signatureHash?: string; // Auto-generated from metadata
}

export interface AssignmentDocument extends AssignmentMetadata {
    _id?: string;
    ownerId: string;
    ownerEmail: string;
    ownerName: string;
    privacy: AssignmentPrivacy;
    blocks: ContentBlock[];
    tags?: string[];
    
    // Statistics
    views: number;
    downloads: number;
    shares: number;
    
    // Sharing & Access Control
    sharedWith?: {
        userId: string;
        email: string;
        name: string;
        permissions: AssignmentPermission[];
        sharedAt: Date;
    }[];
    
    // Soft delete support
    isDeleted?: boolean;
    deletedAt?: Date;
    deletedBy?: string;
    
    // Admin restrictions
    adminRestricted?: boolean;
    restrictionNote?: string;
    
    // Version tracking
    version: number;
    lastEditedBy?: string;
    
    // Timestamps
    createdAt?: Date;
    updatedAt?: Date;
}

export type AssignmentPermission =
    | "Tools.AssignmentSystem.View"
    | "Tools.AssignmentSystem.Edit"
    | "Tools.AssignmentSystem.Delete"
    | "Tools.AssignmentSystem.Share"
    | "Tools.AssignmentSystem.Download";

export interface AssignmentShareLink {
    _id?: string;
    assignmentId: string;
    createdBy: string;
    token: string;
    expiresAt?: Date;
    isPublic: boolean;
    allowDownload: boolean;
    accessCount: number;
    createdAt?: Date;
}
