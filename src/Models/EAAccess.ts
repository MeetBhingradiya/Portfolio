import mongoose, { Schema, Document } from "mongoose";

export interface IEAAccess extends Document {
    accessId: string;
    userId: string;
    productId: string; // Links to ShopProduct
    orderId?: string; // Links to the Order that granted this access
    status: "active" | "expired" | "suspended" | "revoked";
    
    // Scheduling
    accessStartDate: Date;
    accessEndDate?: Date; // If it's a subscription or time-limited
    
    // Time-of-day or day-of-week restrictions (Optional)
    allowedDaysOfWeek?: number[]; // 0=Sunday, 1=Monday... 6=Saturday
    allowedStartHour?: string; // "09:00"
    allowedEndHour?: string; // "17:00"
    timezone?: string; // e.g. "UTC", "America/New_York"

    // HWID or MetaQuotes ID locking (Optional)
    allowedMTIds?: string[];
    
    createdAt: Date;
    updatedAt: Date;
}

const EAAccessSchema = new Schema<IEAAccess>(
    {
        accessId: {
            type: String,
            required: true,
            unique: true,
            default: () => require("uuid").v4()
        },
        userId: { type: String, required: true, index: true },
        productId: { type: String, required: true, index: true },
        orderId: { type: String },
        status: {
            type: String,
            enum: ["active", "expired", "suspended", "revoked"],
            default: "active"
        },
        accessStartDate: { type: Date, required: true, default: Date.now },
        accessEndDate: { type: Date },
        
        allowedDaysOfWeek: { type: [Number], default: [] },
        allowedStartHour: { type: String },
        allowedEndHour: { type: String },
        timezone: { type: String, default: "UTC" },
        
        allowedMTIds: { type: [String], default: [] }
    },
    { timestamps: true }
);

EAAccessSchema.index({ userId: 1, productId: 1 });
EAAccessSchema.index({ status: 1 });

export const EAAccess = mongoose.models.EAAccess || mongoose.model<IEAAccess>("EAAccess", EAAccessSchema);
