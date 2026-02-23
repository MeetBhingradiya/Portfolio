import mongoose from "mongoose";
import { v4 } from "uuid";
import { ExpenseCategory, IncomeCategory } from "./Expenses";

export enum BudgetPeriod {
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    QUARTERLY = "QUARTERLY",
    YEARLY = "YEARLY",
    CUSTOM = "CUSTOM"
}

export enum BudgetStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    COMPLETED = "COMPLETED",
    EXCEEDED = "EXCEEDED"
}

export enum AlertType {
    EMAIL = "EMAIL",
    SMS = "SMS",
    PUSH_NOTIFICATION = "PUSH_NOTIFICATION",
    IN_APP = "IN_APP"
}

const Budgets_Schema: mongoose.Schema = new mongoose.Schema(
    {
        BudgetID: {
            type: String,
            default: v4,
            unique: true,
            required: true
        },
        
        // Basic Details
        Name: {
            type: String,
            required: true,
            trim: true
        },
        Description: {
            type: String,
            trim: true
        },
        
        // Budget Configuration
        TotalAmount: {
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
        
        // Period Configuration
        Period: {
            type: String,
            enum: Object.values(BudgetPeriod),
            required: true
        },
        StartDate: {
            type: Date,
            required: true
        },
        EndDate: {
            type: Date,
            required: true
        },
        
        // Category Allocation
        Categories: [{
            category: {
                type: String,
                enum: [...Object.values(ExpenseCategory), ...Object.values(IncomeCategory)],
                required: true
            },
            allocatedAmount: {
                type: Number,
                required: true,
                min: 0
            },
            spentAmount: {
                type: Number,
                default: 0
            },
            remainingAmount: {
                type: Number,
                default: 0
            }
        }],
        
        // Progress Tracking
        SpentAmount: {
            type: Number,
            default: 0
        },
        RemainingAmount: {
            type: Number,
            default: 0
        },
        PercentageUsed: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        
        // Status
        Status: {
            type: String,
            enum: Object.values(BudgetStatus),
            default: BudgetStatus.ACTIVE
        },
        
        // Alerts & Notifications
        AlertSettings: {
            enableAlerts: { type: Boolean, default: true },
            alertThresholds: [{
                percentage: { type: Number, min: 0, max: 100 },
                alertTypes: [{
                    type: String,
                    enum: Object.values(AlertType)
                }],
                isTriggered: { type: Boolean, default: false }
            }],
            customMessage: { type: String }
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
        
        // Sharing & Collaboration
        SharedWith: [{
            userID: { type: String, ref: "Users" },
            permissions: {
                canView: { type: Boolean, default: true },
                canEdit: { type: Boolean, default: false },
                canDelete: { type: Boolean, default: false }
            },
            sharedDate: { type: Date, default: Date.now }
        }],
        
        // Auto-Reset for Recurring Budgets
        AutoReset: {
            enabled: { type: Boolean, default: false },
            resetDay: { type: Number, min: 1, max: 31 }, // For monthly budgets
            carryOverRemaining: { type: Boolean, default: false }
        },
        
        // Analytics & Insights
        HistoricalData: [{
            period: {
                startDate: { type: Date },
                endDate: { type: Date }
            },
            totalSpent: { type: Number },
            totalBudget: { type: Number },
            percentageUsed: { type: Number },
            topCategories: [{
                category: { type: String },
                amount: { type: Number }
            }]
        }],
        
        // Goals & Targets
        SavingsGoal: {
            targetAmount: { type: Number },
            currentSaved: { type: Number, default: 0 },
            targetDate: { type: Date }
        },
        
        // Notes & Tags
        Notes: {
            type: String,
            trim: true
        },
        Tags: [{
            type: String,
            trim: true
        }],
        
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
Budgets_Schema.index({ UserID: 1, Status: 1 });
Budgets_Schema.index({ StartDate: 1, EndDate: 1 });
Budgets_Schema.index({ Period: 1, Status: 1 });

// Pre-save middleware to calculate remaining amount and percentage
Budgets_Schema.pre('save', function(next) {
    const doc = this as any;
    doc.RemainingAmount = doc.TotalAmount - doc.SpentAmount;
    doc.PercentageUsed = doc.TotalAmount > 0 ? (doc.SpentAmount / doc.TotalAmount) * 100 : 0;
    
    // Update status based on spending
    if (doc.SpentAmount >= doc.TotalAmount) {
        doc.Status = BudgetStatus.EXCEEDED;
    } else if (new Date() > doc.EndDate) {
        doc.Status = BudgetStatus.COMPLETED;
    }
    
    next();
});

// Instance methods
Budgets_Schema.methods.updateSpentAmount = function(expenseAmount: number, category?: string) {
    this.SpentAmount += expenseAmount;
    
    if (category) {
        const categoryBudget = this.Categories.find((cat: any) => cat.category === category);
        if (categoryBudget) {
            categoryBudget.spentAmount += expenseAmount;
            categoryBudget.remainingAmount = categoryBudget.allocatedAmount - categoryBudget.spentAmount;
        }
    }
    
    this.RemainingAmount = this.TotalAmount - this.SpentAmount;
    this.PercentageUsed = this.TotalAmount > 0 ? (this.SpentAmount / this.TotalAmount) * 100 : 0;
    
    return this.save();
};

Budgets_Schema.methods.checkAlertThresholds = function() {
    const triggeredAlerts: any[] = [];
    
    if (this.AlertSettings?.enableAlerts && this.AlertSettings.alertThresholds) {
        this.AlertSettings.alertThresholds.forEach((threshold: any) => {
            if (this.PercentageUsed >= threshold.percentage && !threshold.isTriggered) {
                threshold.isTriggered = true;
                triggeredAlerts.push({
                    percentage: threshold.percentage,
                    alertTypes: threshold.alertTypes,
                    currentUsage: this.PercentageUsed,
                    budgetName: this.Name
                });
            }
        });
    }
    
    return triggeredAlerts;
};

Budgets_Schema.methods.resetBudget = function() {
    // Store historical data
    this.HistoricalData.push({
        period: {
            startDate: this.StartDate,
            endDate: this.EndDate
        },
        totalSpent: this.SpentAmount,
        totalBudget: this.TotalAmount,
        percentageUsed: this.PercentageUsed,
        topCategories: this.Categories.map((cat: any) => ({
            category: cat.category,
            amount: cat.spentAmount
        })).sort((a: any, b: any) => b.amount - a.amount).slice(0, 5)
    });
    
    // Reset amounts
    this.SpentAmount = 0;
    this.RemainingAmount = this.TotalAmount;
    this.PercentageUsed = 0;
    this.Status = BudgetStatus.ACTIVE;
    
    // Reset category amounts
    this.Categories.forEach((cat: any) => {
        cat.spentAmount = 0;
        cat.remainingAmount = cat.allocatedAmount;
    });
    
    // Reset alert triggers
    if (this.AlertSettings?.alertThresholds) {
        this.AlertSettings.alertThresholds.forEach((threshold: any) => {
            threshold.isTriggered = false;
        });
    }
    
    // Update dates for next period
    const periodLength = this.EndDate.getTime() - this.StartDate.getTime();
    this.StartDate = new Date();
    this.EndDate = new Date(this.StartDate.getTime() + periodLength);
    
    return this.save();
};

// Static methods
Budgets_Schema.statics.getActiveBudgets = function(userID: string) {
    return this.find({
        UserID: userID,
        Status: BudgetStatus.ACTIVE,
        StartDate: { $lte: new Date() },
        EndDate: { $gte: new Date() },
        IsArchived: false
    });
};

Budgets_Schema.statics.getBudgetSummary = function(userID: string) {
    return this.aggregate([
        {
            $match: {
                UserID: userID,
                IsArchived: false
            }
        },
        {
            $group: {
                _id: "$Status",
                count: { $sum: 1 },
                totalBudget: { $sum: "$TotalAmount" },
                totalSpent: { $sum: "$SpentAmount" }
            }
        }
    ]);
};

Budgets_Schema.statics.getBudgetsNearingLimit = function(userID: string, threshold: number = 80) {
    return this.find({
        UserID: userID,
        Status: BudgetStatus.ACTIVE,
        PercentageUsed: { $gte: threshold },
        IsArchived: false
    });
};

export interface IBudgets extends mongoose.Document {
    BudgetID: string;
    Name: string;
    Description?: string;
    TotalAmount: number;
    Currency: "INR" | "USD" | "EUR" | "GBP" | "AUD" | "CAD" | "JPY" | "CNY";
    Period: BudgetPeriod;
    StartDate: Date;
    EndDate: Date;
    Categories?: Array<{
        category: ExpenseCategory | IncomeCategory;
        allocatedAmount: number;
        spentAmount?: number;
        remainingAmount?: number;
    }>;
    SpentAmount?: number;
    RemainingAmount?: number;
    PercentageUsed?: number;
    Status?: BudgetStatus;
    AlertSettings?: {
        enableAlerts?: boolean;
        alertThresholds?: Array<{
            percentage?: number;
            alertTypes?: AlertType[];
            isTriggered?: boolean;
        }>;
        customMessage?: string;
    };
    UserID: string;
    OrganizationID?: string;
    SharedWith?: Array<{
        userID?: string;
        permissions?: {
            canView?: boolean;
            canEdit?: boolean;
            canDelete?: boolean;
        };
        sharedDate?: Date;
    }>;
    AutoReset?: {
        enabled?: boolean;
        resetDay?: number;
        carryOverRemaining?: boolean;
    };
    HistoricalData?: Array<{
        period?: {
            startDate?: Date;
            endDate?: Date;
        };
        totalSpent?: number;
        totalBudget?: number;
        percentageUsed?: number;
        topCategories?: Array<{
            category?: string;
            amount?: number;
        }>;
    }>;
    SavingsGoal?: {
        targetAmount?: number;
        currentSaved?: number;
        targetDate?: Date;
    };
    Notes?: string;
    Tags?: string[];
    IsArchived?: boolean;
    
    // Methods
    updateSpentAmount(expenseAmount: number, category?: string): Promise<IBudgets>;
    checkAlertThresholds(): any[];
    resetBudget(): Promise<IBudgets>;
}

export interface IBudgetsModel extends mongoose.Model<IBudgets> {
    getActiveBudgets(userID: string): Promise<IBudgets[]>;
    getBudgetSummary(userID: string): Promise<any[]>;
    getBudgetsNearingLimit(userID: string, threshold?: number): Promise<IBudgets[]>;
}

export const Budgets_Model: IBudgetsModel = 
    (mongoose.models?.Budgets as IBudgetsModel) ||
    mongoose.model<IBudgets, IBudgetsModel>("Budgets", Budgets_Schema);
