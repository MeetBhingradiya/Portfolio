/**
 * Assignment Share Link Model
 * Manages shareable links for assignments with expiration and access tracking
 */

import mongoose, { Schema, Document, Model } from "mongoose";
import { AssignmentShareLink } from "@/Types/Assignment";
import crypto from "crypto";

export interface IAssignmentShareLink extends Omit<AssignmentShareLink, "_id"> {
    _id?: string;
}

const AssignmentShareLinkSchema = new Schema<IAssignmentShareLink>(
    {
        assignmentId: {
            type: String,
            required: true,
            index: true
        },
        createdBy: {
            type: String,
            required: true,
            index: true
        },
        token: {
            type: String,
            required: true,
            unique: true,
            index: true,
            default: () => crypto.randomBytes(32).toString("hex")
        },
        expiresAt: {
            type: Date,
            sparse: true
        },
        isPublic: {
            type: Boolean,
            default: false
        },
        allowDownload: {
            type: Boolean,
            default: true
        },
        accessCount: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true,
        collection: "assignment_share_links"
    }
);

// Index for finding active share links
AssignmentShareLinkSchema.index({
    assignmentId: 1,
    expiresAt: 1
});

export default mongoose.models.AssignmentShareLink ||
    mongoose.model<IAssignmentShareLink>("AssignmentShareLink", AssignmentShareLinkSchema);
