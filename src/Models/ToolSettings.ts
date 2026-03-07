/**
 * ToolSettings Mongoose Model
 * Stores admin-configured default settings for every developer tool.
 * Only a single document exists (singleton pattern, keyed by ConfigID).
 */

import mongoose from "mongoose";

// ── Per-tool default schemas ────────────────────────────────────────────

const QRDefaults = new mongoose.Schema(
    {
        size: { type: Number, default: 300, min: 100, max: 2048 },
        errorCorrection: { type: String, default: "M", enum: ["L", "M", "Q", "H"] },
        dotStyle: { type: String, default: "rounded", enum: ["rounded", "dots", "classy", "classy-rounded", "square", "extra-rounded"] },
        cornerStyle: { type: String, default: "square", enum: ["square", "dot", "extra-rounded"] },
        foreground: { type: String, default: "#000000" },
        background: { type: String, default: "#FFFFFF" }
    },
    { _id: false }
);

const UUIDDefaults = new mongoose.Schema(
    {
        version: { type: String, default: "v4", enum: ["v1", "v4", "v5", "nil"] },
        uppercase: { type: Boolean, default: false },
        noDashes: { type: Boolean, default: false },
        braces: { type: Boolean, default: false },
        bulkCount: { type: Number, default: 5, min: 1, max: 100 }
    },
    { _id: false }
);

const PasswordDefaults = new mongoose.Schema(
    {
        mode: { type: String, default: "random", enum: ["random", "passphrase", "pin"] },
        length: { type: Number, default: 16, min: 4, max: 128 },
        uppercase: { type: Boolean, default: true },
        lowercase: { type: Boolean, default: true },
        digits: { type: Boolean, default: true },
        symbols: { type: Boolean, default: true },
        excludeAmbiguous: { type: Boolean, default: false },
        wordCount: { type: Number, default: 4, min: 3, max: 12 },
        separator: { type: String, default: "-" },
        pinLength: { type: Number, default: 6, min: 4, max: 12 }
    },
    { _id: false }
);

const JSONDefaults = new mongoose.Schema(
    {
        direction: { type: String, default: "json-to-js", enum: ["json-to-js", "js-to-json"] },
        autoFormat: { type: Boolean, default: true }
    },
    { _id: false }
);

const JWTDefaults = new mongoose.Schema(
    {
        defaultTab: { type: String, default: "decode", enum: ["decode", "build", "reference"] },
        defaultAlgorithm: { type: String, default: "HS256" }
    },
    { _id: false }
);

const RegExpDefaults = new mongoose.Schema(
    {
        defaultFlags: { type: String, default: "g" },
        showPresets: { type: Boolean, default: false },
        defaultTab: { type: String, default: "match", enum: ["match", "replace"] }
    },
    { _id: false }
);

const ImageDefaults = new mongoose.Schema(
    {
        mode: { type: String, default: "compress", enum: ["compress", "to-pdf"] },
        quality: { type: Number, default: 0.7, min: 0.1, max: 1 },
        maxWidth: { type: Number, default: 1920, min: 320, max: 3840 },
        outputFormat: { type: String, default: "jpeg", enum: ["jpeg", "png", "webp"] },
        pdfOrientation: { type: String, default: "portrait", enum: ["portrait", "landscape"] }
    },
    { _id: false }
);

const PDFDefaults = new mongoose.Schema(
    {
        mode: { type: String, default: "merge", enum: ["merge", "split"] }
    },
    { _id: false }
);

const EncryptDefaults = new mongoose.Schema(
    {
        algorithm: { type: String, default: "AES", enum: ["AES", "DES", "TripleDES", "Rabbit", "RC4"] },
        direction: { type: String, default: "encrypt", enum: ["encrypt", "decrypt"] }
    },
    { _id: false }
);

const MarkdownDefaults = new mongoose.Schema(
    {
        viewMode: { type: String, default: "split", enum: ["split", "editor", "preview"] }
    },
    { _id: false }
);

const ColourDefaults = new mongoose.Schema(
    {
        defaultTab: { type: String, default: "picker", enum: ["picker", "palette", "contrast"] },
        harmony: { type: String, default: "analogous", enum: ["complementary", "analogous", "triadic", "split-comp", "tetradic"] },
        defaultHue: { type: Number, default: 210, min: 0, max: 360 },
        defaultSaturation: { type: Number, default: 80, min: 0, max: 100 },
        defaultLightness: { type: Number, default: 55, min: 0, max: 100 }
    },
    { _id: false }
);

