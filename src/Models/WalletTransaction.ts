import mongoose from "mongoose";
import { v4 } from "uuid";

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum WalletTransactionType {
    CREDIT = "CREDIT",
    DEBIT = "DEBIT",
    TRANSFER = "TRANSFER",
}

export enum WalletTransactionCategory {
    FOOD = "FOOD",
    TRANSPORT = "TRANSPORT",
    SHOPPING = "SHOPPING",
    ENTERTAINMENT = "ENTERTAINMENT",
    BILLS = "BILLS",
    HEALTH = "HEALTH",
    EDUCATION = "EDUCATION",
    RENT = "RENT",
    SALARY = "SALARY",
    FREELANCE = "FREELANCE",
    INVESTMENT = "INVESTMENT",
    GIFT = "GIFT",
    RECHARGE = "RECHARGE",
    SUBSCRIPTION = "SUBSCRIPTION",
    TRAVEL = "TRAVEL",
    GROCERIES = "GROCERIES",
    DONATION = "DONATION",
    LOAN = "LOAN",
    REFUND = "REFUND",
    OTHER = "OTHER",
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const WalletTransaction_Schema = new mongoose.Schema(
    {
        TransactionID: { type: String, default: v4, unique: true, index: true },
        UserID:        { type: String, required: true, index: true },

        Note:          { type: String, required: true, trim: true },
        Amount:        { type: Number, required: true, min: 0 },
        Currency:      { type: String, default: "INR", trim: true },

        Type:          { type: String, enum: Object.values(WalletTransactionType), required: true },
        Category:      { type: String, enum: Object.values(WalletTransactionCategory), default: WalletTransactionCategory.OTHER },

        // Source asset (always set for DEBIT and TRANSFER)
        FromAssetID:   { type: String, index: true },
        // Destination asset (always set for CREDIT and TRANSFER)
        ToAssetID:     { type: String, index: true },

        // Transaction date (user can backdate)
        Date:          { type: Date, required: true, default: Date.now },

        // Visibility controls
        IsWalletTransfer: { type: Boolean, default: false },
        IsHidden:         { type: Boolean, default: false },

        // Optional linked contact
        ContactID:     { type: String, sparse: true },

        Tags:          { type: [String], default: [] },
    },
    { timestamps: true }
);

WalletTransaction_Schema.index({ UserID: 1, Date: -1 });
WalletTransaction_Schema.index({ UserID: 1, Type: 1 });
WalletTransaction_Schema.index({ UserID: 1, Category: 1 });
WalletTransaction_Schema.index({ UserID: 1, FromAssetID: 1 });
WalletTransaction_Schema.index({ UserID: 1, ToAssetID: 1 });

export const WalletTransaction =
    mongoose.models.WalletTransaction ||
    mongoose.model("WalletTransaction", WalletTransaction_Schema);
