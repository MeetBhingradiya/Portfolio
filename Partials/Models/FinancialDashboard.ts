import mongoose from "mongoose";
import { v4 } from "uuid";

export enum DashboardPeriod {
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    QUARTERLY = "QUARTERLY",
    YEARLY = "YEARLY"
}

export enum FinancialGoalType {
    SAVINGS = "SAVINGS",
    DEBT_REDUCTION = "DEBT_REDUCTION",
    INVESTMENT = "INVESTMENT",
    EMERGENCY_FUND = "EMERGENCY_FUND",
    EXPENSE_REDUCTION = "EXPENSE_REDUCTION",
    INCOME_INCREASE = "INCOME_INCREASE"
}

const FinancialDashboard_Schema: mongoose.Schema = new mongoose.Schema(
    {
        DashboardID: {
            type: String,
            default: v4,
            unique: true,
            required: true
        },
        
        // User Details
        UserID: {
            type: String,
            required: true,
            ref: "Users"
        },
        
        // Dashboard Configuration
        Period: {
            type: String,
            enum: Object.values(DashboardPeriod),
            default: DashboardPeriod.MONTHLY
        },
        
        // Financial Summary
        Summary: {
            totalIncome: { type: Number, default: 0 },
            totalExpenses: { type: Number, default: 0 },
            netIncome: { type: Number, default: 0 },
            savings: { type: Number, default: 0 },
            savingsRate: { type: Number, default: 0 }, // Percentage
            
            // Previous period comparison
            previousPeriod: {
                totalIncome: { type: Number, default: 0 },
                totalExpenses: { type: Number, default: 0 },
                netIncome: { type: Number, default: 0 },
                savings: { type: Number, default: 0 }
            },
            
            // Growth rates
            incomeGrowth: { type: Number, default: 0 },
            expenseGrowth: { type: Number, default: 0 },
            savingsGrowth: { type: Number, default: 0 }
        },
        
        // Category Breakdowns
        ExpenseBreakdown: [{
            category: { type: String },
            amount: { type: Number },
            percentage: { type: Number },
            trend: { type: String, enum: ["UP", "DOWN", "STABLE"] }
        }],
        
        IncomeBreakdown: [{
            category: { type: String },
            amount: { type: Number },
            percentage: { type: Number },
            trend: { type: String, enum: ["UP", "DOWN", "STABLE"] }
        }],
        
        // Budget Performance
        BudgetPerformance: {
            totalBudgets: { type: Number, default: 0 },
            activeBudgets: { type: Number, default: 0 },
            exceededBudgets: { type: Number, default: 0 },
            averageUtilization: { type: Number, default: 0 },
            
            topPerformingBudgets: [{
                budgetID: { type: String },
                name: { type: String },
                utilizationRate: { type: Number }
            }],
            
            underPerformingBudgets: [{
                budgetID: { type: String },
                name: { type: String },
                utilizationRate: { type: Number }
            }]
        },
        
        // Financial Goals
        Goals: [{
            goalID: { type: String, default: v4 },
            type: {
                type: String,
                enum: Object.values(FinancialGoalType)
            },
            title: { type: String, required: true },
            description: { type: String },
            targetAmount: { type: Number, required: true },
            currentAmount: { type: Number, default: 0 },
            targetDate: { type: Date },
            isCompleted: { type: Boolean, default: false },
            priority: {
                type: String,
                enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
                default: "MEDIUM"
            },
            progress: { type: Number, default: 0 }, // Percentage
            monthlyContribution: { type: Number, default: 0 }
        }],
        
        // Cash Flow Analysis
        CashFlow: {
            weeklyFlow: [{
                week: { type: Date },
                income: { type: Number },
                expenses: { type: Number },
                netFlow: { type: Number }
            }],
            
            monthlyFlow: [{
                month: { type: Date },
                income: { type: Number },
                expenses: { type: Number },
                netFlow: { type: Number }
            }],
            
            predictedFlow: [{
                period: { type: Date },
                predictedIncome: { type: Number },
                predictedExpenses: { type: Number },
                predictedNetFlow: { type: Number }
            }]
        },
        
        // Key Financial Metrics
        Metrics: {
            // Liquidity Ratios
            emergencyFundRatio: { type: Number, default: 0 }, // Months of expenses covered
            liquidityRatio: { type: Number, default: 0 },
            
            // Debt Ratios
            debtToIncomeRatio: { type: Number, default: 0 },
            debtServiceRatio: { type: Number, default: 0 },
            
            // Investment Metrics
            investmentToIncomeRatio: { type: Number, default: 0 },
            portfolioValue: { type: Number, default: 0 },
            
            // Spending Patterns
            fixedExpenseRatio: { type: Number, default: 0 },
            variableExpenseRatio: { type: Number, default: 0 },
            discretionarySpending: { type: Number, default: 0 }
        },
        
        // Alerts & Insights
        Alerts: [{
            type: {
                type: String,
                enum: ["WARNING", "CRITICAL", "INFO", "SUCCESS"]
            },
            title: { type: String },
            message: { type: String },
            category: { type: String },
            isRead: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now },
            actionRequired: { type: Boolean, default: false }
        }],
        
        // AI Insights & Recommendations
        Insights: [{
            type: {
                type: String,
                enum: ["SPENDING_PATTERN", "SAVINGS_OPPORTUNITY", "BUDGET_OPTIMIZATION", "INCOME_TREND", "INVESTMENT_ADVICE"]
            },
            title: { type: String },
            description: { type: String },
            confidence: { type: Number, min: 0, max: 100 }, // AI confidence level
            impact: {
                type: String,
                enum: ["LOW", "MEDIUM", "HIGH"]
            },
            potentialSavings: { type: Number },
            actionItems: [{ type: String }],
            isImplemented: { type: Boolean, default: false },
            generatedAt: { type: Date, default: Date.now }
        }],
        
        // User Preferences
        Preferences: {
            currency: {
                type: String,
                enum: ["INR", "USD", "EUR", "GBP", "AUD", "CAD", "JPY", "CNY"],
                default: "INR"
            },
            dashboardTheme: {
                type: String,
                enum: ["LIGHT", "DARK", "AUTO"],
                default: "AUTO"
            },
            defaultPeriod: {
                type: String,
                enum: Object.values(DashboardPeriod),
                default: DashboardPeriod.MONTHLY
            },
            enablePredictions: { type: Boolean, default: true },
            enableAlerts: { type: Boolean, default: true },
            alertFrequency: {
                type: String,
                enum: ["REAL_TIME", "DAILY", "WEEKLY"],
                default: "DAILY"
            }
        },
        
        // Last Updated Tracking
        LastUpdated: {
            expenses: { type: Date },
            income: { type: Date },
            budgets: { type: Date },
            goals: { type: Date },
            calculations: { type: Date }
        }
    },
    {
        timestamps: true,
        versionKey: "v1"
    }
);

