import mongoose from "mongoose";
import { v4 } from "uuid";

// ─── Schema ──────────────────────────────────────────────────────────────────

const WalletContact_Schema = new mongoose.Schema(
    {
        ContactID: { type: String, default: v4, unique: true, index: true },
        UserID: { type: String, required: true, index: true },

        Name: { type: String, required: true, trim: true },
        Relation: { type: String, trim: true }, // e.g. "Friend", "Family", "Client"

        Phones: { type: [String], default: [] },
        Emails: { type: [String], default: [] },
        InstagramIDs: { type: [String], default: [] },
        SnapIDs: { type: [String], default: [] },

        // Financial tracking
        PendingCollections: { type: Number, default: 0 }, // money owed TO the user
        PendingPayments: { type: Number, default: 0 }, // money owed BY the user

        Notes: { type: String, trim: true },
        Avatar: { type: String, trim: true }, // CDN URL
        Source: { type: String, default: "manual" } // "manual" | "google"
    },
    { timestamps: true }
);

WalletContact_Schema.index({ UserID: 1, Name: 1 });

export const WalletContact = mongoose.models.WalletContact || mongoose.model("WalletContact", WalletContact_Schema);
