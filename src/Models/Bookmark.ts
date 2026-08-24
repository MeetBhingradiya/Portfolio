import mongoose, { Document, Schema } from "mongoose";

export interface IBookmark extends Document {
    UserID: string;
    Title: string;
    Url: string;
    Description?: string;
    Icon?: string;
    Tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>(
    {
        UserID: {
            type: String,
            required: true,
            index: true,
        },
        Title: {
            type: String,
            required: true,
            trim: true,
        },
        Url: {
            type: String,
            required: true,
            trim: true,
        },
        Description: {
            type: String,
            trim: true,
        },
        Icon: {
            type: String,
            trim: true,
        },
        Tags: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

export const Bookmark: mongoose.Model<IBookmark> =
    mongoose.models.Bookmark || mongoose.model<IBookmark>("Bookmark", BookmarkSchema);