const TodoDefaults = new mongoose.Schema(
    {
        defaultFilter: { type: String, default: "all", enum: ["all", "active", "completed"] }
    },
    { _id: false }
);

const InstagramDefaults = new mongoose.Schema(
    {
        defaultTab: {
            type: String,
            default: "not-following-back",
            enum: ["not-following-back", "close-friends", "pending-requests", "request-history", "recently-unfollowed", "blocked"]
        },
        showDates:          { type: Boolean, default: true },
        useRegExpByDefault: { type: Boolean, default: false },
        maxListHeight:      { type: String, default: "normal", enum: ["compact", "normal", "tall"] }
    },
    { _id: false }
);

// ── Global tool visibility ──────────────────────────────────────────────

const ToolVisibility = new mongoose.Schema(
    {
        toolId: { type: String, required: true },
        enabled: { type: Boolean, default: true },
        featured: { type: Boolean, default: false },
        publicAccess: { type: Boolean, default: true }
    },
    { _id: false }
);

// ── Main schema ─────────────────────────────────────────────────────────

const ToolSettings_Schema = new mongoose.Schema(
    {
        ConfigID: {
            type: String,
            default: "tool_settings_singleton",
            unique: true,
            index: true
        },

        // Per-tool defaults
        qr: { type: QRDefaults, default: () => ({}) },
        uuid: { type: UUIDDefaults, default: () => ({}) },
        password: { type: PasswordDefaults, default: () => ({}) },
        json: { type: JSONDefaults, default: () => ({}) },
        jwt: { type: JWTDefaults, default: () => ({}) },
        regexp: { type: RegExpDefaults, default: () => ({}) },
        image: { type: ImageDefaults, default: () => ({}) },
        pdf: { type: PDFDefaults, default: () => ({}) },
        encrypt: { type: EncryptDefaults, default: () => ({}) },
        markdown: { type: MarkdownDefaults, default: () => ({}) },
        colour: { type: ColourDefaults, default: () => ({}) },
        todo:   { type: TodoDefaults,   default: () => ({}) },
        instagram: { type: InstagramDefaults, default: () => ({}) },

        // Global controls
        visibility: { type: [ToolVisibility], default: [] },

        // Metadata
        lastUpdatedBy: { type: String, default: "" }
    },
    {
        timestamps: true,
        versionKey: "v1"
    }
);

export interface IToolSettings extends mongoose.Document {
    ConfigID: string;
    qr: {
        size: number;
        errorCorrection: string;
        dotStyle: string;
        cornerStyle: string;
        foreground: string;
        background: string;
    };
    uuid: {
        version: string;
        uppercase: boolean;
        noDashes: boolean;
        braces: boolean;
        bulkCount: number;
    };
    password: {
        mode: string;
        length: number;
        uppercase: boolean;
        lowercase: boolean;
        digits: boolean;
        symbols: boolean;
        excludeAmbiguous: boolean;
        wordCount: number;
        separator: string;
        pinLength: number;
    };
    json: {
        direction: string;
        autoFormat: boolean;
    };
    jwt: {
        defaultTab: string;
        defaultAlgorithm: string;
    };
    regexp: {
        defaultFlags: string;
        showPresets: boolean;
        defaultTab: string;
    };
    image: {
        mode: string;
        quality: number;
        maxWidth: number;
        outputFormat: string;
        pdfOrientation: string;
    };
    pdf: {
        mode: string;
    };
    encrypt: {
        algorithm: string;
        direction: string;
    };
    markdown: {
        viewMode: string;
    };
    colour: {
        defaultTab: string;
        harmony: string;
        defaultHue: number;
        defaultSaturation: number;
        defaultLightness: number;
    };
    todo: {
        defaultFilter: string;
    };
    instagram: {
        defaultTab: string;
        showDates: boolean;
        useRegExpByDefault: boolean;
        maxListHeight: string;
    };
    visibility: Array<{
        toolId: string;
        enabled: boolean;
        featured: boolean;
        publicAccess: boolean;
    }>;
    lastUpdatedBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export const ToolSettings_Model: mongoose.Model<IToolSettings> =
    mongoose.models?.ToolSettings ||
    mongoose.model<IToolSettings>("ToolSettings", ToolSettings_Schema);
