import mongoose, { Schema, Document } from "mongoose";

export enum AgreementType {
    CoveredProductsPrivacy = "covered_products_privacy",
    CoveredProductsTerms = "covered_products_terms",
    Security = "security"
}

export enum AgreementStatus {
    Draft = "draft",
    Published = "published",
    Archived = "archived"
}

export interface IAgreement extends Document {
    AgreementID: string;
    Type: AgreementType;
    Title: string;
    Slug: string;
    Content: string; // Markdown content
    Version: string;
    ProductIDs: string[]; // Array of product IDs covered by this agreement
    Status: AgreementStatus;
    EffectiveDate?: Date;
    PublishDate?: Date;
    LastModifiedBy: string; // Admin/User ID
    CreateDate: Date;
    isDeleted: boolean;
    Metadata: {
        Description?: string;
        Keywords?: string[];
        Author?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const AgreementSchema = new Schema<IAgreement>(
    {
        AgreementID: {
            type: String,
            required: true,
            unique: true,
            default: () => require("uuid").v4()
        },
        Type: {
            type: String,
            enum: Object.values(AgreementType),
            required: true
        },
        Title: {
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
        Content: {
            type: String,
            required: true
        },
        Version: {
            type: String,
            required: true,
            default: "1.0.0"
        },
        ProductIDs: {
            type: [String],
            default: []
        },
        Status: {
            type: String,
            enum: Object.values(AgreementStatus),
            default: AgreementStatus.Draft
        },
        EffectiveDate: {
            type: Date
        },
        PublishDate: {
            type: Date
        },
        LastModifiedBy: {
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
            Description: {
                type: String,
                trim: true
            },
            Keywords: {
                type: [String],
                default: []
            },
            Author: {
                type: String,
                trim: true
            }
        }
    },
    {
        timestamps: true,
        collection: "Agreement"
    }
);

export const Agreement =
    mongoose.models.Agreement ||
    mongoose.model<IAgreement>("Agreement", AgreementSchema);