// Indexes for better performance
FinancialDashboard_Schema.index({ UserID: 1 }, { unique: true });
FinancialDashboard_Schema.index({ Period: 1 });
FinancialDashboard_Schema.index({ "LastUpdated.calculations": 1 });

// Instance methods
FinancialDashboard_Schema.methods.calculateSummary = async function() {
    // This would integrate with Expenses and Income models to calculate current period summary
    // Implementation would depend on the actual data aggregation needs
    const now = new Date();
    const startOfPeriod = this.getStartOfPeriod(now);
    const endOfPeriod = this.getEndOfPeriod(now);
    
    // Calculate totals (would need to import and use Expenses_Model and Income_Model)
    // This is a simplified version - actual implementation would use aggregation pipelines
    
    this.LastUpdated.calculations = now;
    return this.save();
};

FinancialDashboard_Schema.methods.getStartOfPeriod = function(date: Date) {
    const d = new Date(date);
    
    switch (this.Period) {
        case DashboardPeriod.DAILY:
            d.setHours(0, 0, 0, 0);
            break;
        case DashboardPeriod.WEEKLY:
            d.setDate(d.getDate() - d.getDay());
            d.setHours(0, 0, 0, 0);
            break;
        case DashboardPeriod.MONTHLY:
            d.setDate(1);
            d.setHours(0, 0, 0, 0);
            break;
        case DashboardPeriod.QUARTERLY:
            const quarter = Math.floor(d.getMonth() / 3);
            d.setMonth(quarter * 3, 1);
            d.setHours(0, 0, 0, 0);
            break;
        case DashboardPeriod.YEARLY:
            d.setMonth(0, 1);
            d.setHours(0, 0, 0, 0);
            break;
    }
    
    return d;
};

