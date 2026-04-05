import mongoose, { Document, Schema } from "mongoose";

export type ResumePresetIconKey = "code" | "preview" | "work" | "school" | "folder";

export interface IResumePreset extends Document {
    key: string;
    label: string;
    title: string;
    summary: string;
    keywordsByCategory: Partial<Record<string, string[]>>;
    includeAll: string[];
    iconKey: ResumePresetIconKey;
    pinnedIdsByCategory: Partial<Record<string, string[]>>;
    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
}

const ResumePresetSchema = new Schema<IResumePreset>(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true
        },
        label: { type: String, required: true, trim: true },
        title: { type: String, required: true, trim: true },
        summary: { type: String, default: "", trim: true },
        keywordsByCategory: { type: Schema.Types.Mixed, default: {} },
        includeAll: { type: [String], default: [] },
        iconKey: {
            type: String,
            enum: ["code", "preview", "work", "school", "folder"],
            default: "code"
        },
        pinnedIdsByCategory: { type: Schema.Types.Mixed, default: {} },
        createdBy: { type: String, default: "" },
        updatedBy: { type: String, default: "" }
    },
    { timestamps: true }
);

export const ResumePreset =
    (mongoose.models.ResumePreset as mongoose.Model<IResumePreset>) ||
    mongoose.model<IResumePreset>("ResumePreset", ResumePresetSchema);
