/**
 * Blog Model — Extended with approval workflow
 * Status lifecycle: draft → pending_review → published | unlisted | private | rejected
 */

import mongoose, { Schema, Document, Model } from "mongoose";
export { BlogStatus, BlogVisibility, BlogCategory } from "@/Types/Blog";
import { BlogStatus, BlogVisibility, BlogCategory } from "@/Types/Blog";

export interface IBlog extends Document {
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    contentPreview?: string;

    // Approval workflow
    status: BlogStatus;
    submittedAt?: Date;
    approvedBy?: string;
    approvedAt?: Date;
    rejectionReason?: string;

    // Status
    visibility: BlogVisibility;
    featured: boolean;
    published: boolean;
    publishedAt?: Date;
    scheduledFor?: Date;

    // Media
    featuredImage: string;
    images?: string[];

    // Categorization
    category: BlogCategory;
    tags: string[];

    // Author
    authorId: string;
    authorName: string;
    authorImage?: string;

    // Engagement
    views: number;
    likes: number;
    comments: number;
    readTime: number; // in minutes

    // SEO
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];

    // Content Structure
    tableOfContents?: {
        id: string;
        title: string;
        level: number;
    }[];

    // Version Control
    version: number;
    lastEditedBy?: string;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
    {
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        excerpt: {
            type: String,
            required: true,
            maxlength: 300
        },
        content: {
            type: String,
            required: true
        },
        contentPreview: {
            type: String,
            maxlength: 1000
        },
        // Approval workflow
        status: {
            type: String,
            enum: Object.values(BlogStatus),
            default: BlogStatus.Draft,
            index: true
        },
        submittedAt: { type: Date },
        approvedBy: { type: String },
        approvedAt: { type: Date },
        rejectionReason: { type: String },
        visibility: {
            type: String,
            enum: Object.values(BlogVisibility),
            default: BlogVisibility.Draft,
            index: true
        },
        featured: {
            type: Boolean,
            default: false,
            index: true
        },
        published: {
            type: Boolean,
            default: false,
            index: true
        },
        publishedAt: {
            type: Date
        },
        scheduledFor: {
            type: Date
        },
        featuredImage: {
            type: String,
            required: true
        },
        images: [
            {
                type: String
            }
        ],
        category: {
            type: String,
            enum: Object.values(BlogCategory),
            required: true,
            index: true
        },
        tags: [
            {
                type: String,
                lowercase: true,
                trim: true,
                index: true
            }
        ],
        authorId: {
            type: String,
            required: true,
            index: true
        },
        authorName: {
            type: String,
            required: true
        },
        authorImage: { type: String },
        views: {
            type: Number,
            default: 0
        },
        likes: {
            type: Number,
            default: 0
        },
        comments: {
            type: Number,
            default: 0
        },
        readTime: {
            type: Number,
            default: 5
        },
        metaTitle: String,
        metaDescription: String,
        metaKeywords: [
            {
                type: String
            }
        ],
        tableOfContents: [
            {
                id: String,
                title: String,
                level: Number
            }
        ],
        version: {
            type: Number,
            default: 1
        },
        lastEditedBy: String
    },
    {
        timestamps: true
    }
);

// Indexes for optimized queries
BlogSchema.index({ published: 1, visibility: 1, publishedAt: -1 });
BlogSchema.index({ category: 1, published: 1, featured: -1 });
BlogSchema.index({ tags: 1, published: 1, publishedAt: -1 });
BlogSchema.index({ authorId: 1, visibility: 1, publishedAt: -1 });
BlogSchema.index({ featured: 1, published: 1, publishedAt: -1 });
BlogSchema.index({ title: "text", excerpt: "text", contentPreview: "text" });
BlogSchema.index(
    { scheduledFor: 1 },
    {
        partialFilterExpression: { visibility: BlogVisibility.Scheduled }
    }
);

// Pre-save hook to generate content preview
BlogSchema.pre("save", function () {
    if (this.isModified("content") && this.content) {
        // Generate preview (first 500 characters, strip markdown)
        const plainText = this.content
            .replace(/[#*`_~\[\]()]/g, "") // Remove markdown syntax
            .replace(/\s+/g, " ") // Normalize whitespace
            .trim();
        this.contentPreview = plainText.substring(0, 500) + (plainText.length > 500 ? "..." : "");
    }
});

const Blog: Model<IBlog> = mongoose.models.Blog || mongoose.model<IBlog>("Blog", BlogSchema);

export default Blog;
