/**
 * Tools Dashboard — Static Data
 * Defines all available tools, their metadata, access control flags,
 * and admin-managed defaults.
 */

export type ToolCategory =
    | "generators"
    | "converters"
    | "dev-tools"
    | "media"
    | "security"
    | "editor";

export type ToolBadge =
    | "admin-managed"    // Default settings come from admin panel
    | "db-sync"          // User preferences synced to DB
    | "studio"           // Has a Studio / advanced mode
    | "featured"         // Admin-featured tool
    | "new"              // Recently added
    | "beta";            // Beta feature

export interface ToolDefinition {
    /** Unique slug — matches the route under /Tools/<slug> */
    id: string;
    name: string;
    description: string;
    longDescription: string;
    category: ToolCategory;
    /** MUI icon name string (resolved at render time) */
    iconName: string;
    /** Accent colour override (optional; falls back to theme accent) */
    accentColor?: string;
    /** Route relative to /Tools */
    route: string;
    badges: ToolBadge[];
    /** Whether the tool is visible to regular users (admin can override) */
    isPublic: boolean;
    /** Admin can disable this tool globally */
    adminManaged: boolean;
    /** Sub-tools / modes */
    modes?: Array<{ label: string; route: string }>;
    /** Quick keyboard shortcut hint */
    shortcut?: string;
    /** Whether user preferences for this tool sync to DB */
    syncToDb: boolean;
}

export const TOOL_CATEGORIES: Record<ToolCategory, { label: string; description: string }> = {
    generators: {
        label: "Generators",
        description: "Create codes, identifiers and secure credentials"
    },
    converters: {
        label: "Converters",
        description: "Transform data between formats accurately"
    },
    "dev-tools": {
        label: "Dev Tools",
        description: "Debug, inspect and explore developer utilities"
    },
    media: {
        label: "Media & Documents",
        description: "Work with images and PDF files"
    },
    security: {
        label: "Security",
        description: "Encrypt, decrypt and hash your data"
    },
    editor: {
        label: "Editors & Pickers",
        description: "Rich editors, colour pickers and preview utilities"
    }
};

