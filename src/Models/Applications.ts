import mongoose from 'mongoose';
import { v4 } from 'uuid';

const Applications_Schema: mongoose.Schema = new mongoose.Schema({
    ApplicationID: {
        type: String,
        default: v4,
        unique: true,
        required: true
    },
    
    // ? Human Readable Identifier
    Icon: { type: String },
    Name: { type: String },
    Description: { type: String },

    // ? Client Details
    Company_Name: { type: String },
    Company_Logo: { type: String },
    Company_Description: { type: String },
    Company_Website: { type: String },
    Company_Phone: { type: String },
    Company_Email: { type: String },
    Company_Location: { type: String },
    Company_Social: { type: mongoose.Schema.Types.Mixed },
    Company_GST: { type: String },
    Company_Owner_Name: { type: String },
    Company_Owner_PAN: { type: String },
    Company_Owner_Addhar: { type: String },

    // ? Server & Client Signatures
    Services: [{
        ClientType: { 
            type: String, 
            enum: ["Client", "Server", "Database"],
            required: true 
        },
        Signature: { type: String, required: true },
        enabled: { type: Boolean, default: true },
        Note: { type: String },
        Suspend: {
            Start: { type: Date },
            End: { type: Date }
        },
        Resume: {
            Start: { type: Date },
            End: { type: Date }
        }
    }],

    // ? Billing & Payment Details
    Amount: { type: Number, required: true },
    Currency: { 
        type: String, 
        enum: ["INR", "USD", "EUR", "GBP", "AUD", "CAD", "JPY", "CNY"],
        required: true 
    },
    BillingCycle: { 
        type: String, 
        enum: ["OneTime", "Monthly", "Yearly"],
        required: true 
    },

    // ? Payment Due & Overdue Management
    PaymentDueDate: { type: Date },
    LastPaymentDate: { type: Date },
    IsOverdue: { type: Boolean, default: false },
    OverdueGracePeriodDays: { type: Number, default: 45 },
    OverdueActions: {
        Android: {
            enabled: { type: Boolean, default: true },
            action: { 
                type: String, 
                enum: ["crash", "redirect", "disable"],
                default: "crash"
            },
            redirectUrl: { type: String },
            errorMessage: { 
                type: String, 
                default: "Payment overdue. Please contact support to reactivate your app."
            }
        },
        Backend: {
            enabled: { type: Boolean, default: true },
            action: { 
                type: String, 
                enum: ["error", "disable", "limited_access"],
                default: "error"
            },
            errorMessage: { 
                type: String, 
                default: "Service suspended due to overdue payment."
            },
            allowedEndpoints: [{ type: String }]
        },
        Frontend: {
            enabled: { type: Boolean, default: true },
            action: { 
                type: String, 
                enum: ["redirect", "disable", "overlay"],
                default: "redirect"
            },
            redirectUrl: { type: String },
            errorMessage: { 
                type: String, 
                default: "Payment overdue. Please update your payment to continue using this service."
            }
        }
    },

    PaymentHistory: [{
        Date: { type: Date, required: true },
        Amount: { type: Number, required: true },
        Currency: { 
            type: String, 
            enum: ["INR", "USD", "EUR", "GBP", "AUD", "CAD", "JPY", "CNY"],
            required: true 
        },
        PaymentType: { 
            type: String, 
            enum: ["OneTime", "Monthly", "Yearly"],
            required: true 
        },
        PaymentMethod: { 
            type: String, 
            enum: ["UPI", "Card", "NetBanking", "Wallet", "Cash", "Cheque", "BankTransfer"],
            required: true 
        },
        Status: { 
            type: String, 
            enum: ["Pending", "Completed", "Failed"],
            required: true 
        },
        DueDate: { type: Date },
        OverdueDays: { type: Number, default: 0 }
    }],

    PaymentMethods: [{
        Method: { 
            type: String, 
            enum: ["UPI", "Card", "NetBanking", "Wallet", "Cash", "Cheque", "BankTransfer"],
            required: true 
        },
        Details: { type: mongoose.Schema.Types.Mixed }
    }]
}, {
    timestamps: true,
    versionKey: "v1"
});

