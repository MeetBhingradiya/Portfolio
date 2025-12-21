import mongoose from "mongoose";
import { v4 } from "uuid";

// Categories for expenses and income
export enum ExpenseCategory {
    // Personal Expenses
    FOOD_DINING = "FOOD_DINING",
    TRANSPORTATION = "TRANSPORTATION",
    HOUSING_RENT = "HOUSING_RENT",
    UTILITIES = "UTILITIES",
    ENTERTAINMENT = "ENTERTAINMENT",
    HEALTHCARE = "HEALTHCARE",
    EDUCATION = "EDUCATION",
    SHOPPING = "SHOPPING",
    TRAVEL = "TRAVEL",
    SUBSCRIPTIONS = "SUBSCRIPTIONS",
    INSURANCE = "INSURANCE",
    PERSONAL_CARE = "PERSONAL_CARE",
    
    // Business Expenses
    OFFICE_SUPPLIES = "OFFICE_SUPPLIES",
    MARKETING = "MARKETING",
    EQUIPMENT = "EQUIPMENT",
    SOFTWARE_LICENSES = "SOFTWARE_LICENSES",
    PROFESSIONAL_SERVICES = "PROFESSIONAL_SERVICES",
    BUSINESS_TRAVEL = "BUSINESS_TRAVEL",
    HOSTING_SERVERS = "HOSTING_SERVERS",
    DOMAIN_REGISTRATION = "DOMAIN_REGISTRATION",
    
    // Other
    MISCELLANEOUS = "MISCELLANEOUS",
    EMERGENCY = "EMERGENCY"
}

export enum IncomeCategory {
    // Primary Income
    SALARY = "SALARY",
    FREELANCE = "FREELANCE",
    CONSULTING = "CONSULTING",
    BUSINESS_REVENUE = "BUSINESS_REVENUE",
    
    // Investment Income
    DIVIDENDS = "DIVIDENDS",
    INTEREST = "INTEREST",
    CAPITAL_GAINS = "CAPITAL_GAINS",
    RENTAL_INCOME = "RENTAL_INCOME",
    
    // Other Income
    GIFTS = "GIFTS",
    REFUNDS = "REFUNDS",
    CASHBACK = "CASHBACK",
    BONUSES = "BONUSES",
    SIDE_HUSTLE = "SIDE_HUSTLE",
    
    // Digital Income
    AD_REVENUE = "AD_REVENUE",
    AFFILIATE_MARKETING = "AFFILIATE_MARKETING",
    COURSE_SALES = "COURSE_SALES",
    APP_SALES = "APP_SALES",
    
    MISCELLANEOUS = "MISCELLANEOUS"
}

export enum PaymentMethod {
    CASH = "CASH",
    DEBIT_CARD = "DEBIT_CARD",
    CREDIT_CARD = "CREDIT_CARD",
    UPI = "UPI",
    NET_BANKING = "NET_BANKING",
    DIGITAL_WALLET = "DIGITAL_WALLET",
    BANK_TRANSFER = "BANK_TRANSFER",
    CHEQUE = "CHEQUE",
    CRYPTOCURRENCY = "CRYPTOCURRENCY",
    OTHER = "OTHER"
}

export enum RecurrenceType {
    NONE = "NONE",
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    QUARTERLY = "QUARTERLY",
    YEARLY = "YEARLY"
}

const Expenses_Schema: mongoose.Schema = new mongoose.Schema(
    {
        ExpenseID: {
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
            enum: Object.values(ExpenseCategory),
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
        
        // Location & Context
        Location: {
            name: { type: String },
            address: { type: String },
            coordinates: {
                latitude: { type: Number },
                longitude: { type: Number }
            }
        },
        
        // Vendor/Merchant Details
        Vendor: {
            name: { type: String },
            category: { type: String },
            website: { type: String },
            phone: { type: String }
        },
        
        // Receipt & Documentation
        Receipts: [{
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
            interval: { type: Number, default: 1 }, // Every X days/weeks/months
            endDate: { type: Date },
            nextDueDate: { type: Date }
        },
        
        // Budget Tracking
        BudgetID: {
            type: String,
            ref: "Budgets"
        },
        IsPlanned: {
            type: Boolean,
            default: false
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
        
        // Status & Flags
        IsVerified: {
            type: Boolean,
            default: false
        },
        IsTaxDeductible: {
            type: Boolean,
            default: false
        },
        IsReimbursable: {
            type: Boolean,
            default: false
        },
        ReimbursementStatus: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED", "PAID"],
            default: "PENDING"
        },
        
        // Analytics
        Notes: {
            type: String,
            trim: true
        },
        Priority: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
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
Expenses_Schema.index({ UserID: 1, Date: -1 });
Expenses_Schema.index({ Category: 1, Date: -1 });
Expenses_Schema.index({ WalletID: 1 });
Expenses_Schema.index({ IsRecurring: 1, "Recurrence.nextDueDate": 1 });

// Instance methods
Expenses_Schema.methods.calculateNextRecurrence = function() {
    if (!this.IsRecurring || this.Recurrence.type === RecurrenceType.NONE) {
        return null;
    }
    
    const currentDate = this.Recurrence.nextDueDate || this.Date;
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

// Static methods
Expenses_Schema.statics.getExpensesByCategory = function(userID: string, startDate?: Date, endDate?: Date) {
    const query: any = { UserID: userID, IsArchived: false };
    
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
                averageAmount: { $avg: "$Amount" }
            }
        },
        { $sort: { totalAmount: -1 } }
    ]);
};

Expenses_Schema.statics.getMonthlyExpenses = function(userID: string, year: number) {
    return this.aggregate([
        {
            $match: {
                UserID: userID,
                IsArchived: false,
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
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id": 1 } }
    ]);
};

export interface IExpenses extends mongoose.Document {
    ExpenseID: string;
    Title: string;
    Description?: string;
    Amount: number;
    Currency: "INR" | "USD" | "EUR" | "GBP" | "AUD" | "CAD" | "JPY" | "CNY";
    Category: ExpenseCategory;
    SubCategory?: string;
    Tags?: string[];
    Date: Date;
    PaymentMethod: PaymentMethod;
    WalletID?: string;
    TransactionID?: string;
    Location?: {
        name?: string;
        address?: string;
        coordinates?: {
            latitude?: number;
            longitude?: number;
        };
    };
    Vendor?: {
        name?: string;
        category?: string;
        website?: string;
        phone?: string;
    };
    Receipts?: Array<{
        filename?: string;
        url?: string;
        uploadDate?: Date;
    }>;
    IsRecurring?: boolean;
    Recurrence?: {
        type?: RecurrenceType;
        interval?: number;
        endDate?: Date;
        nextDueDate?: Date;
    };
    BudgetID?: string;
    IsPlanned?: boolean;
    UserID: string;
    OrganizationID?: string;
    IsVerified?: boolean;
    IsTaxDeductible?: boolean;
    IsReimbursable?: boolean;
    ReimbursementStatus?: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
    Notes?: string;
    Priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    IsArchived?: boolean;
    
    // Methods
    calculateNextRecurrence(): Date | null;
}

export interface IExpensesModel extends mongoose.Model<IExpenses> {
    getExpensesByCategory(userID: string, startDate?: Date, endDate?: Date): Promise<any[]>;
    getMonthlyExpenses(userID: string, year: number): Promise<any[]>;
}

export const Expenses_Model: IExpensesModel = 
    (mongoose.models?.Expenses as IExpensesModel) ||
    mongoose.model<IExpenses, IExpensesModel>("Expenses", Expenses_Schema);
