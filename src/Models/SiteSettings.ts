/**
 * SiteSettings Mongoose Model
 * Singleton document that stores site-wide admin settings.
 */

import mongoose from "mongoose";

const SiteSettings_Schema = new mongoose.Schema(
    {
        ConfigID: {
            type: String,
            default: "site_settings_singleton",
            unique: true,
            index: true
        },
        maintenanceMode: {
            type: Boolean,
            default: false
        },
        maintenanceMessage: {
            type: String,
            default: "We're performing scheduled maintenance. We'll be back soon!"
        },
        maintenanceUpdatedBy: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export interface ISiteSettings extends mongoose.Document {
    ConfigID: string;
    maintenanceMode: boolean;
    maintenanceMessage: string;
    maintenanceUpdatedBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export const SiteSettings_Model: mongoose.Model<ISiteSettings> =
    mongoose.models.SiteSettings ||
    mongoose.model<ISiteSettings>("SiteSettings", SiteSettings_Schema);

/**
 * Get the singleton SiteSettings document.
 * Creates it with defaults if it doesn't exist.
 */
export async function getSiteSettings(): Promise<ISiteSettings> {
    let doc = await SiteSettings_Model.findOne({ ConfigID: "site_settings_singleton" });
    if (!doc) {
        doc = await SiteSettings_Model.create({ ConfigID: "site_settings_singleton" });
    }
    return doc;
}
