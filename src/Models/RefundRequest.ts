/**
 * RefundRequest Model
 * Tracks refund requests linked to orders.
 */

import mongoose, { Schema, Document } from "mongoose";

export type RefundStatus = "pending" | "under_review" | "approved" | "rejected" | "processed";
export type RefundReason =
    | "not_as_described"
    | "defective"
    | "not_received"
    | "changed_mind"
    | "duplicate_purchase"
    | "compatibility_issue"
    | "other";

export interface IRefundRequest extends Document {
    refundId: string;
    orderId: string;
    orderNumber: number;
    userId: string;
    userEmail: string;
    userName: string;

    reason: RefundReason;
    description: string;
    attachments: string[]; // CDN URLs for evidence

    // Items to refund (partial or full)
    refundItems: {
        variantId: string;
        productName: string;
        quantity: number;
        refundAmount: number; // in cents
    }[];
    totalRefundAmount: number; // in cents
    currency: string;

    status: RefundStatus;
    reviewedBy?: string; // employee/admin email
    reviewNote?: string;
    processedAt?: Date;

    // Linked support ticket
    ticketId?: string;

    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const RefundItemSchema = new Schema(
    {
        variantId: { type: String, required: true },
        productName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        refundAmount: { type: Number, required: true, min: 0 }
    },
    { _id: false }
);

const RefundRequestSchema = new Schema<IRefundRequest>(
    {
        refundId: {
            type: String,
            required: true,
            unique: true,
            default: () => require("uuid").v4()
        },
        orderId: { type: String, required: true, index: true },
        orderNumber: { type: Number, required: true },
        userId: { type: String, required: true, index: true },
        userEmail: { type: String, required: true },
        userName: { type: String, required: true },

        reason: {
            type: String,
            enum: ["not_as_described", "defective", "not_received", "changed_mind", "duplicate_purchase", "compatibility_issue", "other"],
            required: true
        },
        description: { type: String, required: true, trim: true },
        attachments: { type: [String], default: [] },

        refundItems: { type: [RefundItemSchema], required: true },
        totalRefundAmount: { type: Number, required: true, min: 0 },
        currency: { type: String, required: true, default: "USD" },

        status: {
            type: String,
            enum: ["pending", "under_review", "approved", "rejected", "processed"],
            default: "pending"
        },
        reviewedBy: { type: String },
        reviewNote: { type: String, trim: true },
        processedAt: { type: Date },

        ticketId: { type: String },
        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true }
);

RefundRequestSchema.index({ status: 1, createdAt: -1 });

export const RefundRequest = mongoose.models.RefundRequest || mongoose.model<IRefundRequest>("RefundRequest", RefundRequestSchema);
