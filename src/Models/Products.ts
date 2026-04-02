import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
    ProductID: string;
    Name: string;
    Slug: string;
    Description?: string;
    Version?: string;
    Category?: string;
    Status: "active" | "inactive" | "deprecated";
    Icon?: string;
    URL?: string;
    CreatedBy: string; // Admin/User ID
    CreateDate: Date;
    isDeleted: boolean;
    Metadata: {
        Repository?: string;
        Documentation?: string;
        SupportEmail?: string;
        Tags?: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
    {
        ProductID: {
            type: String,
            required: true,
            unique: true,
            default: () => require("uuid").v4()
        },
        Name: {
            type: String,
            required: true,
            trim: true
        },
        Slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        Description: {
            type: String,
            trim: true
        },
        Version: {
            type: String,
            default: "1.0.0"
        },
        Category: {
            type: String,
            trim: true
        },
        Status: {
            type: String,
            enum: ["active", "inactive", "deprecated"],
            default: "active"
        },
        Icon: {
            type: String,
            trim: true
        },
        URL: {
            type: String,
            trim: true
        },
        CreatedBy: {
            type: String,
            required: true,
            ref: "Users"
        },
        CreateDate: {
            type: Date,
            default: Date.now
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        Metadata: {
            Repository: {
                type: String,
                trim: true
            },
            Documentation: {
                type: String,
                trim: true
            },
            SupportEmail: {
                type: String,
                trim: true
            },
            Tags: {
                type: [String],
                default: []
            }
        }
    },
    {
        timestamps: true,
        collection: "products"
    }
);

// Indexes (Slug already has unique index from schema definition)
ProductSchema.index({ Status: 1 });
ProductSchema.index({ isDeleted: 1 });
ProductSchema.index({ "Metadata.Tags": 1 });

export const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
