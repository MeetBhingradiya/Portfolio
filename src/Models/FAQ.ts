/**
 * FAQ Model
 * Frequently asked questions with categories, orderable, admin-managed.
 */

import mongoose, { Schema, Document } from "mongoose";

export interface IFAQ extends Document {
    faqId: string;
    question: string;
    answer: string;
    category: string;     // e.g. "General", "Billing", "Technical", "Orders"
    order: number;        // display sort order
    isPublished: boolean;
    helpful: number;      // upvotes
    notHelpful: number;   // downvotes
    tags: string[];
    createdBy: string;    // admin email
    createdAt: Date;
    updatedAt: Date;
}

const FAQSchema = new Schema<IFAQ>(
    {
        faqId: {
            type: String,
            required: true,
            unique: true,
            default: () => require("uuid").v4()
        },
        question: { type: String, required: true, trim: true },
        answer: { type: String, required: true, trim: true },
        category: { type: String, required: true, default: "General", trim: true },
        order: { type: Number, default: 0 },
        isPublished: { type: Boolean, default: true },
        helpful: { type: Number, default: 0 },
        notHelpful: { type: Number, default: 0 },
        tags: { type: [String], default: [] },
        createdBy: { type: String, required: true },
    },
    { timestamps: true }
);

FAQSchema.index({ category: 1, order: 1 });

export const FAQ =
    mongoose.models.FAQ || mongoose.model<IFAQ>("FAQ", FAQSchema);
