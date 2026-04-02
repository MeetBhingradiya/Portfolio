/**
 * Cart Model
 * Persistent cart per user, stored in MongoDB.
 */

import mongoose, { Schema, Document } from "mongoose";

export interface ICartItem {
    productId: string;
    productName: string;
    thumbnail?: string;
    variantId: string;
    variantName: string;
    productType: string;
    price: number; // in cents, snapshot at add time
    currency: string;
    billingCycle?: string;
    quantity: number;
    addedAt: Date;
}

export interface ICart extends Document {
    userId: string;
    items: ICartItem[];
    updatedAt: Date;
    createdAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
    {
        productId: { type: String, required: true },
        productName: { type: String, required: true },
        thumbnail: { type: String },
        variantId: { type: String, required: true },
        variantName: { type: String, required: true },
        productType: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        currency: { type: String, required: true, default: "USD" },
        billingCycle: { type: String },
        quantity: { type: Number, required: true, min: 1, default: 1 },
        addedAt: { type: Date, default: Date.now }
    },
    { _id: false }
);

const CartSchema = new Schema<ICart>(
    {
        userId: { type: String, required: true, unique: true, index: true },
        items: { type: [CartItemSchema], default: [] }
    },
    { timestamps: true }
);

export const Cart = mongoose.models.Cart || mongoose.model<ICart>("Cart", CartSchema);