FinancialDashboard_Schema.methods.getEndOfPeriod = function(date: Date) {
    const d = this.getStartOfPeriod(date);
    
    switch (this.Period) {
        case DashboardPeriod.DAILY:
            d.setDate(d.getDate() + 1);
            break;
        case DashboardPeriod.WEEKLY:
            d.setDate(d.getDate() + 7);
            break;
        case DashboardPeriod.MONTHLY:
            d.setMonth(d.getMonth() + 1);
            break;
        case DashboardPeriod.QUARTERLY:
            d.setMonth(d.getMonth() + 3);
            break;
        case DashboardPeriod.YEARLY:
            d.setFullYear(d.getFullYear() + 1);
            break;
    }
    
    d.setMilliseconds(d.getMilliseconds() - 1);
    return d;
};

FinancialDashboard_Schema.methods.addAlert = function(type: string, title: string, message: string, category?: string) {
    this.Alerts.push({
        type,
        title,
        message,
        category: category || "GENERAL",
        isRead: false,
        createdAt: new Date(),
        actionRequired: type === "CRITICAL"
    });
    
    return this.save();
};

FinancialDashboard_Schema.methods.addInsight = function(insight: any) {
    this.Insights.push({
        ...insight,
        generatedAt: new Date(),
        isImplemented: false
    });
    
    return this.save();
};

// Static methods
FinancialDashboard_Schema.statics.getOrCreateDashboard = async function(userID: string) {
    let dashboard = await this.findOne({ UserID: userID });
    
    if (!dashboard) {
        dashboard = new this({
            UserID: userID,
            Period: DashboardPeriod.MONTHLY,
            Summary: {
                totalIncome: 0,
                totalExpenses: 0,
                netIncome: 0,
                savings: 0,
                savingsRate: 0
            }
        });
        await dashboard.save();
    }
    
    return dashboard;
};

export interface IFinancialDashboard extends mongoose.Document {
    DashboardID: string;
    UserID: string;
    Period: DashboardPeriod;
    Summary: {
        totalIncome: number;
        totalExpenses: number;
        netIncome: number;
        savings: number;
        savingsRate: number;
        previousPeriod?: {
            totalIncome: number;
            totalExpenses: number;
            netIncome: number;
            savings: number;
        };
        incomeGrowth?: number;
        expenseGrowth?: number;
        savingsGrowth?: number;
    };
    ExpenseBreakdown?: Array<{
        category: string;
        amount: number;
        percentage: number;
        trend: "UP" | "DOWN" | "STABLE";
    }>;
    IncomeBreakdown?: Array<{
        category: string;
        amount: number;
        percentage: number;
        trend: "UP" | "DOWN" | "STABLE";
    }>;
    BudgetPerformance?: {
        totalBudgets: number;
        activeBudgets: number;
        exceededBudgets: number;
        averageUtilization: number;
        topPerformingBudgets?: Array<{
            budgetID: string;
            name: string;
            utilizationRate: number;
        }>;
        underPerformingBudgets?: Array<{
            budgetID: string;
            name: string;
            utilizationRate: number;
        }>;
    };
    Goals?: Array<{
        goalID: string;
        type: FinancialGoalType;
        title: string;
        description?: string;
        targetAmount: number;
        currentAmount: number;
        targetDate?: Date;
        isCompleted: boolean;
        priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        progress: number;
        monthlyContribution: number;
    }>;
    Preferences?: {
        currency: "INR" | "USD" | "EUR" | "GBP" | "AUD" | "CAD" | "JPY" | "CNY";
        dashboardTheme: "LIGHT" | "DARK" | "AUTO";
        defaultPeriod: DashboardPeriod;
        enablePredictions: boolean;
        enableAlerts: boolean;
        alertFrequency: "REAL_TIME" | "DAILY" | "WEEKLY";
    };
    
    // Methods
    calculateSummary(): Promise<IFinancialDashboard>;
    getStartOfPeriod(date: Date): Date;
    getEndOfPeriod(date: Date): Date;
    addAlert(type: string, title: string, message: string, category?: string): Promise<IFinancialDashboard>;
    addInsight(insight: any): Promise<IFinancialDashboard>;
}

export interface IFinancialDashboardModel extends mongoose.Model<IFinancialDashboard> {
    getOrCreateDashboard(userID: string): Promise<IFinancialDashboard>;
}

export const FinancialDashboard_Model: IFinancialDashboardModel = 
    (mongoose.models?.FinancialDashboard as IFinancialDashboardModel) ||
    mongoose.model<IFinancialDashboard, IFinancialDashboardModel>("FinancialDashboard", FinancialDashboard_Schema);
