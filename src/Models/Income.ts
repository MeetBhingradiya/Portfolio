import mongoose from "mongoose";
import { v4 } from "uuid";
import { IncomeCategory, PaymentMethod, RecurrenceType } from "./Expenses";

const Income_Schema: mongoose.Schema = new mongoose.Schema(
    {
        IncomeID: {
            type: String,
            default: v4,
            unique: true,
            required: true
        },
        
        // Basic Details
        Title: {
            type: String,
            required: true,
            trim: true
        },
        Description: {
            type: String,
            trim: true
        },
        Amount: {
            type: Number,
            required: true,
            min: 0
        },
        Currency: {
            type: String,
            enum: ["INR", "USD", "EUR", "GBP", "AUD", "CAD", "JPY", "CNY"],
            default: "INR",
            required: true
        },
        
        // Categorization
        Category: {
            type: String,
            enum: Object.values(IncomeCategory),
            required: true
        },
        SubCategory: {
            type: String,
            trim: true
        },
        Tags: [{
            type: String,
            trim: true
        }],
        
        // Date & Time
        Date: {
            type: Date,
            default: Date.now,
            required: true
        },
        
        // Payment Details
        PaymentMethod: {
            type: String,
            enum: Object.values(PaymentMethod),
            required: true
        },
        
        // Linked Accounts
        WalletID: {
            type: String,
            ref: "Wallets"
        },
        TransactionID: {
            type: String,
            ref: "Transactions"
        },
        
        // Source Details
        Source: {
            name: { type: String }, // Company/Client name
            type: { 
                type: String,
                enum: ["EMPLOYER", "CLIENT", "CUSTOMER", "PLATFORM", "INVESTMENT", "OTHER"],
                default: "OTHER"
            },
            contactInfo: {
                email: { type: String },
                phone: { type: String },
                website: { type: String }
            },
            address: { type: String },
            taxID: { type: String } // For business income tracking
        },
        
        // Project/Work Details (for freelance/consulting)
        ProjectDetails: {
            projectName: { type: String },
            projectID: { type: String },
            hoursWorked: { type: Number },
            hourlyRate: { type: Number },
            milestoneCompleted: { type: String }
        },
        
        // Invoice & Documentation
        InvoiceNumber: {
            type: String,
            unique: true,
            sparse: true // This automatically creates a sparse unique index
        },
        InvoiceDate: {
            type: Date
        },
        DueDate: {
            type: Date
        },
        Documents: [{
            type: { 
                type: String,
                enum: ["INVOICE", "CONTRACT", "RECEIPT", "TAX_DOCUMENT", "OTHER"]
            },
            filename: { type: String },
            url: { type: String },
            uploadDate: { type: Date, default: Date.now }
        }],
        
        // Recurrence
        IsRecurring: {
            type: Boolean,
            default: false
        },
        Recurrence: {
            type: {
                type: String,
                enum: Object.values(RecurrenceType),
                default: RecurrenceType.NONE
            },
            interval: { type: Number, default: 1 },
            endDate: { type: Date },
            nextExpectedDate: { type: Date }
        },
        
        // Tax Information
        TaxDetails: {
            isTaxable: { type: Boolean, default: true },
            taxRate: { type: Number, default: 0 },
            taxDeducted: { type: Number, default: 0 }, // TDS
            netAmount: { type: Number }, // Amount after tax deduction
            taxYear: { type: Number },
            taxCategory: { 
                type: String,
                enum: ["SALARY", "BUSINESS", "CAPITAL_GAINS", "OTHER_SOURCES"],
                default: "OTHER_SOURCES"
            }
        },
        
        // User & Organization
        UserID: {
            type: String,
            required: true,
            ref: "Users"
        },
        OrganizationID: {
            type: String,
            ref: "Organizations"
        },
        
        // Status & Tracking
        Status: {
            type: String,
            enum: ["EXPECTED", "RECEIVED", "PENDING", "OVERDUE", "CANCELLED"],
            default: "RECEIVED"
        },
        IsVerified: {
            type: Boolean,
            default: false
        },
        
        // Performance Metrics
        PerformanceMetrics: {
            conversionRate: { type: Number }, // For sales/marketing income
            roi: { type: Number }, // Return on investment
            profitMargin: { type: Number },
            clientSatisfactionScore: { type: Number, min: 1, max: 10 }
        },
        
        // Analytics
        Notes: {
            type: String,
            trim: true
        },
        Priority: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            default: "MEDIUM"
        },
        
        // Archive
        IsArchived: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        versionKey: "v1"
    }
);

// Indexes for better performance
Income_Schema.index({ UserID: 1, Date: -1 });
Income_Schema.index({ Category: 1, Date: -1 });
Income_Schema.index({ WalletID: 1 });
Income_Schema.index({ Status: 1, Date: -1 });
Income_Schema.index({ IsRecurring: 1, "Recurrence.nextExpectedDate": 1 });
// Note: InvoiceNumber index is automatically created by the unique: true, sparse: true field definition

// Instance methods
Income_Schema.methods.calculateNextRecurrence = function() {
    if (!this.IsRecurring || this.Recurrence.type === RecurrenceType.NONE) {
        return null;
    }
    
    const currentDate = this.Recurrence.nextExpectedDate || this.Date;
    const nextDate = new Date(currentDate);
    
    switch (this.Recurrence.type) {
        case RecurrenceType.DAILY:
            nextDate.setDate(nextDate.getDate() + this.Recurrence.interval);
            break;
        case RecurrenceType.WEEKLY:
            nextDate.setDate(nextDate.getDate() + (7 * this.Recurrence.interval));
            break;
        case RecurrenceType.MONTHLY:
            nextDate.setMonth(nextDate.getMonth() + this.Recurrence.interval);
            break;
        case RecurrenceType.QUARTERLY:
            nextDate.setMonth(nextDate.getMonth() + (3 * this.Recurrence.interval));
            break;
        case RecurrenceType.YEARLY:
            nextDate.setFullYear(nextDate.getFullYear() + this.Recurrence.interval);
            break;
    }
    
    return nextDate;
};

