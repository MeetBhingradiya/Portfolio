import mongoose, { Schema, Document } from "mongoose";

export interface IRoadmapItem extends Document {
    title: string;
    description?: string;
    status: "planned" | "completed";
    completedAt?: Date; // Only populated if status === 'completed'
    order: number; // For sorting 'planned' items (lower is higher priority)
    isPublished: boolean; // Whether to show on public roadmap
    createdAt: Date;
    updatedAt: Date;
}

const RoadmapItemSchema = new Schema<IRoadmapItem>(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        status: { type: String, enum: ["planned", "completed"], default: "planned", index: true },
        completedAt: { type: Date },
        order: { type: Number, default: 0, index: true },
        isPublished: { type: Boolean, default: true, index: true }
    },
    { timestamps: true }
);

export const RoadmapItem = mongoose.models.RoadmapItem || mongoose.model<IRoadmapItem>("RoadmapItem", RoadmapItemSchema);
