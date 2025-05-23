import mongoose from 'mongoose';
import { v4 } from 'uuid';

enum Frequency {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    YEARLY = "yearly"
}

const Sitemap_Schema: mongoose.Schema = new mongoose.Schema({
    EndpointID: {
        type: String,
        default: v4,
        unique: true
    },
    Endpoint: {
        type: String,
        required: true
    },
    Priority: {
        type: Number,
        default: 0.5
    },
    Frequency: {
        type: String,
        enum: Object.values(Frequency),
        default: Frequency.WEEKLY
    },
    Enabled: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: "v1",
});

export interface ISitemap extends mongoose.Document {
    EndpointID: string
    Endpoint: string
    Priority: number
    Frequency: Frequency
    Enabled: boolean
}

export const Sitemap_Model: mongoose.Model<ISitemap> = mongoose.models?.Sitemap || mongoose.model<ISitemap>("Sitemap", Sitemap_Schema);