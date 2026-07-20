import mongoose, { Schema, Document } from "mongoose";

export interface IBlogAccess extends Document {
    blogId: mongoose.Types.ObjectId | string;
    userId: string; // The user's clerk ID or session ID
    grantedAt: Date;
}

const BlogAccessSchema = new Schema<IBlogAccess>(
    {
        blogId: {
            type: Schema.Types.ObjectId,
            ref: "Blog",
            required: true
        },
        userId: {
            type: String,
            required: true,
            index: true
        },
        grantedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

// Ensure a user can only have one access record per blog
BlogAccessSchema.index({ blogId: 1, userId: 1 }, { unique: true });

function getModel<T extends Document>(name: string, schema: Schema) {
    return (mongoose.models[name] as mongoose.Model<T>) || mongoose.model<T>(name, schema);
}

export const BlogAccess_Model = () => getModel<IBlogAccess>("BlogAccess", BlogAccessSchema);
