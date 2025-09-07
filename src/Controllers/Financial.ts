import { 
    Expenses_Model, IExpenses, ExpenseCategory, 
    Income_Model, IIncome, IncomeCategory,
    Budgets_Model, IBudgets, BudgetPeriod,
    FinancialDashboard_Model, IFinancialDashboard,
    PaymentMethod, RecurrenceType
} from "@Models/index";

export class FinancialController {
    
    // ===============================
    // EXPENSE MANAGEMENT
    // ===============================
    
    /**
     * Create a new expense entry
     */
    static async createExpense(expenseData: {
        userID: string;
        title: string;
        amount: number;
        category: ExpenseCategory;
        paymentMethod: PaymentMethod;
        description?: string;
        date?: Date;
        tags?: string[];
        walletID?: string;
        location?: any;
        vendor?: any;
        isRecurring?: boolean;
        recurrence?: any;
    }): Promise<IExpenses> {
        try {
            const expense = new Expenses_Model({
                UserID: expenseData.userID,
                Title: expenseData.title,
                Amount: expenseData.amount,
                Category: expenseData.category,
                PaymentMethod: expenseData.paymentMethod,
                Description: expenseData.description,
                Date: expenseData.date || new Date(),
                Tags: expenseData.tags || [],
                WalletID: expenseData.walletID,
                Location: expenseData.location,
                Vendor: expenseData.vendor,
                IsRecurring: expenseData.isRecurring || false,
                Recurrence: expenseData.recurrence
            });

            const savedExpense = await expense.save();

            // Update related budget if applicable
            await this.updateBudgetOnExpense(expenseData.userID, expenseData.amount, expenseData.category);

            // Update financial dashboard
            await this.updateDashboardMetrics(expenseData.userID);

            return savedExpense;
        } catch (error) {
            throw new Error(`Failed to create expense: ${error}`);
        }
    }

    /**
     * Get expenses with filtering and pagination
     */
    static async getExpenses(userID: string, filters: {
        category?: ExpenseCategory;
        startDate?: Date;
        endDate?: Date;
        paymentMethod?: PaymentMethod;
        minAmount?: number;
        maxAmount?: number;
        tags?: string[];
        page?: number;
        limit?: number;
    } = {}): Promise<{ expenses: IExpenses[], total: number, page: number, totalPages: number }> {
        try {
            const query: any = { UserID: userID, IsArchived: false };
            
            // Apply filters
            if (filters.category) query.Category = filters.category;
            if (filters.paymentMethod) query.PaymentMethod = filters.paymentMethod;
            if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
                query.Amount = {};
                if (filters.minAmount !== undefined) query.Amount.$gte = filters.minAmount;
                if (filters.maxAmount !== undefined) query.Amount.$lte = filters.maxAmount;
            }
            if (filters.startDate || filters.endDate) {
                query.Date = {};
                if (filters.startDate) query.Date.$gte = filters.startDate;
                if (filters.endDate) query.Date.$lte = filters.endDate;
            }
            if (filters.tags && filters.tags.length > 0) {
                query.Tags = { $in: filters.tags };
            }

            const page = filters.page || 1;
            const limit = filters.limit || 20;
            const skip = (page - 1) * limit;

            const [expenses, total] = await Promise.all([
                Expenses_Model.find(query)
                    .sort({ Date: -1 })
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                Expenses_Model.countDocuments(query)
            ]);

            return {
                expenses,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            throw new Error(`Failed to get expenses: ${error}`);
        }
    }

    /**
     * Get expense analytics
     */
    static async getExpenseAnalytics(userID: string, period: 'month' | 'quarter' | 'year' = 'month') {
        try {
            const now = new Date();
            let startDate: Date;

            switch (period) {
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'quarter':
                    const quarter = Math.floor(now.getMonth() / 3);
                    startDate = new Date(now.getFullYear(), quarter * 3, 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
            }

            const [categoryBreakdown, monthlyTrends, totalSpent] = await Promise.all([
                Expenses_Model.getExpensesByCategory(userID, startDate, now),
                Expenses_Model.getMonthlyExpenses(userID, now.getFullYear()),
                Expenses_Model.aggregate([
                    {
                        $match: {
                            UserID: userID,
                            Date: { $gte: startDate, $lte: now },
                            IsArchived: false
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: "$Amount" },
                            count: { $sum: 1 },
                            average: { $avg: "$Amount" }
                        }
                    }
                ])
            ]);

            return {
                categoryBreakdown,
                monthlyTrends,
                totalSpent: totalSpent[0] || { total: 0, count: 0, average: 0 },
                period
            };
        } catch (error) {
            throw new Error(`Failed to get expense analytics: ${error}`);
        }
    }

