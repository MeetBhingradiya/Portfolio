/**
 * SupportTicket Model
 * Full support ticket system with messages/threading, priority, status,
 * and employee assignment.
 */

import mongoose, { Schema, Document } from "mongoose";

export type TicketStatus =
    | "open"
    | "in_progress"
    | "waiting_customer"
    | "resolved"
    | "closed";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type TicketCategory =
    | "general"
    | "billing"
    | "technical"
    | "order"
    | "refund"
    | "account"
    | "other";

export interface ITicketMessage {
    messageId: string;
    senderId: string;      // userId
    senderEmail: string;
    senderName: string;
    senderRole: string;    // "customer" | "employee" | "admin"
    content: string;       // Markdown supported
    attachments: string[]; // CDN URLs
    isInternal: boolean;   // Internal note, hidden from customer
    createdAt: Date;
}

export interface ISupportTicket extends Document {
    ticketId: string;      // e.g. TKT-00001
    ticketNumber: number;  // auto-incrementing
    userId: string;
    userEmail: string;
    userName: string;

    subject: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;

    // If linked to an order
    orderId?: string;

    // Assignment
    assignedTo?: string;   // employee userId
    assignedEmail?: string;

    messages: ITicketMessage[];

    // Metadata
    tags: string[];
    lastRepliedAt: Date;
    resolvedAt?: Date;
    closedAt?: Date;

    // Rating
    satisfactionRating?: 1 | 2 | 3 | 4 | 5;
    satisfactionComment?: string;

    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const TicketMessageSchema = new Schema<ITicketMessage>(
    {
        messageId: { type: String, required: true, default: () => require("uuid").v4() },
        senderId: { type: String, required: true },
        senderEmail: { type: String, required: true },
        senderName: { type: String, required: true },
        senderRole: { type: String, required: true, enum: ["customer", "employee", "admin"] },
        content: { type: String, required: true },
        attachments: { type: [String], default: [] },
        isInternal: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const SupportTicketSchema = new Schema<ISupportTicket>(
    {
        ticketId: { type: String, required: true, unique: true },
        ticketNumber: { type: Number, required: true, unique: true },
        userId: { type: String, required: true, index: true },
        userEmail: { type: String, required: true, index: true },
        userName: { type: String, required: true },

        subject: { type: String, required: true, trim: true },
        category: {
            type: String,
            required: true,
            enum: ["general", "billing", "technical", "order", "refund", "account", "other"],
            default: "general",
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium",
        },
        status: {
            type: String,
            enum: ["open", "in_progress", "waiting_customer", "resolved", "closed"],
            default: "open",
        },

        orderId: { type: String },

        assignedTo: { type: String },
        assignedEmail: { type: String },

        messages: { type: [TicketMessageSchema], default: [] },

        tags: { type: [String], default: [] },
        lastRepliedAt: { type: Date, default: Date.now },
        resolvedAt: { type: Date },
        closedAt: { type: Date },

        satisfactionRating: { type: Number, min: 1, max: 5 },
        satisfactionComment: { type: String, trim: true },

        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

SupportTicketSchema.index({ status: 1, priority: -1, lastRepliedAt: -1 });
SupportTicketSchema.index({ assignedTo: 1, status: 1 });

export const SupportTicket =
    mongoose.models.SupportTicket ||
    mongoose.model<ISupportTicket>("SupportTicket", SupportTicketSchema);

/**
 * Counter model for auto-incrementing ticket numbers
 * Note: _id is a string (not ObjectId), so we do NOT extend Document to avoid
 * the incompatible _id type error (Mongoose 7+ infers the doc type automatically).
 */
export interface ITicketCounter {
    _id: string;
    seq: number;
}

const TicketCounterSchema = new Schema<ITicketCounter>({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
});

export const TicketCounter =
    mongoose.models.TicketCounter ||
    mongoose.model<ITicketCounter>("TicketCounter", TicketCounterSchema);