// Add instance methods to check overdue status
Applications_Schema.methods.checkOverdueStatus = function() {
    const now = new Date();
    const gracePeriod = this.OverdueGracePeriodDays || 45;
    
    if (!this.PaymentDueDate) return false;
    
    const daysSinceOverdue = Math.floor((now.getTime() - this.PaymentDueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceOverdue > gracePeriod) {
        this.IsOverdue = true;
        return true;
    }
    
    this.IsOverdue = false;
    return false;
};

Applications_Schema.methods.calculateNextDueDate = function() {
    const now = new Date();
    let nextDueDate = new Date();
    
    switch (this.BillingCycle) {
        case "Monthly":
            nextDueDate.setMonth(now.getMonth() + 1);
            break;
        case "Yearly":
            nextDueDate.setFullYear(now.getFullYear() + 1);
            break;
        case "OneTime":
            // For one-time payments, due date should be set manually
            return null;
        default:
            return null;
    }
    
    return nextDueDate;
};

Applications_Schema.methods.getOverdueActionForClient = function(clientType: "Android" | "Backend" | "Frontend") {
    if (!this.IsOverdue || !this.OverdueActions) return null;
    
    switch (clientType) {
        case "Android":
            return this.OverdueActions.Android?.enabled ? this.OverdueActions.Android : null;
        case "Backend":
            return this.OverdueActions.Backend?.enabled ? this.OverdueActions.Backend : null;
        case "Frontend":
            return this.OverdueActions.Frontend?.enabled ? this.OverdueActions.Frontend : null;
        default:
            return null;
    }
};

// Add static method to find all overdue applications
Applications_Schema.statics.findOverdueApplications = function() {
    const now = new Date();
    const gracePeriodAgo = new Date();
    gracePeriodAgo.setDate(now.getDate() - 45); // Default 45 days
    
    return this.find({
        PaymentDueDate: { $lt: gracePeriodAgo },
        IsOverdue: { $ne: false }
    });
};

export interface IApplications extends mongoose.Document {
    // ? Machine Readable Identifier
    ApplicationID: string

    // ? Human Readable Identifier
    Icon?: string
    Name?: string
    Description?: string

    // ? Client Details
    Company_Name?: string
    Company_Logo?: string
    Company_Description?: string
    Company_Website?: string
    Company_Phone?: string
    Company_Email?: string
    Company_Location?: string
    Company_Social?: {
        [key: string]: string
    }
    Company_GST?: string
    Company_Owner_Name?: string
    Company_Owner_PAN?: string
    Company_Owner_Addhar?: string

    // ? Server & Client Signatures
    Services?: Array<{
        ClientType: "Client" | "Server" | "Database"
        Signature: string
        enabled: boolean
        Note?: string


        // ? Suspend & Resume Temporary Access
        Suspend?: {
            Start: Date
            End: Date
        }
        Resume?: {
            Start: Date
            End: Date
        }
    }>    // ? Billing & Payment Details
    Amount: number
    Currency: "INR" | "USD" | "EUR" | "GBP" | "AUD" | "CAD" | "JPY" | "CNY"
    BillingCycle: "OneTime" | "Monthly" | "Yearly"
    
    // ? Payment Due & Overdue Management
    PaymentDueDate?: Date
    LastPaymentDate?: Date
    IsOverdue?: boolean
    OverdueGracePeriodDays?: number // Default 45 days
    OverdueActions?: {
        Android?: {
            enabled: boolean
            action: "crash" | "redirect" | "disable"
            redirectUrl?: string
            errorMessage?: string
        }
        Backend?: {
            enabled: boolean
            action: "error" | "disable" | "limited_access"
            errorMessage?: string
            allowedEndpoints?: string[]
        }
        Frontend?: {
            enabled: boolean
            action: "redirect" | "disable" | "overlay"
            redirectUrl?: string
            errorMessage?: string
        }
    }
    
    PaymentHistory?: Array<{
        Date: Date
        Amount: number
        Currency: "INR" | "USD" | "EUR" | "GBP" | "AUD" | "CAD" | "JPY" | "CNY"
        PaymentType: "OneTime" | "Monthly" | "Yearly"
        PaymentMethod: "UPI" | "Card" | "NetBanking" | "Wallet" | "Cash" | "Cheque" | "BankTransfer"
        Status: "Pending" | "Completed" | "Failed"
        DueDate?: Date
        OverdueDays?: number
    }>
    PaymentMethods?: Array<{
        Method: "UPI" | "Card" | "NetBanking" | "Wallet" | "Cash" | "Cheque" | "BankTransfer"
        Details: {
            UPI?: string
            Card?: {
                Number: string
                Expiry: string
                CVV: string
            }
            NetBanking?: {
                BankName: string
                AccountNumber: string
            }
            Wallet?: string
            Cash?: boolean
            Cheque?: {
                Number: string
                BankName: string
            }
            BankTransfer?: {
                AccountNumber: string
                IFSC: string
            }
        }
    }>
}

export const Applications_Model: mongoose.Model<IApplications> = mongoose.models?.Applications || mongoose.model<IApplications>("Applications", Applications_Schema);