/**
 * Payment Model
 *
 * Unified record covering both Razorpay and Stripe transactions.
 * Stores enough data for reconciliation, refunds, and subscription tracking.
 */
import mongoose, { Schema, Document } from "mongoose";

export type PaymentProvider = "razorpay" | "stripe";
export type PaymentType = "one_time" | "subscription";
export type PaymentPurpose = "cdn_plan" | "shop_order" | "other";
type PaymentStatus = "pending" | "completed" | "failed" | "refunded" | "cancelled";

export interface IPayment extends Document {
    userId: string;
    userEmail: string;

    provider: PaymentProvider;
    type: PaymentType;
    purpose: PaymentPurpose;
    referenceId?: string; // CDN application ID, shop order ID, etc.

    amount: number; // in smallest currency unit (paise / cents)
    currency: string; // "INR" | "USD" | etc.

    // ── Razorpay ──────────────────────────────────────────────────────────
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySubscriptionId?: string;
    razorpaySignature?: string;

    // ── Stripe ────────────────────────────────────────────────────────────
    stripeSessionId?: string;
    stripePaymentIntentId?: string;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    stripeInvoiceId?: string;

    status: PaymentStatus;
    failureReason?: string;
    metadata?: Record<string, any>;

    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
    {
        userId: { type: String, required: true, index: true, trim: true },
        userEmail: {
            type: String,
            required: true,
            index: true,
            trim: true,
            lowercase: true
        },

        provider: {
            type: String,
            enum: ["razorpay", "stripe"],
            required: true
        },
        type: {
            type: String,
            enum: ["one_time", "subscription"],
            required: true
        },
        purpose: {
            type: String,
            enum: ["cdn_plan", "shop_order", "other"],
            required: true
        },
        referenceId: { type: String, trim: true },

        amount: { type: Number, required: true },
        currency: { type: String, required: true, default: "INR", trim: true },

        // Razorpay
        razorpayOrderId: { type: String, sparse: true, trim: true },
        razorpayPaymentId: { type: String, sparse: true, trim: true },
        razorpaySubscriptionId: { type: String, sparse: true, trim: true },
        razorpaySignature: { type: String, trim: true },

        // Stripe
        stripeSessionId: { type: String, sparse: true, trim: true },
        stripePaymentIntentId: { type: String, sparse: true, trim: true },
        stripeSubscriptionId: { type: String, sparse: true, trim: true },
        stripeCustomerId: { type: String, sparse: true, trim: true },
        stripeInvoiceId: { type: String, sparse: true, trim: true },

        status: {
            type: String,
            enum: ["pending", "completed", "failed", "refunded", "cancelled"],
            default: "pending",
            index: true
        },
        failureReason: { type: String, trim: true },
        metadata: { type: Schema.Types.Mixed }
    },
    { timestamps: true }
);

// Compound indexes for common queries
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ provider: 1, status: 1 });

export const Payment = (mongoose.models.Payment as mongoose.Model<IPayment>) || mongoose.model<IPayment>("Payment", PaymentSchema);