    // ===============================
    // INCOME MANAGEMENT
    // ===============================

    /**
     * Create a new income entry
     */
    static async createIncome(incomeData: {
        userID: string;
        title: string;
        amount: number;
        category: IncomeCategory;
        paymentMethod: PaymentMethod;
        description?: string;
        date?: Date;
        source?: any;
        projectDetails?: any;
        invoiceNumber?: string;
        taxDetails?: any;
        status?: string;
    }): Promise<IIncome> {
        try {
            const income = new Income_Model({
                UserID: incomeData.userID,
                Title: incomeData.title,
                Amount: incomeData.amount,
                Category: incomeData.category,
                PaymentMethod: incomeData.paymentMethod,
                Description: incomeData.description,
                Date: incomeData.date || new Date(),
                Source: incomeData.source,
                ProjectDetails: incomeData.projectDetails,
                InvoiceNumber: incomeData.invoiceNumber,
                TaxDetails: incomeData.taxDetails,
                Status: incomeData.status || "RECEIVED"
            });

            const savedIncome = await income.save();

            // Update financial dashboard
            await this.updateDashboardMetrics(incomeData.userID);

            return savedIncome;
        } catch (error) {
            throw new Error(`Failed to create income: ${error}`);
        }
    }

    /**
     * Get income analytics
     */
    static async getIncomeAnalytics(userID: string, period: 'month' | 'quarter' | 'year' = 'month') {
        try {
            const now = new Date();
            let startDate: Date;

            switch (period) {
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'quarter':
                    const quarter = Math.floor(now.getMonth() / 3);
                    startDate = new Date(now.getFullYear(), quarter * 3, 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
            }

            const [categoryBreakdown, monthlyTrends, totalIncome, pendingIncome] = await Promise.all([
                Income_Model.getIncomeByCategory(userID, startDate, now),
                Income_Model.getMonthlyIncome(userID, now.getFullYear()),
                Income_Model.aggregate([
                    {
                        $match: {
                            UserID: userID,
                            Date: { $gte: startDate, $lte: now },
                            Status: "RECEIVED",
                            IsArchived: false
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: "$Amount" },
                            count: { $sum: 1 },
                            average: { $avg: "$Amount" }
                        }
                    }
                ]),
                Income_Model.getPendingIncome(userID)
            ]);

            return {
                categoryBreakdown,
                monthlyTrends,
                totalIncome: totalIncome[0] || { total: 0, count: 0, average: 0 },
                pendingIncome,
                period
            };
        } catch (error) {
            throw new Error(`Failed to get income analytics: ${error}`);
        }
    }

    // ===============================
    // BUDGET MANAGEMENT
    // ===============================

    /**
     * Create a new budget
     */
    static async createBudget(budgetData: {
        userID: string;
        name: string;
        totalAmount: number;
        period: BudgetPeriod;
        startDate: Date;
        endDate: Date;
        categories?: Array<{
            category: ExpenseCategory;
            allocatedAmount: number;
        }>;
        description?: string;
    }): Promise<IBudgets> {
        try {
            const budget = new Budgets_Model({
                UserID: budgetData.userID,
                Name: budgetData.name,
                TotalAmount: budgetData.totalAmount,
                Period: budgetData.period,
                StartDate: budgetData.startDate,
                EndDate: budgetData.endDate,
                Categories: budgetData.categories || [],
                Description: budgetData.description
            });

            const savedBudget = await budget.save();

            // Update financial dashboard
            await this.updateDashboardMetrics(budgetData.userID);

            return savedBudget;
        } catch (error) {
            throw new Error(`Failed to create budget: ${error}`);
        }
    }

