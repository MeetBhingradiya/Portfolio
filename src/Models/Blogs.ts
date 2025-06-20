import mongoose, { Schema, Document } from "mongoose";

export enum BlogVisibility {
    Public = "public",
    Private = "private",
    Unlisted = "unlisted"
}

export interface IBlog extends Document {
    BlogID: string;
    ContentID: string;
    AuthorID: string;
    Title: string;
    Slug: string; // Add this field
    Description?: string;
    Tags: string[];
    BannerImage?: string;
    Visiblity: BlogVisibility;
    isPublished: boolean;
    PublishDate?: Date;
    CreateDate: Date;
    Views: number;
    Likes: number;
    LikedBy: string[];
    History: string[]; // Array of previous ContentIDs
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
    {
        BlogID: {
            type: String,
            required: true,
            unique: true,
            default: () => require("uuid").v4()
        },
        ContentID: {
            type: String,
            required: true,
            ref: "BlogsContent"
        },
        AuthorID: {
            type: String,
            required: true,
            ref: "Users"
        },
        Title: {
            type: String,
            required: true,
            maxlength: 200
        },
        Slug: {
            type: String,
            required: true,
            unique: true // Ensure unique slugs
            // Removed index: true to avoid duplicate with schema.index() below
        },
        Description: {
            type: String,
            maxlength: 500
        },
        Tags: [
            {
                type: String,
                maxlength: 50
            }
        ],
        BannerImage: {
            type: String
        },
        Visiblity: {
            type: String,
            enum: Object.values(BlogVisibility),
            default: BlogVisibility.Public
        },
        isPublished: {
            type: Boolean,
            default: false
        },
        PublishDate: {
            type: Date
        },
        CreateDate: {
            type: Date,
            default: Date.now
        },
        Views: {
            type: Number,
            default: 0
        },
        Likes: {
            type: Number,
            default: 0
        },
        LikedBy: [
            {
                type: String,
                ref: "Users"
            }
        ],
        History: [
            {
                type: String,
                ref: "BlogsContent"
            }
        ],
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        collection: "Blogs"
    }
);

// Create indexes for better performance
BlogSchema.index({ AuthorID: 1, isDeleted: 1 });
BlogSchema.index({ isPublished: 1, Visiblity: 1, isDeleted: 1 });
BlogSchema.index({ Tags: 1 });
BlogSchema.index({ CreateDate: -1 });

export const Blogs_Model =
    mongoose.models?.Blogs || mongoose.model<IBlog>("Blogs", BlogSchema);
