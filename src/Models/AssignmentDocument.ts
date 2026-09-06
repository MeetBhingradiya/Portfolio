/**
 * Assignment Document Mongoose Model
 * Stores comprehensive assignment documents with support for rich content blocks
 */

import mongoose, { Schema, Document, Model } from "mongoose";
import { AssignmentDocument, AssignmentPrivacy, BlockType, CodeBlockLanguage } from "@/Types/Assignment";
import crypto from "crypto";

export interface IAssignmentDocument extends Omit<AssignmentDocument, "_id"> {
    _id?: string;
}

// Block schemas for discriminated union support
const CodeSnippetBlockSchema = new Schema({
    type: { type: String, enum: [BlockType.CodeSnippet], required: true },
    code: { type: String, required: true },
    language: { type: String, enum: Object.values(CodeBlockLanguage), default: CodeBlockLanguage.PlainText },
    description: String,
    fileName: String
}, { _id: false });

const CodeBlockStepSchema = new Schema({
    lineNumber: { type: Number, required: true },
    description: { type: String, required: true },
    code: { type: String, required: true },
    language: { type: String, enum: Object.values(CodeBlockLanguage), required: true },
    outputImage: String,
    terminalOutput: String
}, { _id: false });

const CodeBlockSchema = new Schema({
    type: { type: String, enum: [BlockType.CodeBlock], required: true },
    title: { type: String, required: true },
    description: String,
    steps: [CodeBlockStepSchema]
}, { _id: false });

const StepsBlockStepSchema = new Schema({
    stepNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    isBullet: { type: Boolean, default: false },
    imageUrl: String,
    code: String,
    language: { type: String, enum: Object.values(CodeBlockLanguage) }
}, { _id: false });

const StepsBlockSchema = new Schema({
    type: { type: String, enum: [BlockType.StepsBlock], required: true },
    title: { type: String, required: true },
    description: String,
    steps: [StepsBlockStepSchema]
}, { _id: false });

const TableColumnSchema = new Schema({
    header: { type: String, required: true },
    key: { type: String, required: true },
    type: { type: String, enum: ["text", "number", "boolean", "date"], default: "text" }
}, { _id: false });

const TableBlockSchema = new Schema({
    type: { type: String, enum: [BlockType.Table], required: true },
    title: { type: String, required: true },
    description: String,
    columns: [TableColumnSchema],
    rows: [Schema.Types.Mixed]
}, { _id: false });

const TextBlockSchema = new Schema({
    type: { type: String, enum: [BlockType.TextBlock], required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    format: { type: String, enum: ["markdown", "html", "plain"], default: "markdown" }
}, { _id: false });

const ImageBlockSchema = new Schema({
    type: { type: String, enum: [BlockType.Image], required: true },
    title: String,
    description: String,
    imageUrl: { type: String, required: true },
    caption: String
}, { _id: false });

const SharedAccessSchema = new Schema({
    userId: { type: String, required: true },
    email: { type: String, required: true },
    name: String,
    permissions: [{ type: String, enum: ["Tools.AssignmentSystem.View", "Tools.AssignmentSystem.Edit", "Tools.AssignmentSystem.Delete", "Tools.AssignmentSystem.Share", "Tools.AssignmentSystem.Download"] }],
    sharedAt: { type: Date, default: Date.now }
}, { _id: false });

const AssignmentDocumentSchema = new Schema<IAssignmentDocument>(
    {
        // Metadata
        assignmentNo: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        assignmentTitle: {
            type: String,
            required: true,
            trim: true
        },
        studentName: {
            type: String,
            required: true,
            trim: true
        },
        studentEnrollmentNo: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        subject: {
            type: String,
            trim: true
        },
        subjectCode: {
            type: String,
            trim: true
        },
        description: {
            type: String,
            maxlength: 2000
        },
        watermarkEnabled: {
            type: Boolean,
            default: false
        },
        signatureHash: {
            type: String,
            unique: true,
            sparse: true,
            index: true
        },

        // Ownership & Access
        ownerId: {
            type: String,
            required: true,
            index: true
        },
        ownerEmail: {
            type: String,
            required: true,
            lowercase: true
        },
        ownerName: String,

        // Privacy & Sharing
        privacy: {
            type: String,
            enum: Object.values(AssignmentPrivacy),
            default: AssignmentPrivacy.Private,
            index: true
        },
        sharedWith: [SharedAccessSchema],

        // Content
        blocks: [{
            type: Schema.Types.Mixed
        }],
        tags: [
            {
                type: String,
                lowercase: true,
                trim: true
            }
        ],

        // Statistics
        views: {
            type: Number,
            default: 0
        },
        downloads: {
            type: Number,
            default: 0
        },
        shares: {
            type: Number,
            default: 0
        },

        // Soft Delete
        isDeleted: {
            type: Boolean,
            default: false,
            index: true
        },
        deletedAt: Date,
        deletedBy: String,

        // Admin Controls
        adminRestricted: {
            type: Boolean,
            default: false,
            index: true
        },
        restrictionNote: String,

        // Versioning
        version: {
            type: Number,
            default: 1
        },
        lastEditedBy: String,

        // Timestamps
        editedAt: Date,
        createdAt: { type: Date, default: Date.now, index: true },
        updatedAt: { type: Date, default: Date.now }
    },
    {
        timestamps: true,
        collection: "assignment_documents"
    }
);

// Pre-save hook to generate signature hash
AssignmentDocumentSchema.pre("save", function (next: any) {
    if (!this.signatureHash) {
        const metadataString = JSON.stringify({
            assignmentNo: this.assignmentNo,
            assignmentTitle: this.assignmentTitle,
            studentName: this.studentName,
            studentEnrollmentNo: this.studentEnrollmentNo,
            createdAt: this.createdAt
        });
        this.signatureHash = crypto.createHash("sha256").update(metadataString).digest("hex");
    }
    this.updatedAt = new Date();
    next();
});

// Indexes for better query performance
AssignmentDocumentSchema.index({ ownerId: 1, privacy: 1 });
AssignmentDocumentSchema.index({ "sharedWith.userId": 1 });
AssignmentDocumentSchema.index({ studentEnrollmentNo: 1, ownerId: 1 });
AssignmentDocumentSchema.index({ createdAt: -1, ownerId: 1 });

export default mongoose.models.AssignmentDocument ||
    mongoose.model<IAssignmentDocument>("AssignmentDocument", AssignmentDocumentSchema);
