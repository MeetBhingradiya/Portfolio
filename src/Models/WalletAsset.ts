import mongoose from "mongoose";
import { v4 } from "uuid";

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum WalletAssetType {
    BANK = "BANK",
    DIGITAL_WALLET = "DIGITAL_WALLET",
    UPI_APP = "UPI_APP",
    CASH = "CASH",
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const WalletAsset_Schema = new mongoose.Schema(
    {
        AssetID:        { type: String, default: v4, unique: true, index: true },
        UserID:         { type: String, required: true, index: true },

        Name:           { type: String, required: true, trim: true },
        Icon:           { type: String, trim: true },            // CDN URL from /api/cdn/
        Type:           { type: String, enum: Object.values(WalletAssetType), default: WalletAssetType.CASH },

        Balance:        { type: Number, default: 0 },
        InitialBalance: { type: Number, default: 0 },
        Currency:       { type: String, default: "INR", trim: true },

        // Required when Type === UPI_APP — points to a BANK asset
        // UPI apps don't hold their own balance; they use the linked bank's balance
        LinkedAssetID:  { type: String, sparse: true },

        // Multiple UPI IDs (e.g. ["user@ybl", "user@paytm", "9876543210@upi"])
        UPIIds:         { type: [String], default: [] },

        IsArchived:     { type: Boolean, default: false },
        Color:          { type: String, default: "" },           // accent color — empty = use palette.accent
        Notes:          { type: String, trim: true },
    },
    { timestamps: true }
);

WalletAsset_Schema.index({ UserID: 1, Type: 1 });
WalletAsset_Schema.index({ UserID: 1, IsArchived: 1 });

export const WalletAsset =
    mongoose.models.WalletAsset ||
    mongoose.model("WalletAsset", WalletAsset_Schema);
