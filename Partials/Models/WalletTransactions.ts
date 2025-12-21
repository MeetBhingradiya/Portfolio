import mongoose from "mongoose";
import { v4 } from "uuid";
import { Currency } from "../Types/Currency";
import { ExpenseCategory, IncomeCategory, PaymentMethod } from "./index";

// Enhanced transaction model that bridges wallet transactions with expense/income tracking
const WalletTransactions_Schema: mongoose.Schema = new mongoose.Schema(
    {
        TransactionID: {
            type: String,
            default: v4,
            unique: true
        },
        Date: {
            type: Date,
            default: Date.now
        },
        Time: {
            type: String,
            default: () => new Date().toLocaleTimeString()
        },
        FromWalletID: {
            type: String,
            required: true
        },
        ToWalletID: {
            type: String
        },
        Amount: {
            type: Number,
            required: true
        },
        Currency: {
            type: String,
            default: Currency.INR
        },
        Title: {
            type: String,
            required: true
        },
        Description: {
            type: String
        },
        Type: {
            type: String,
            enum: ["DEBIT", "CREDIT", "TRANSFER", "REVERT"],
            default: "DEBIT"
        },
        Status: {
            type: String,
            enum: ["PENDING", "COMPLETED", "FAILED", "DECLINED"],
            default: "PENDING"
        },
        ReferenceID: {
            type: String,
            required: true
        },

        // Financial tracking fields
        FinancialType: {
            type: String,
            enum: ["EXPENSE", "INCOME", "TRANSFER", "ADJUSTMENT"],
            required: true
        },
        Category: {
            type: String,
            required: function (this: any) {
                return this.FinancialType === "EXPENSE" || this.FinancialType === "INCOME";
            }
        },
        PaymentMethod: {
            type: String,
            enum: Object.values(PaymentMethod),
            required: true
        },

        // Expense specific fields
        Vendor: {
            name: String,
            category: String,
            contact: String
        },
        Location: {
            name: String,
            address: String,
            city: String,
            coordinates: {
                lat: Number,
                lng: Number
            }
        },

        // Income specific fields
        Source: {
            name: String,
            type: String,
            reference: String
        },
        Tax: {
            isTaxable: {
                type: Boolean,
                default: false
            },
            taxDeducted: {
                type: Number,
                default: 0
            },
            taxRate: {
                type: Number,
                default: 0
            }
        },

        // Common fields
        Tags: [{
            type: String
        }],
        isRecurring: {
            type: Boolean,
            default: false
        },
        RecurringPattern: {
            frequency: {
                type: String,
                enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]
            },
            interval: Number,
            endDate: Date
        },

        UserID: {
            type: String,
            required: true
        },
        isArchived: {
            type: Boolean,
            default: false
        },

        // Budget tracking
        BudgetID: {
            type: String
        },

        // Receipt/Attachment
        Attachments: [{
            filename: String,
            url: String,
            type: String
        }]
    },
    {
        timestamps: true,
        versionKey: "v1"
    }
);

// Indexes for better performance
WalletTransactions_Schema.index({ UserID: 1, Date: -1 });
WalletTransactions_Schema.index({ FromWalletID: 1, Date: -1 });
WalletTransactions_Schema.index({ ToWalletID: 1, Date: -1 });
WalletTransactions_Schema.index({ FinancialType: 1, Category: 1 });
WalletTransactions_Schema.index({ Status: 1, Type: 1 });

export interface IWalletTransactions extends mongoose.Document {
    TransactionID: string;
    Date: Date;
    Time: string;
    FromWalletID: string;
    ToWalletID?: string;
    Amount: number;
    Currency: Currency;
    Title: string;
    Description?: string;
    Type: "DEBIT" | "CREDIT" | "TRANSFER" | "REVERT";
    Status: "PENDING" | "COMPLETED" | "FAILED" | "DECLINED";
    ReferenceID: string;

    // Financial tracking
    FinancialType: "EXPENSE" | "INCOME" | "TRANSFER" | "ADJUSTMENT";
    Category?: ExpenseCategory | IncomeCategory;
    PaymentMethod: PaymentMethod;

    // Expense fields
    Vendor?: {
        name?: string;
        category?: string;
        contact?: string;
    };
    Location?: {
        name?: string;
        address?: string;
        city?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    };

    // Income fields
    Source?: {
        name?: string;
        type?: string;
        reference?: string;
    };
    Tax?: {
        isTaxable?: boolean;
        taxDeducted?: number;
        taxRate?: number;
    };

    // Common
    Tags?: string[];
    isRecurring?: boolean;
    RecurringPattern?: {
        frequency?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
        interval?: number;
        endDate?: Date;
    };

    UserID: string;
    isArchived?: boolean;
    BudgetID?: string;
    Attachments?: Array<{
        filename?: string;
        url?: string;
        type?: string;
    }>;
}

export const WalletTransactions_Model: mongoose.Model<IWalletTransactions> =
    mongoose.models?.WalletTransactions ||
    mongoose.model<IWalletTransactions>("WalletTransactions", WalletTransactions_Schema);