Income_Schema.methods.calculateNetAmount = function() {
    const taxDeducted = this.TaxDetails?.taxDeducted || 0;
    return this.Amount - taxDeducted;
};

// Static methods
Income_Schema.statics.getIncomeByCategory = function(userID: string, startDate?: Date, endDate?: Date) {
    const query: any = { UserID: userID, IsArchived: false, Status: "RECEIVED" };
    
    if (startDate || endDate) {
        query.Date = {};
        if (startDate) query.Date.$gte = startDate;
        if (endDate) query.Date.$lte = endDate;
    }
    
    return this.aggregate([
        { $match: query },
        {
            $group: {
                _id: "$Category",
                totalAmount: { $sum: "$Amount" },
                count: { $sum: 1 },
                averageAmount: { $avg: "$Amount" },
                totalTaxDeducted: { $sum: "$TaxDetails.taxDeducted" }
            }
        },
        { $sort: { totalAmount: -1 } }
    ]);
};

Income_Schema.statics.getMonthlyIncome = function(userID: string, year: number) {
    return this.aggregate([
        {
            $match: {
                UserID: userID,
                IsArchived: false,
                Status: "RECEIVED",
                Date: {
                    $gte: new Date(year, 0, 1),
                    $lt: new Date(year + 1, 0, 1)
                }
            }
        },
        {
            $group: {
                _id: { $month: "$Date" },
                totalAmount: { $sum: "$Amount" },
                count: { $sum: 1 },
                totalTaxDeducted: { $sum: "$TaxDetails.taxDeducted" }
            }
        },
        { $sort: { "_id": 1 } }
    ]);
};

Income_Schema.statics.getPendingIncome = function(userID: string) {
    return this.find({
        UserID: userID,
        Status: { $in: ["EXPECTED", "PENDING", "OVERDUE"] },
        IsArchived: false
    }).sort({ DueDate: 1 });
};

Income_Schema.statics.getTaxSummary = function(userID: string, taxYear: number) {
    return this.aggregate([
        {
            $match: {
                UserID: userID,
                "TaxDetails.taxYear": taxYear,
                Status: "RECEIVED",
                IsArchived: false
            }
        },
        {
            $group: {
                _id: "$TaxDetails.taxCategory",
                totalIncome: { $sum: "$Amount" },
                totalTaxDeducted: { $sum: "$TaxDetails.taxDeducted" },
                count: { $sum: 1 }
            }
        }
    ]);
};

export interface IIncome extends mongoose.Document {
    IncomeID: string;
    Title: string;
    Description?: string;
    Amount: number;
    Currency: "INR" | "USD" | "EUR" | "GBP" | "AUD" | "CAD" | "JPY" | "CNY";
    Category: IncomeCategory;
    SubCategory?: string;
    Tags?: string[];
    Date: Date;
    PaymentMethod: PaymentMethod;
    WalletID?: string;
    TransactionID?: string;
    Source?: {
        name?: string;
        type?: "EMPLOYER" | "CLIENT" | "CUSTOMER" | "PLATFORM" | "INVESTMENT" | "OTHER";
        contactInfo?: {
            email?: string;
            phone?: string;
            website?: string;
        };
        address?: string;
        taxID?: string;
    };
    ProjectDetails?: {
        projectName?: string;
        projectID?: string;
        hoursWorked?: number;
        hourlyRate?: number;
        milestoneCompleted?: string;
    };
    InvoiceNumber?: string;
    InvoiceDate?: Date;
    DueDate?: Date;
    Documents?: Array<{
        type?: "INVOICE" | "CONTRACT" | "RECEIPT" | "TAX_DOCUMENT" | "OTHER";
        filename?: string;
        url?: string;
        uploadDate?: Date;
    }>;
    IsRecurring?: boolean;
    Recurrence?: {
        type?: RecurrenceType;
        interval?: number;
        endDate?: Date;
        nextExpectedDate?: Date;
    };
    TaxDetails?: {
        isTaxable?: boolean;
        taxRate?: number;
        taxDeducted?: number;
        netAmount?: number;
        taxYear?: number;
        taxCategory?: "SALARY" | "BUSINESS" | "CAPITAL_GAINS" | "OTHER_SOURCES";
    };
    UserID: string;
    OrganizationID?: string;
    Status?: "EXPECTED" | "RECEIVED" | "PENDING" | "OVERDUE" | "CANCELLED";
    IsVerified?: boolean;
    PerformanceMetrics?: {
        conversionRate?: number;
        roi?: number;
        profitMargin?: number;
        clientSatisfactionScore?: number;
    };
    Notes?: string;
    Priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    IsArchived?: boolean;
    
    // Methods
    calculateNextRecurrence(): Date | null;
    calculateNetAmount(): number;
}

export interface IIncomeModel extends mongoose.Model<IIncome> {
    getIncomeByCategory(userID: string, startDate?: Date, endDate?: Date): Promise<any[]>;
    getMonthlyIncome(userID: string, year: number): Promise<any[]>;
    getPendingIncome(userID: string): Promise<IIncome[]>;
    getTaxSummary(userID: string, taxYear: number): Promise<any[]>;
}

export const Income_Model: IIncomeModel = 
    (mongoose.models?.Income as IIncomeModel) ||
    mongoose.model<IIncome, IIncomeModel>("Income", Income_Schema);
