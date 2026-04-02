/**
 * ShopProduct Model
 * Extended product model for the shop — supports licenses, subscriptions, and physical items.
 */

import mongoose, { Schema, Document } from "mongoose";

export type ProductType = "license" | "subscription" | "physical" | "digital";
export type ProductStatus = "active" | "inactive" | "archived" | "coming_soon";
export type BillingCycle = "one_time" | "monthly" | "quarterly" | "yearly";

export interface IProductVariant {
    variantId: string;
    name: string; // e.g. "Pro", "Team", "Enterprise"
    description?: string;
    price: number; // in cents
    currency: string; // e.g. "USD", "INR"
    billingCycle: BillingCycle;
    features: string[];
    maxUsers?: number; // for team licenses
    stock?: number; // -1 = unlimited
    isPopular?: boolean;
    isActive: boolean;
}

export interface IShopProduct extends Document {
    productId: string;
    name: string;
    slug: string;
    description: string;
    shortDescription?: string;
    type: ProductType;
    status: ProductStatus;

    // Categorisation
    category: string;
    tags: string[];

    // Media
    thumbnail?: string; // CDN URL
    images: string[]; // CDN URLs
    demoUrl?: string;
    documentationUrl?: string;
    repositoryUrl?: string;

    // Pricing
    variants: IProductVariant[];
    defaultVariantId?: string;

    // Physical delivery extras
    weight?: number; // grams
    dimensions?: { length: number; width: number; height: number }; // mm
    shippingClass?: string;

    // Digital delivery
    downloadUrl?: string;
    licenseKey?: string; // template

    // Stats
    totalSales: number;
    rating: number;
    reviewCount: number;

    // SEO
    metaTitle?: string;
    metaDescription?: string;

    isDeleted: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

const ProductVariantSchema = new Schema<IProductVariant>(
    {
        variantId: {
            type: String,
            required: true,
            default: () => require("uuid").v4()
        },
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        price: { type: Number, required: true, min: 0 },
        currency: {
            type: String,
            required: true,
            default: "USD",
            uppercase: true
        },
        billingCycle: {
            type: String,
            enum: ["one_time", "monthly", "quarterly", "yearly"],
            default: "one_time"
        },
        features: { type: [String], default: [] },
        maxUsers: { type: Number },
        stock: { type: Number, default: -1 },
        isPopular: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true }
    },
    { _id: false }
);

const DimensionsSchema = new Schema(
    {
        length: { type: Number },
        width: { type: Number },
        height: { type: Number }
    },
    { _id: false }
);

const ShopProductSchema = new Schema<IShopProduct>(
    {
        productId: {
            type: String,
            required: true,
            unique: true,
            default: () => require("uuid").v4()
        },
        name: { type: String, required: true, trim: true },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        description: { type: String, required: true },
        shortDescription: { type: String, trim: true },
        type: {
            type: String,
            enum: ["license", "subscription", "physical", "digital"],
            required: true,
            default: "digital"
        },
        status: {
            type: String,
            enum: ["active", "inactive", "archived", "coming_soon"],
            default: "active"
        },
        category: {
            type: String,
            required: true,
            trim: true,
            default: "General"
        },
        tags: { type: [String], default: [] },
        thumbnail: { type: String },
        images: { type: [String], default: [] },
        demoUrl: { type: String },
        documentationUrl: { type: String },
        repositoryUrl: { type: String },
        variants: { type: [ProductVariantSchema], default: [] },
        defaultVariantId: { type: String },
        weight: { type: Number },
        dimensions: { type: DimensionsSchema },
        shippingClass: { type: String, trim: true },
        downloadUrl: { type: String },
        licenseKey: { type: String },
        totalSales: { type: Number, default: 0 },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        reviewCount: { type: Number, default: 0 },
        metaTitle: { type: String },
        metaDescription: { type: String },
        isDeleted: { type: Boolean, default: false },
        createdBy: { type: String, required: true }
    },
    { timestamps: true }
);

ShopProductSchema.index({ status: 1, category: 1 });
ShopProductSchema.index({ type: 1, status: 1 });

export const ShopProduct = mongoose.models.ShopProduct || mongoose.model<IShopProduct>("ShopProduct", ShopProductSchema);