export const TOOLS: ToolDefinition[] = [
    // ── Generators ──────────────────────────────────────────────────────────
    {
        id: "qr",
        name: "QR Generator",
        description: "Generate and customise QR codes for any URL or text",
        longDescription:
            "Create QR codes with custom colours, sizes, error-correction levels and embedded logos. Supports vCard, WiFi, geo-location and plain text templates.",
        category: "generators",
        iconName: "QrCode2",
        accentColor: "#34C759",
        route: "/tools/qr",
        badges: ["db-sync", "admin-managed"],
        isPublic: true,
        adminManaged: true,
        syncToDb: true,
        shortcut: "Q"
    },
    {
        id: "uuid",
        name: "UUID Generator",
        description: "Instantly generate v1, v4, v5 and ULID identifiers",
        longDescription:
            "Bulk-generate UUIDs in multiple formats (hyphenated, compact, braced). Supports UUID v1, v4, v5 with custom namespaces and ULID output.",
        category: "generators",
        iconName: "Fingerprint",
        accentColor: "#5E97F6",
        route: "/tools/uuid",
        badges: ["db-sync"],
        isPublic: true,
        adminManaged: false,
        syncToDb: true,
        shortcut: "U"
    },
    {
        id: "password",
        name: "Password Generator",
        description: "Secure, configurable passwords with strength analysis",
        longDescription:
            "Generate cryptographically strong passwords with granular character-set controls, strength meter, entropy display and one-click copy.",
        category: "generators",
        iconName: "Password",
        accentColor: "#FF3B30",
        route: "/tools/password",
        badges: ["admin-managed", "db-sync"],
        isPublic: true,
        adminManaged: true,
        syncToDb: true,
        shortcut: "P"
    },
    // ── Converters ──────────────────────────────────────────────────────────
    {
        id: "json",
        name: "JSON ↔ JS Object",
        description: "Format, validate and convert between JSON and JS Object notation",
        longDescription:
            "Bidirectional conversion between JSON and JavaScript Object literal syntax. Handles unquoted keys, trailing commas, comments and complex nested structures accurately.",
        category: "converters",
        iconName: "DataObject",
        accentColor: "#FF9500",
        route: "/tools/json",
        badges: ["db-sync"],
        isPublic: true,
        adminManaged: false,
        syncToDb: false,
        shortcut: "J"
    },
    // ── Dev Tools ────────────────────────────────────────────────────────────
    {
        id: "jwt",
        name: "JWT Debugger",
        description: "Decode, verify and craft JSON Web Tokens",
        longDescription:
            "Inspect JWT headers and payloads, verify signatures with HMAC / RSA / ECDSA keys and build custom tokens. Studio mode for advanced claim editing.",
        category: "dev-tools",
        iconName: "Key",
        accentColor: "#AF52DE",
        route: "/tools/jwt",
        badges: ["studio", "admin-managed", "db-sync"],
        isPublic: true,
        adminManaged: true,
        modes: [
            { label: "Debug", route: "/tools/jwt?mode=debug" },
            { label: "Studio", route: "/tools/jwt?mode=studio" }
        ],
        syncToDb: true,
        shortcut: "K"
    },
    {
        id: "regexp",
        name: "RegExp Tester",
        description: "Test, explore and share regular expressions live",
        longDescription:
            "Real-time regex matching with capture-group highlighting, named groups, flag toggles and an admin-curated Featured expressions library. Studio mode for building complex patterns.",
        category: "dev-tools",
        iconName: "Code",
        accentColor: "#FF2D55",
        route: "/tools/regexp",
        badges: ["featured", "studio", "admin-managed", "db-sync"],
        isPublic: true,
        adminManaged: true,
        modes: [
            { label: "Explore", route: "/tools/regexp?mode=explore" },
            { label: "Studio", route: "/tools/regexp?mode=studio" }
        ],
        syncToDb: true,
        shortcut: "R"
    },
    // ── Media & Documents ────────────────────────────────────────────────────
    {
        id: "image",
        name: "Image Tools",
        description: "Compress images or convert them to PDF",
        longDescription:
            "Client-side image compression with quality / resolution controls and batch processing. Also converts single or multiple images into a merged PDF document.",
        category: "media",
        iconName: "Image",
        accentColor: "#5AC8FA",
        route: "/tools/image",
        badges: ["admin-managed"],
        isPublic: true,
        adminManaged: true,
        modes: [
            { label: "Compress", route: "/tools/image?mode=compress" },
            { label: "To PDF", route: "/tools/image?mode=topdf" }
        ],
        syncToDb: false,
        shortcut: "I"
    },
    {
        id: "pdf",
        name: "PDF Tools",
        description: "Merge multiple PDFs or split a single PDF",
        longDescription:
            "Reorder, merge and export multiple PDF files into one. Or extract specific pages / page ranges from a PDF without any server upload.",
        category: "media",
        iconName: "PictureAsPdf",
        accentColor: "#FF3B30",
        route: "/tools/pdf",
        badges: ["admin-managed"],
        isPublic: true,
        adminManaged: true,
        modes: [
            { label: "Merge", route: "/tools/pdf?mode=merge" },
            { label: "Split", route: "/tools/pdf?mode=split" }
        ],
        syncToDb: false,
        shortcut: "F"
    },
    // ── Security ──────────────────────────────────────────────────────────────
    {
        id: "encrypt",
        name: "Encrypt / Decrypt",
        description: "AES, RSA and more — symmetric and asymmetric crypto",
        longDescription:
            "Encrypt and decrypt text with AES-256-GCM, RSA-OAEP and ChaCha20. Includes key generation, IV management and Base64 / Hex output options.",
        category: "security",
        iconName: "Security",
        accentColor: "#FF9500",
        route: "/tools/encrypt",
        badges: ["admin-managed", "db-sync"],
        isPublic: true,
        adminManaged: true,
        syncToDb: true,
        shortcut: "E"
    },
    {
        id: "hash",
        name: "Hash",
        description: "Generate MD5, SHA-1, SHA-256 and more",
        longDescription:
            "Compute cryptographic hashes for text or file content using MD5, SHA-1, SHA-224, SHA-256, SHA-384, SHA-512 and BLAKE2.",
        category: "security",
        iconName: "Tag",
        accentColor: "#FFCC00",
        route: "/tools/hash",
        badges: ["db-sync"],
        isPublic: true,
        adminManaged: false,
        syncToDb: false,
        shortcut: "H"
    },
    // ── Editor & Pickers ────────────────────────────────────────────────────
    {
        id: "markdown",
        name: "Markdown Preview",
        description: "VSCode Monaco editor with live Markdown preview",
        longDescription:
            "Full Monaco editor integration for writing Markdown with instant rendered preview. Supports GFM, syntax highlighting, mermaid diagrams and export to HTML/PDF.",
        category: "editor",
        iconName: "DescriptionOutlined",
        accentColor: "#007AFF",
        route: "/tools/markdown",
        badges: ["db-sync", "featured"],
        isPublic: true,
        adminManaged: false,
        syncToDb: true,
        shortcut: "M"
    },
    {
        id: "colour",
        name: "Colour Studio",
        description: "Picker, converter, palette generator and theme preview",
        longDescription:
            "Interactive colour picker with HEX / RGB / HSL / HSV / OKLCH conversions, contrast checker, palette generator and live preview of Accent, Primary and Secondary theme colours.",
        category: "editor",
        iconName: "Palette",
        accentColor: "#FF2D55",
        route: "/tools/colour",
        badges: ["admin-managed", "db-sync", "featured"],
        isPublic: true,
        adminManaged: true,
        syncToDb: true,
        shortcut: "C",
        modes: [
            { label: "Picker", route: "/tools/colour?mode=picker" },
            { label: "Convert", route: "/tools/colour?mode=convert" },
            { label: "Palettes", route: "/tools/colour?mode=palettes" },
            { label: "Preview", route: "/tools/colour?mode=preview" }
        ]
    }
];

/** Returns tools grouped by category (preserving TOOL_CATEGORIES order) */
export function getToolsByCategory(): Record<ToolCategory, ToolDefinition[]> {
    const result = {} as Record<ToolCategory, ToolDefinition[]>;
    (Object.keys(TOOL_CATEGORIES) as ToolCategory[]).forEach((cat) => {
        result[cat] = TOOLS.filter((t) => t.category === cat);
    });
    return result;
}

/** Quick lookup by id */
export function getToolById(id: string): ToolDefinition | undefined {
    return TOOLS.find((t) => t.id === id);
}
