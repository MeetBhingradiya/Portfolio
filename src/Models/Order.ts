/**
 * Order Model
 * Tracks purchases — linked to ShopProduct variants.
 * Supports physical, digital, license, and subscription orders.
 */

import mongoose, { Schema, Document } from "mongoose";

export type OrderStatus =
    | "pending"
    | "payment_processing"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "completed"
    | "cancelled"
    | "refund_requested"
    | "refunded"
    | "failed";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partially_refunded";

export interface IOrderItem {
    productId: string;
    productName: string;
    variantId: string;
    variantName: string;
    productType: string;
    quantity: number;
    unitPrice: number;   // in cents at time of purchase
    totalPrice: number;
    currency: string;
    // For subscriptions
    billingCycle?: string;
    subscriptionEndsAt?: Date;
    // For digital/license
    licenseKey?: string;
    downloadUrl?: string;
}

export interface IShippingAddress {
    fullName: string;
    phone?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

export interface IOrder extends Document {
    orderId: string;         // e.g. ORD-20250001
    orderNumber: number;
    userId: string;
    userEmail: string;
    userName: string;

    items: IOrderItem[];
    subtotal: number;        // in cents
    discount: number;        // in cents
    tax: number;             // in cents
    shippingCost: number;    // in cents
    total: number;           // in cents
    currency: string;

    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod?: string;  // "card", "upi", "paypal", etc.
    paymentTransactionId?: string;

    // Shipping (for physical orders)
    shippingAddress?: IShippingAddress;
    trackingNumber?: string;
    trackingUrl?: string;
    shippedAt?: Date;
    deliveredAt?: Date;

    // Invoice
    invoiceUrl?: string;

    // Notes
    customerNote?: string;
    adminNote?: string;

    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
    {
        productId: { type: String, required: true },
        productName: { type: String, required: true },
        variantId: { type: String, required: true },
        variantName: { type: String, required: true },
        productType: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        totalPrice: { type: Number, required: true, min: 0 },
        currency: { type: String, required: true, default: "USD" },
        billingCycle: { type: String },
        subscriptionEndsAt: { type: Date },
        licenseKey: { type: String },
        downloadUrl: { type: String },
    },
    { _id: false }
);

const ShippingAddressSchema = new Schema<IShippingAddress>(
    {
        fullName: { type: String, required: true },
        phone: { type: String },
        addressLine1: { type: String, required: true },
        addressLine2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
    },
    { _id: false }
);

const OrderSchema = new Schema<IOrder>(
    {
        orderId: { type: String, required: true, unique: true },
        orderNumber: { type: Number, required: true, unique: true },
        userId: { type: String, required: true, index: true },
        userEmail: { type: String, required: true, index: true },
        userName: { type: String, required: true },

        items: { type: [OrderItemSchema], required: true },
        subtotal: { type: Number, required: true, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        tax: { type: Number, default: 0, min: 0 },
        shippingCost: { type: Number, default: 0, min: 0 },
        total: { type: Number, required: true, min: 0 },
        currency: { type: String, required: true, default: "USD" },

        status: {
            type: String,
            enum: ["pending", "payment_processing", "confirmed", "processing", "shipped",
                "delivered", "completed", "cancelled", "refund_requested", "refunded", "failed"],
            default: "pending",
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
            default: "pending",
        },
        paymentMethod: { type: String },
        paymentTransactionId: { type: String },

        shippingAddress: { type: ShippingAddressSchema },
        trackingNumber: { type: String },
        trackingUrl: { type: String },
        shippedAt: { type: Date },
        deliveredAt: { type: Date },

        invoiceUrl: { type: String },
        customerNote: { type: String },
        adminNote: { type: String },

        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1 });

export const Order =
    mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

// Counter for auto-incrementing order numbers
const OrderCounterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } });
export const OrderCounter =
    mongoose.models.OrderCounter ||
    mongoose.model("OrderCounter", OrderCounterSchema);
