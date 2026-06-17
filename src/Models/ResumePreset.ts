import mongoose, { Document, Schema } from "mongoose";

export type ResumePresetIconKey = "code" | "preview" | "work" | "school" | "folder";

export interface IResumePreset extends Document {
    key: string;
    label: string;
    iconKey: ResumePresetIconKey;
    header: Record<string, unknown>;
    selectedIdsByCategory: Partial<Record<string, string[]>>;
    sectionOrder: string[];
    itemOrderByCategory: Partial<Record<string, string[]>>;
    style: Record<string, unknown>;
    title?: string;
    summary?: string;
    pinnedIdsByCategory?: Partial<Record<string, string[]>>;
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
        title: { type: String, default: "", trim: true },
        summary: { type: String, default: "", trim: true },
        iconKey: {
            type: String,
            enum: ["code", "preview", "work", "school", "folder"],
            default: "code"
        },
        header: { type: Schema.Types.Mixed, default: {} },
        selectedIdsByCategory: { type: Schema.Types.Mixed, default: {} },
        sectionOrder: { type: [String], default: [] },
        itemOrderByCategory: { type: Schema.Types.Mixed, default: {} },
        style: { type: Schema.Types.Mixed, default: {} },
        pinnedIdsByCategory: { type: Schema.Types.Mixed, default: {} },
        createdBy: { type: String, default: "" },
        updatedBy: { type: String, default: "" }
    },
    { timestamps: true }
);

export const ResumePreset =
    (mongoose.models.ResumePreset as mongoose.Model<IResumePreset>) || mongoose.model<IResumePreset>("ResumePreset", ResumePresetSchema);