    /**
     * Update budget when expense is made
     */
    private static async updateBudgetOnExpense(userID: string, amount: number, category: ExpenseCategory) {
        try {
            const activeBudgets = await Budgets_Model.getActiveBudgets(userID);
            
            for (const budget of activeBudgets) {
                await budget.updateSpentAmount(amount, category);
                
                // Check for alert thresholds
                const triggeredAlerts = budget.checkAlertThresholds();
                if (triggeredAlerts.length > 0) {
                    // Here you would implement alert notifications
                    console.log(`Budget alerts triggered for ${budget.Name}:`, triggeredAlerts);
                }
            }
        } catch (error) {
            console.error(`Failed to update budgets on expense: ${error}`);
        }
    }

    // ===============================
    // DASHBOARD & ANALYTICS
    // ===============================

    /**
     * Get comprehensive financial dashboard
     */
    static async getFinancialDashboard(userID: string): Promise<IFinancialDashboard> {
        try {
            const dashboard = await FinancialDashboard_Model.getOrCreateDashboard(userID);
            await dashboard.calculateSummary();
            return dashboard;
        } catch (error) {
            throw new Error(`Failed to get financial dashboard: ${error}`);
        }
    }

    /**
     * Update dashboard metrics
     */
    private static async updateDashboardMetrics(userID: string) {
        try {
            const dashboard = await FinancialDashboard_Model.getOrCreateDashboard(userID);
            await dashboard.calculateSummary();
        } catch (error) {
            console.error(`Failed to update dashboard metrics: ${error}`);
        }
    }

    /**
     * Get financial overview
     */
    static async getFinancialOverview(userID: string, period: 'month' | 'quarter' | 'year' = 'month') {
        try {
            const [expenseAnalytics, incomeAnalytics, activeBudgets, dashboard] = await Promise.all([
                this.getExpenseAnalytics(userID, period),
                this.getIncomeAnalytics(userID, period),
                Budgets_Model.getActiveBudgets(userID),
                this.getFinancialDashboard(userID)
            ]);

            const totalIncome = incomeAnalytics.totalIncome.total || 0;
            const totalExpenses = expenseAnalytics.totalSpent.total || 0;
            const netIncome = totalIncome - totalExpenses;
            const savingsRate = totalIncome > 0 ? ((netIncome / totalIncome) * 100) : 0;

            return {
                summary: {
                    totalIncome,
                    totalExpenses,
                    netIncome,
                    savingsRate,
                    period
                },
                expenses: expenseAnalytics,
                income: incomeAnalytics,
                budgets: {
                    active: activeBudgets.length,
                    budgets: activeBudgets
                },
                dashboard: dashboard.Summary
            };
        } catch (error) {
            throw new Error(`Failed to get financial overview: ${error}`);
        }
    }

    // ===============================
    // UTILITY METHODS
    // ===============================

    /**
     * Delete expense
     */
    static async deleteExpense(expenseID: string, userID: string): Promise<boolean> {
        try {
            const result = await Expenses_Model.findOneAndUpdate(
                { ExpenseID: expenseID, UserID: userID },
                { IsArchived: true },
                { new: true }
            );
            
            if (result) {
                await this.updateDashboardMetrics(userID);
                return true;
            }
            return false;
        } catch (error) {
            throw new Error(`Failed to delete expense: ${error}`);
        }
    }

    /**
     * Update expense
     */
    static async updateExpense(expenseID: string, userID: string, updateData: Partial<IExpenses>): Promise<IExpenses | null> {
        try {
            const updatedExpense = await Expenses_Model.findOneAndUpdate(
                { ExpenseID: expenseID, UserID: userID },
                updateData,
                { new: true }
            );
            
            if (updatedExpense) {
                await this.updateDashboardMetrics(userID);
            }
            
            return updatedExpense;
        } catch (error) {
            throw new Error(`Failed to update expense: ${error}`);
        }
    }

    /**
     * Get expense categories with totals
     */
    static async getExpenseCategories(userID: string, startDate?: Date, endDate?: Date) {
        try {
            return await Expenses_Model.getExpensesByCategory(userID, startDate, endDate);
        } catch (error) {
            throw new Error(`Failed to get expense categories: ${error}`);
        }
    }

    /**
     * Get income categories with totals
     */
    static async getIncomeCategories(userID: string, startDate?: Date, endDate?: Date) {
        try {
            return await Income_Model.getIncomeByCategory(userID, startDate, endDate);
        } catch (error) {
            throw new Error(`Failed to get income categories: ${error}`);
        }
    }
}
