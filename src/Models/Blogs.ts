import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { v4 } from 'uuid';

export enum BlogVisibility {
    Public = 'public',
    Private = 'private',
    Unlisted = 'unlisted'
}

export enum BlogPermission {
    Visitor = 'visitor',
    Editor = 'editor'
}

const Blog_Schema: mongoose.Schema = new mongoose.Schema({
    BlogID: {
        type: String,
        default: v4,
        unique: true,
        required: true
    },
    ContentID: {
        type: String,
        required: true
    },
    AuthorID: {
        type: String,
        required: true
    },
    Title: {
        type: String,
        required: true
    },
    AccessControl: {
        type: [
            {
                UserID: String,
                Permission: {
                    type: String,
                    enum: [
                        BlogPermission.Visitor,
                        BlogPermission.Editor
                    ]
                }
            }
        ]
    },
    BannerImage: {
        type: String
    },
    Description: {
        type: String
    },
    Tags: {
        type: [String]
    },
    Visiblity: {
        type: String,
        default: BlogVisibility.Public,
        enum: [
            BlogVisibility.Public,
            BlogVisibility.Private,
            BlogVisibility.Unlisted
        ]
    },
    Likes: {
        type: Number
    },
    Views: {
        type: Number
    },
    LikedBy: {
        type: [String]
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    PublishDate: {
        type: Date
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    CreateDate: {
        type: Date
    },
    History: {
        type: [String]
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    versionKey: "v1"
});

export interface IBlog extends mongoose.Document {
    // ! Required
    BlogID: string;
    ContentID: string;
    AuthorID: string; // ? UserID of the author
    Title: string;

    // ! Optional
    BannerImage?: string
    Description?: string
    Tags?: string[]
    AccessControl?: Array<{
        UserID: string
        Permission: BlogPermission
    }>
    Visiblity?: BlogVisibility;
    Likes?: number; // ? Total Likes by the users
    Views?: number; // ? Session Store based views
    LikedBy?: string[]; // ? UserIDs who liked the blog
    
    // ? By Default Generated
    isPublished?: boolean; // ? Default: false
    PublishDate?: Date; // ? Date when the blog is published
    isLocked?: boolean; // ? Default: false
    CreateDate?: Date; // ? Date when the blog is created
    History?: string[]; // ? ContentID of the previous versions
    isDeleted?: boolean; // ? Default: false
}

Blog_Schema.plugin(mongoosePaginate);

export const Blogs_Model: mongoose.Model<IBlog> = mongoose.models?.Blogs || mongoose.model<IBlog>("Blogs", Blog_Schema);