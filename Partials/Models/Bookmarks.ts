import mongoose from "mongoose";
import { v4 } from "uuid";

const Bookmarks_Schema: mongoose.Schema = new mongoose.Schema(
    {
        BookmarkID: {
            type: String,
            default: v4,
            unique: true
        },
        Name: {
            type: String,
            required: true
        },
        Description: {
            type: String,
            default: ""
        },
        Keywords: {
            type: [String],
            default: []
        },
        WebLink: {
            type: String,
            required: true
        },
        Android: {
            type: String,
            default: ""
        },
        Windows: {
            type: String,
            default: ""
        },
        Priority: {
            type: String,
            default: "web"
        },
        Icon: {
            type: String,
            default: ""
        },
        isSVG: {
            type: Boolean,
            default: false
        },
        fillColor: {
            type: String,
            default: ""
        },
        CORSProxy: {
            type: Boolean,
            default: false
        },
        isSponsored: {
            type: Boolean,
            default: false
        },
        isPublished: {
            type: Boolean,
            default: false
        },
        isCloudSync: {
            type: Boolean,
            default: false
        },
        isDefault: {
            type: Boolean,
            default: false
        },
        isAdminOnly: {
            type: Boolean,
            default: false
        },
        isDeleteBlock: {
            type: Boolean,
            default: false
        },
        isEditBlock: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

export interface IBookmark extends mongoose.Document {
    BookmarkID: string;
    Name: string;
    Description?: string;

    Keywords?: string[];

    WebLink: string;
    Android?: string;
    Windows?: string;
    Priority?: "windows" | "android" | "web";

    Icon?: string;
    isSVG?: boolean;
    fillColor?: string;
    CORSProxy?: boolean;

    isSponsored: boolean;
    isPublished: boolean;
    isCloudSync: boolean;
    isDefault: boolean;
    isAdminOnly: boolean;

    isDeleteBlock: boolean;
    isEditBlock: boolean;
}

export const Bookmarks_Model: mongoose.Model<IBookmark> =
    mongoose.models?.Bookmarks ||
    mongoose.model<IBookmark>("Bookmarks", Bookmarks_Schema);
