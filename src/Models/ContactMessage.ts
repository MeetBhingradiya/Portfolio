/**
 * ContactMessage Model
 * Stores all contact form submissions with metadata, status tracking, and notes.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export type ContactMessageStatus = "new" | "read" | "replied" | "archived" | "spam";

export interface IContactMessage extends Document {
    name: string;
    email: string;
    subject: string;
    message: string;
    phone?: string;
    services?: string[];
    ip: string;
    userAgent?: string;
    status: ContactMessageStatus;
    adminNotes?: string;
    repliedAt?: Date;
    repliedBy?: string;
    isRead: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxlength: [100, "Name cannot exceed 100 characters"]
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true,
            maxlength: [200, "Email cannot exceed 200 characters"]
        },
        subject: {
            type: String,
            required: [true, "Subject is required"],
            trim: true,
            maxlength: [300, "Subject cannot exceed 300 characters"]
        },
        message: {
            type: String,
            required: [true, "Message is required"],
            trim: true,
            maxlength: [5000, "Message cannot exceed 5000 characters"]
        },
        phone: {
            type: String,
            trim: true,
            maxlength: [30, "Phone number cannot exceed 30 characters"]
        },
        services: [
            {
                type: String,
                trim: true
            }
        ],
        ip: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        userAgent: {
            type: String,
            trim: true
        },
        status: {
            type: String,
            enum: ["new", "read", "replied", "archived", "spam"],
            default: "new",
            index: true
        },
        adminNotes: {
            type: String,
            trim: true
        },
        repliedAt: {
            type: Date
        },
        repliedBy: {
            type: String,
            trim: true
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true
        }
    },
    {
        timestamps: true
    }
);

ContactMessageSchema.index({ email: 1, createdAt: -1 });
ContactMessageSchema.index({ createdAt: -1 });
ContactMessageSchema.index({ status: 1, createdAt: -1 });

export const ContactMessage: Model<IContactMessage> =
    mongoose.models.ContactMessage || mongoose.model<IContactMessage>("ContactMessage", ContactMessageSchema);

export default ContactMessage;
