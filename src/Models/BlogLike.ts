import mongoose, { Document, Schema } from "mongoose";

export interface IBlogLike extends Document {
    blogId: mongoose.Types.ObjectId;
    userId?: string;
    fingerprint?: string;
    createdAt: Date;
    updatedAt: Date;
}

const BlogLikeSchema = new Schema<IBlogLike>(
    {
        blogId: { type: Schema.Types.ObjectId, ref: "Blog", required: true, index: true },
        userId: { type: String, index: true },
        fingerprint: { type: String, index: true },
    },
    { timestamps: true }
);

// Create compound indexes to help with unique checks
BlogLikeSchema.index({ blogId: 1, userId: 1 });
BlogLikeSchema.index({ blogId: 1, fingerprint: 1 });

export const BlogLike =
    (mongoose.models.BlogLike as mongoose.Model<IBlogLike>) || mongoose.model<IBlogLike>("BlogLike", BlogLikeSchema);
