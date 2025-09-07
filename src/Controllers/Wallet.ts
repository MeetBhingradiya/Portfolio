import { Wallets_Model, IWallets } from "@Models/Wallets";
import { WalletTransactions_Model, IWalletTransactions } from "@Models/WalletTransactions";
import { Budgets_Model } from "@Models/Budgets";
import { Currency } from "@Types/Currency";
import { v4 } from "uuid";

export class WalletController {
    // Get all wallets for a user
    static async getUserWallets(userID: string) {
        try {
            const wallets = await Wallets_Model.find({
                "Members.UserID": userID,
                "Members.isRemoved": { $ne: true },
                isDeleted: false
            }).sort({ createdAt: -1 });

            // Map the data to the format expected by frontend
            const mappedWallets = await Promise.all(wallets.map(async wallet => {
                let balance = wallet.Balance;
                let linkedPocketId = null;
                
                // For UPI wallets, use the linked wallet's balance and find the linked wallet's _id
                if (wallet.Type === "UPI" && wallet.LinkedWalletID) {
                    const linkedWallet = await Wallets_Model.findOne({
                        WalletID: wallet.LinkedWalletID,
                        "Members.UserID": userID,
                        "Members.isRemoved": { $ne: true },
                        isDeleted: false
                    });
                    
                    if (linkedWallet) {
                        balance = linkedWallet.Balance;
                        linkedPocketId = (linkedWallet._id as any).toString(); // Use the _id for frontend compatibility
                    }
                }
                
                return {
                    _id: (wallet._id as any).toString(),
                    walletID: wallet.WalletID, // Add the WalletID field for frontend
                    userID: userID,
                    name: wallet.Name,
                    type: wallet.Type,
                    balance: balance,
                    currency: wallet.Currency,
                    linkedPocketId: linkedPocketId, // Now correctly mapped to the linked wallet's _id
                    isActive: (wallet as any).isActive !== false, // Default to true if not set
                    createdAt: (wallet as any).createdAt || new Date(),
                    updatedAt: (wallet as any).updatedAt || new Date()
                };
            }));

            return {
                Status: 1,
                Message: "Wallets retrieved successfully",
                Data: mappedWallets
            };
        } catch (error) {
            console.error("Error fetching user wallets:", error);
            return {
                Status: 0,
                Message: "Failed to fetch wallets",
                Error: error
            };
        }
    }

    // Create a new wallet
    static async createWallet(data: {
        userID: string;
        name: string;
        type: "WALLET" | "BANK" | "UPI";
        currency?: Currency;
        description?: string;
        initialBalance?: number;
        minimumBalance?: number;
        linkedWalletID?: string;
    }) {
        try {
            const walletData = {
                Name: data.name,
                Type: data.type,
                Currency: data.currency || Currency.INR,
                Description: data.description,
                Balance: data.initialBalance || 0,
                MinimumBalance: data.minimumBalance || 0,
                LinkedWalletID: data.linkedWalletID,
                Members: [{
                    UserID: data.userID,
                    Permissions: ["DEBIT", "CREDIT", "REVERT", "BAL_READ"],
                    isCreator: true,
                    isOwner: true,
                    isRemoved: false
                }]
            };

            const wallet = new Wallets_Model(walletData);
            await wallet.save();

            return {
                Status: 1,
                Message: "Wallet created successfully",
                Data: wallet
            };
        } catch (error) {
            console.error("Error creating wallet:", error);
            return {
                Status: 0,
                Message: "Failed to create wallet",
                Error: error
            };
        }
    }

    // Add transaction (expense/income) to wallet
    static async addTransaction(data: {
        userID: string;
        fromWalletID: string;
        toWalletID?: string;
        amount: number;
        title: string;
        description?: string;
        financialType: "EXPENSE" | "INCOME" | "TRANSFER" | "ADJUSTMENT";
        category?: string;
        paymentMethod: string;
        vendor?: any;
        location?: any;
        source?: any;
        tax?: any;
        tags?: string[];
        isRecurring?: boolean;
        budgetID?: string;
    }) {
        try {
            // Validate wallet access - check both _id and WalletID
            const fromWallet = await Wallets_Model.findOne({
                $or: [
                    { _id: data.fromWalletID },
                    { WalletID: data.fromWalletID }
                ],
                "Members.UserID": data.userID,
                "Members.isRemoved": { $ne: true },
                isDeleted: false
            });

            if (!fromWallet) {
                return {
                    Status: 0,
                    Message: "Source wallet not found or access denied"
                };
            }

            // Check permissions
            const userMember = fromWallet.Members.find(m => m.UserID === data.userID);
            const requiredPermission = data.financialType === "INCOME" ? "CREDIT" : "DEBIT";
            
            if (!userMember?.Permissions.includes(requiredPermission as any)) {
                return {
                    Status: 0,
                    Message: "Insufficient permissions for this transaction"
                };
            }

            // Check balance for debit transactions
            if (data.financialType === "EXPENSE" || data.financialType === "TRANSFER") {
                let availableBalance = fromWallet.Balance;
                
                // For UPI wallets, check the linked wallet's balance
                if (fromWallet.Type === "UPI" && fromWallet.LinkedWalletID) {
                    const linkedWallet = await Wallets_Model.findOne({
                        WalletID: fromWallet.LinkedWalletID,
                        "Members.UserID": data.userID,
                        "Members.isRemoved": { $ne: true },
                        isDeleted: false
                    });
                    
                    if (linkedWallet) {
                        availableBalance = linkedWallet.Balance;
                    } else {
                        return {
                            Status: 0,
                            Message: "Linked wallet not found for UPI transaction"
                        };
                    }
                }
                
                if (availableBalance < data.amount) {
                    return {
                        Status: 0,
                        Message: "Insufficient balance"
                    };
                }
            }

            // Create transaction record
            const transactionData = {
                FromWalletID: fromWallet.WalletID, // Use the wallet's WalletID, not the passed ID
                ToWalletID: data.toWalletID,
                Amount: data.amount,
                Title: data.title,
                Description: data.description,
                Type: data.financialType === "INCOME" ? "CREDIT" : "DEBIT",
                FinancialType: data.financialType,
                Category: data.category,
                PaymentMethod: data.paymentMethod,
                Vendor: data.vendor,
                Location: data.location,
                Source: data.source,
                Tax: data.tax,
                Tags: data.tags,
                isRecurring: data.isRecurring,
                UserID: data.userID,
                BudgetID: data.budgetID,
                ReferenceID: v4(),
                Status: "COMPLETED", // Auto-approve for now
                Currency: fromWallet.Currency
            };

            const transaction = new WalletTransactions_Model(transactionData);
            await transaction.save();

            // Update wallet balance
            const balanceChange = data.financialType === "INCOME" ? data.amount : -data.amount;
            
            // For UPI wallets, update the linked wallet's balance instead
            let walletToUpdate = fromWallet.WalletID;
            if (fromWallet.Type === "UPI" && fromWallet.LinkedWalletID) {
                walletToUpdate = fromWallet.LinkedWalletID;
            }
            
            await Wallets_Model.updateOne(
                { WalletID: walletToUpdate },
                { $inc: { Balance: balanceChange } }
            );

            // Update target wallet balance for transfers
            if (data.toWalletID && data.financialType === "TRANSFER") {
                await Wallets_Model.updateOne(
                    { WalletID: data.toWalletID },
                    { $inc: { Balance: data.amount } }
                );
            }

            // Update budget if specified
            if (data.budgetID && data.financialType === "EXPENSE") {
                await Budgets_Model.updateOne(
                    { BudgetID: data.budgetID },
                    { $inc: { SpentAmount: data.amount } }
                );
            }

            return {
                Status: 1,
                Message: "Transaction added successfully",
                Data: transaction
            };
        } catch (error) {
            console.error("Error adding transaction:", error);
            return {
                Status: 0,
                Message: "Failed to add transaction",
                Error: error
            };
        }
    }

    // Get wallet transactions with filtering
    static async getWalletTransactions(userID: string, filters: {
        walletID?: string;
        financialType?: string;
        category?: string;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
    } = {}) {
        try {
            const {
                walletID,
                financialType,
                category,
                startDate,
                endDate,
                page = 1,
                limit = 50
            } = filters;

            // Build query
            const query: any = {
                UserID: userID,
                isArchived: false
            };

            if (walletID) {
                // Check if this wallet has linked UPI wallets
                const wallet = await Wallets_Model.findOne({
                    $or: [
                        { _id: walletID },
                        { WalletID: walletID }
                    ],
                    "Members.UserID": userID,
                    "Members.isRemoved": { $ne: true },
                    isDeleted: false
                });

                if (wallet) {
                    // Get linked UPI wallets for this wallet
                    const linkedUpiWallets = await Wallets_Model.find({
                        LinkedWalletID: wallet.WalletID,
                        Type: "UPI",
                        "Members.UserID": userID,
                        "Members.isRemoved": { $ne: true },
                        isDeleted: false
                    });

                    // Create array of wallet IDs to include in transaction search
                    const walletIDs = [wallet.WalletID];
                    linkedUpiWallets.forEach(upiWallet => {
                        walletIDs.push(upiWallet.WalletID);
                    });

                    query.$or = [
                        { FromWalletID: { $in: walletIDs } },
                        { ToWalletID: { $in: walletIDs } }
                    ];
                } else {
                    // Fallback to original logic if wallet not found
                    query.$or = [
                        { FromWalletID: walletID },
                        { ToWalletID: walletID }
                    ];
                }
            }

            if (financialType) {
                query.FinancialType = financialType;
            }

            if (category) {
                query.Category = category;
            }

            if (startDate || endDate) {
                query.Date = {};
                if (startDate) query.Date.$gte = startDate;
                if (endDate) query.Date.$lte = endDate;
            }

            const skip = (page - 1) * limit;

            const [transactions, total] = await Promise.all([
                WalletTransactions_Model.find(query)
                    .sort({ Date: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                WalletTransactions_Model.countDocuments(query)
            ]);

            // Get all UPI wallets for the user to identify which UPI app was used
            const allUpiWallets = await Wallets_Model.find({
                "Members.UserID": userID,
                "Members.isRemoved": { $ne: true },
                Type: "UPI",
                isDeleted: false
            });

            // Map transactions to include UPI wallet information
            const mappedTransactions = transactions.map(t => {
                // Check if this transaction was made through a UPI wallet
                let upiWalletUsed = null;
                const fromUpiWallet = allUpiWallets.find(upi => upi.WalletID === t.FromWalletID);
                const toUpiWallet = allUpiWallets.find(upi => upi.WalletID === t.ToWalletID);
                
                if (fromUpiWallet) {
                    upiWalletUsed = {
                        _id: (fromUpiWallet._id as any).toString(),
                        name: fromUpiWallet.Name,
                        type: 'UPI'
                    };
                } else if (toUpiWallet) {
                    upiWalletUsed = {
                        _id: (toUpiWallet._id as any).toString(),
                        name: toUpiWallet.Name,
                        type: 'UPI'
                    };
                }

                return {
                    ...t,
                    upiWalletUsed: upiWalletUsed
                };
            });

            return {
                Status: 1,
                Message: "Transactions retrieved successfully",
                Data: {
                    transactions: mappedTransactions,
                    pagination: {
                        current: page,
                        total: Math.ceil(total / limit),
                        count: total,
                        limit
                    }
                }
            };
        } catch (error) {
            console.error("Error fetching wallet transactions:", error);
            return {
                Status: 0,
                Message: "Failed to fetch transactions",
                Error: error
            };
        }
    }

    // Get comprehensive financial overview
    static async getFinancialOverview(userID: string, period: "month" | "quarter" | "year" = "month") {
        try {
            const now = new Date();
            let startDate: Date;

            switch (period) {
                case "month":
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case "quarter":
                    const quarterStart = Math.floor(now.getMonth() / 3) * 3;
                    startDate = new Date(now.getFullYear(), quarterStart, 1);
                    break;
                case "year":
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            }

            // Get all user wallets
            const wallets = await Wallets_Model.find({
                "Members.UserID": userID,
                "Members.isRemoved": { $ne: true },
                isDeleted: false
            });

            const walletIDs = wallets.map(w => w.WalletID);

            // Aggregate transactions
            const [expenseStats, incomeStats, transferStats] = await Promise.all([
                // Expense aggregation
                WalletTransactions_Model.aggregate([
                    {
                        $match: {
                            UserID: userID,
                            FinancialType: "EXPENSE",
                            Date: { $gte: startDate },
                            Status: "COMPLETED"
                        }
                    },
                    {
                        $group: {
                            _id: "$Category",
                            totalAmount: { $sum: "$Amount" },
                            count: { $sum: 1 },
                            averageAmount: { $avg: "$Amount" }
                        }
                    }
                ]),
                // Income aggregation
                WalletTransactions_Model.aggregate([
                    {
                        $match: {
                            UserID: userID,
                            FinancialType: "INCOME",
                            Date: { $gte: startDate },
                            Status: "COMPLETED"
                        }
                    },
                    {
                        $group: {
                            _id: "$Category",
                            totalAmount: { $sum: "$Amount" },
                            count: { $sum: 1 },
                            averageAmount: { $avg: "$Amount" }
                        }
                    }
                ]),
                // Transfer aggregation
                WalletTransactions_Model.aggregate([
                    {
                        $match: {
                            UserID: userID,
                            FinancialType: "TRANSFER",
                            Date: { $gte: startDate },
                            Status: "COMPLETED"
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: "$Amount" },
                            count: { $sum: 1 }
                        }
                    }
                ])
            ]);

            // Calculate totals
            const totalExpenses = expenseStats.reduce((sum, cat) => sum + cat.totalAmount, 0);
            const totalIncome = incomeStats.reduce((sum, cat) => sum + cat.totalAmount, 0);
            const netIncome = totalIncome - totalExpenses;
            const savingsRate = totalIncome > 0 ? ((netIncome / totalIncome) * 100) : 0;
            const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.Balance, 0);

            return {
                Status: 1,
                Message: "Financial overview retrieved successfully",
                Data: {
                    summary: {
                        totalIncome,
                        totalExpenses,
                        netIncome,
                        savingsRate,
                        totalBalance,
                        period
                    },
                    wallets: wallets.map(wallet => ({
                        WalletID: wallet.WalletID,
                        Name: wallet.Name,
                        Type: wallet.Type,
                        Balance: wallet.Balance,
                        Currency: wallet.Currency
                    })),
                    expenses: {
                        categoryBreakdown: expenseStats,
                        totalSpent: {
                            total: totalExpenses,
                            count: expenseStats.reduce((sum, cat) => sum + cat.count, 0),
                            average: expenseStats.length > 0 ? totalExpenses / expenseStats.reduce((sum, cat) => sum + cat.count, 0) : 0
                        }
                    },
                    income: {
                        categoryBreakdown: incomeStats,
                        totalIncome: {
                            total: totalIncome,
                            count: incomeStats.reduce((sum, cat) => sum + cat.count, 0),
                            average: incomeStats.length > 0 ? totalIncome / incomeStats.reduce((sum, cat) => sum + cat.count, 0) : 0
                        }
                    },
                    transfers: transferStats[0] || { totalAmount: 0, count: 0 }
                }
            };
        } catch (error) {
            console.error("Error fetching financial overview:", error);
            return {
                Status: 0,
                Message: "Failed to fetch financial overview",
                Error: error
            };
        }
    }

    // Transfer money between wallets
    static async transferBetweenWallets(data: {
        userID: string;
        fromWalletID: string;
        toWalletID: string;
        amount: number;
        title: string;
        description?: string;
    }) {
        try {
            // Validate both wallets
            const [fromWallet, toWallet] = await Promise.all([
                Wallets_Model.findOne({
                    WalletID: data.fromWalletID,
                    "Members.UserID": data.userID,
                    isDeleted: false
                }),
                Wallets_Model.findOne({
                    WalletID: data.toWalletID,
                    "Members.UserID": data.userID,
                    isDeleted: false
                })
            ]);

            if (!fromWallet || !toWallet) {
                return {
                    Status: 0,
                    Message: "One or both wallets not found"
                };
            }

            // Check balance
            if (fromWallet.Balance < data.amount) {
                return {
                    Status: 0,
                    Message: "Insufficient balance in source wallet"
                };
            }

            // Create transfer transaction
            const result = await this.addTransaction({
                userID: data.userID,
                fromWalletID: data.fromWalletID,
                toWalletID: data.toWalletID,
                amount: data.amount,
                title: data.title,
                description: data.description,
                financialType: "TRANSFER",
                paymentMethod: "BANK_TRANSFER"
            });

            return result;
        } catch (error) {
            console.error("Error transferring between wallets:", error);
            return {
                Status: 0,
                Message: "Failed to transfer funds",
                Error: error
            };
        }
    }

    // Update wallet
    static async updateWallet(walletId: string, data: {
        userID: string;
        name?: string;
        type?: "WALLET" | "BANK" | "UPI";
        currency?: string;
        isActive?: boolean;
    }) {
        try {
            const wallet = await Wallets_Model.findOne({
                _id: walletId,
                "Members.UserID": data.userID,
                "Members.isRemoved": { $ne: true },
                isDeleted: false
            });

            if (!wallet) {
                return {
                    Status: 0,
                    Message: "Wallet not found or access denied"
                };
            }

            const updateData: any = {};
            if (data.name) updateData.Name = data.name;
            if (data.type) updateData.Type = data.type;
            if (data.currency) updateData.Currency = data.currency;
            if (data.isActive !== undefined) updateData.isActive = data.isActive;

            const updatedWallet = await Wallets_Model.findByIdAndUpdate(
                walletId,
                updateData,
                { new: true }
            );

            return {
                Status: 1,
                Message: "Wallet updated successfully",
                Data: updatedWallet
            };
        } catch (error) {
            console.error("Error updating wallet:", error);
            return {
                Status: 0,
                Message: "Failed to update wallet",
                Error: error
            };
        }
    }

    // Delete wallet
    static async deleteWallet(walletId: string, userID: string) {
        try {
            const wallet = await Wallets_Model.findOne({
                _id: walletId,
                "Members.UserID": userID,
                "Members.isRemoved": { $ne: true },
                isDeleted: false
            });

            if (!wallet) {
                return {
                    Status: 0,
                    Message: "Wallet not found or access denied"
                };
            }

            // Soft delete the wallet
            await Wallets_Model.findByIdAndUpdate(walletId, {
                isDeleted: true,
                deletedAt: new Date()
            });

            return {
                Status: 1,
                Message: "Wallet deleted successfully"
            };
        } catch (error) {
            console.error("Error deleting wallet:", error);
            return {
                Status: 0,
                Message: "Failed to delete wallet",
                Error: error
            };
        }
    }

    // Update wallet transaction
    static async updateWalletTransaction(transactionId: string, data: {
        userID: string;
        type?: 'INCOME' | 'EXPENSE' | 'TRANSFER_IN' | 'TRANSFER_OUT';
        amount?: number;
        description?: string;
        category?: string;
    }) {
        try {
            const transaction = await WalletTransactions_Model.findOne({
                _id: transactionId,
                UserID: data.userID
            });

            if (!transaction) {
                return {
                    Status: 0,
                    Message: "Transaction not found or access denied"
                };
            }

            // Calculate balance difference for wallet update
            const oldAmount = transaction.Amount;
            const newAmount = data.amount || oldAmount;
            const amountDiff = newAmount - oldAmount;

            const updateData: any = {};
            if (data.type) {
                updateData.Type = data.type === 'INCOME' || data.type === 'TRANSFER_IN' ? 'CREDIT' : 'DEBIT';
                updateData.FinancialType = data.type === 'TRANSFER_IN' || data.type === 'TRANSFER_OUT' ? 'TRANSFER' : 
                                          data.type === 'INCOME' ? 'INCOME' : 'EXPENSE';
            }
            if (data.amount) updateData.Amount = data.amount;
            if (data.description) updateData.Description = data.description;
            if (data.category) updateData.Category = data.category;

            const updatedTransaction = await WalletTransactions_Model.findByIdAndUpdate(
                transactionId,
                updateData,
                { new: true }
            );

            // Update wallet balance if amount changed
            if (amountDiff !== 0) {
                const balanceChange = transaction.Type === 'CREDIT' ? amountDiff : -amountDiff;
                await Wallets_Model.updateOne(
                    { WalletID: transaction.FromWalletID }, // Use WalletID instead of _id
                    { $inc: { Balance: balanceChange } }
                );
            }

            return {
                Status: 1,
                Message: "Transaction updated successfully",
                Data: updatedTransaction
            };
        } catch (error) {
            console.error("Error updating transaction:", error);
            return {
                Status: 0,
                Message: "Failed to update transaction",
                Error: error
            };
        }
    }

    // Delete wallet transaction
    static async deleteWalletTransaction(transactionId: string, userID: string) {
        try {
            const transaction = await WalletTransactions_Model.findOne({
                _id: transactionId,
                UserID: userID
            });

            if (!transaction) {
                return {
                    Status: 0,
                    Message: "Transaction not found or access denied"
                };
            }

            // Reverse the wallet balance change
            const balanceChange = transaction.Type === 'CREDIT' ? -transaction.Amount : transaction.Amount;
            await Wallets_Model.updateOne(
                { WalletID: transaction.FromWalletID }, // Use WalletID instead of _id
                { $inc: { Balance: balanceChange } }
            );

            // Delete the transaction
            await WalletTransactions_Model.findByIdAndDelete(transactionId);

            return {
                Status: 1,
                Message: "Transaction deleted successfully"
            };
        } catch (error) {
            console.error("Error deleting transaction:", error);
            return {
                Status: 0,
                Message: "Failed to delete transaction",
                Error: error
            };
        }
    }

    // Get wallet transactions for a specific wallet
    static async getWalletTransactionsByWallet(walletId: string, userID: string) {
        try {
            const wallet = await Wallets_Model.findOne({
                $or: [
                    { _id: walletId },
                    { WalletID: walletId }
                ],
                "Members.UserID": userID,
                "Members.isRemoved": { $ne: true },
                isDeleted: false
            });

            if (!wallet) {
                return {
                    Status: 0,
                    Message: "Wallet not found or access denied"
                };
            }

            // Get linked UPI wallets for this wallet
            const linkedUpiWallets = await Wallets_Model.find({
                LinkedWalletID: wallet.WalletID,
                Type: "UPI",
                "Members.UserID": userID,
                "Members.isRemoved": { $ne: true },
                isDeleted: false
            });

            // Create array of wallet IDs to include in transaction search
            const walletIDs = [wallet.WalletID];
            linkedUpiWallets.forEach(upiWallet => {
                walletIDs.push(upiWallet.WalletID);
            });

            // Use the wallet's WalletID and linked UPI wallet IDs for transaction lookup
            const transactions = await WalletTransactions_Model.find({
                $or: [
                    { FromWalletID: { $in: walletIDs } },
                    { ToWalletID: { $in: walletIDs } }
                ],
                UserID: userID
            }).sort({ createdAt: -1 });

            // Map transactions to include proper type based on wallet context
            const mappedTransactions = await Promise.all(transactions.map(async t => {
                let type: 'INCOME' | 'EXPENSE' | 'TRANSFER_IN' | 'TRANSFER_OUT' = t.FinancialType as any;
                if (t.FinancialType === 'TRANSFER') {
                    type = walletIDs.includes(t.FromWalletID) ? 'TRANSFER_OUT' : 'TRANSFER_IN';
                } else if (t.FinancialType === 'INCOME') {
                    type = 'INCOME';
                } else {
                    type = 'EXPENSE';
                }
                
                // Check if this transaction was made through a UPI wallet
                let upiWalletUsed = null;
                const fromUpiWallet = linkedUpiWallets.find(upi => upi.WalletID === t.FromWalletID);
                const toUpiWallet = linkedUpiWallets.find(upi => upi.WalletID === t.ToWalletID);
                
                if (fromUpiWallet) {
                    upiWalletUsed = {
                        _id: (fromUpiWallet._id as any).toString(),
                        name: fromUpiWallet.Name,
                        type: 'UPI'
                    };
                } else if (toUpiWallet) {
                    upiWalletUsed = {
                        _id: (toUpiWallet._id as any).toString(),
                        name: toUpiWallet.Name,
                        type: 'UPI'
                    };
                }
                
                return {
                    _id: t._id,
                    walletID: walletId,
                    userID: t.UserID,
                    type,
                    amount: t.Amount,
                    description: t.Description || t.Title,
                    category: t.Category,
                    fromWalletID: t.FromWalletID,
                    toWalletID: t.ToWalletID,
                    upiWalletUsed: upiWalletUsed, // Added UPI wallet information
                    createdAt: t.Date || new Date()
                };
            }));

            return {
                Status: 1,
                Message: "Transactions retrieved successfully",
                Data: mappedTransactions
            };
        } catch (error) {
            console.error("Error fetching wallet transactions:", error);
            return {
                Status: 0,
                Message: "Failed to fetch transactions",
                Error: error
            };
        }
    }

    // Get wallet overview for dashboard
    static async getWalletOverview(userID: string) {
        try {
            // Get all user wallets
            const wallets = await Wallets_Model.find({
                "Members.UserID": userID,
                "Members.isRemoved": { $ne: true },
                isDeleted: false
            });

            if (!wallets || wallets.length === 0) {
                return {
                    Status: 1,
                    Message: "No wallets found",
                    Data: {
                        totalBalance: 0,
                        totalIncome: 0,
                        totalExpenses: 0,
                        netFlow: 0,
                        walletBreakdown: [],
                        recentTransactions: []
                    }
                };
            }

            const walletIDs = wallets.map(w => w._id);

            // Get recent transactions (limit to 10)
            const recentTransactions = await WalletTransactions_Model.find({
                UserID: userID,
                $or: [
                    { FromWalletID: { $in: walletIDs } },
                    { ToWalletID: { $in: walletIDs } }
                ]
            })
            .sort({ Date: -1 })
            .limit(10)
            .lean();

            // Calculate totals - exclude UPI wallets to avoid double counting with linked wallets
            const totalBalance = wallets.reduce((sum, wallet) => {
                // Skip UPI wallets in total balance calculation to avoid double counting
                if (wallet.Type === 'UPI') {
                    return sum;
                }
                return sum + (wallet.Balance || 0);
            }, 0);
            
            // Calculate income and expenses from transactions
            const incomeTransactions = recentTransactions.filter(t => 
                t.FinancialType === 'INCOME' || t.Type === 'CREDIT'
            );
            const expenseTransactions = recentTransactions.filter(t => 
                t.FinancialType === 'EXPENSE' || t.Type === 'DEBIT'
            );

            const totalIncome = incomeTransactions.reduce((sum, t) => sum + (t.Amount || 0), 0);
            const totalExpenses = expenseTransactions.reduce((sum, t) => sum + (t.Amount || 0), 0);
            const netFlow = totalIncome - totalExpenses;

            // Map wallet breakdown
            const walletBreakdown = await Promise.all(wallets.map(async wallet => {
                let balance = wallet.Balance || 0;
                let linkedPocketId = null;
                
                // For UPI wallets, show the linked wallet's balance and find the linked wallet's _id
                if (wallet.Type === 'UPI' && wallet.LinkedWalletID) {
                    const linkedWallet = await Wallets_Model.findOne({
                        WalletID: wallet.LinkedWalletID,
                        "Members.UserID": userID,
                        "Members.isRemoved": { $ne: true },
                        isDeleted: false
                    });
                    
                    if (linkedWallet) {
                        balance = linkedWallet.Balance || 0;
                        linkedPocketId = (linkedWallet._id as any).toString();
                    }
                }
                
                return {
                    walletID: (wallet._id as any).toString(),
                    name: wallet.Name,
                    type: wallet.Type,
                    balance: balance,
                    linkedPocketId: linkedPocketId,
                    totalIncome: 0, // You can calculate this per wallet if needed
                    totalExpenses: 0 // You can calculate this per wallet if needed
                };
            }));

            // Get all UPI wallets for UPI app identification
            const allUpiWallets = wallets.filter(w => w.Type === 'UPI');

            // Map recent transactions to expected format
            const mappedTransactions = recentTransactions.map(t => {
                const isFromTransaction = walletIDs.some(id => (id as any).toString() === (t.FromWalletID as any)?.toString());
                let type: 'INCOME' | 'EXPENSE' | 'TRANSFER_IN' | 'TRANSFER_OUT' = 'EXPENSE';
                
                if (t.FinancialType === 'INCOME') {
                    type = 'INCOME';
                } else if (t.FinancialType === 'EXPENSE') {
                    type = 'EXPENSE';
                } else if (t.FinancialType === 'TRANSFER') {
                    type = isFromTransaction ? 'TRANSFER_OUT' : 'TRANSFER_IN';
                }

                // Check if this transaction was made through a UPI wallet
                let upiWalletUsed = null;
                const fromUpiWallet = allUpiWallets.find(upi => upi.WalletID === t.FromWalletID);
                const toUpiWallet = allUpiWallets.find(upi => upi.WalletID === t.ToWalletID);
                
                if (fromUpiWallet) {
                    upiWalletUsed = {
                        _id: (fromUpiWallet._id as any).toString(),
                        name: fromUpiWallet.Name,
                        type: 'UPI'
                    };
                } else if (toUpiWallet) {
                    upiWalletUsed = {
                        _id: (toUpiWallet._id as any).toString(),
                        name: toUpiWallet.Name,
                        type: 'UPI'
                    };
                }

                return {
                    _id: t._id.toString(),
                    walletID: isFromTransaction ? t.FromWalletID?.toString() : t.ToWalletID?.toString(),
                    userID: t.UserID,
                    type,
                    amount: t.Amount || 0,
                    description: t.Description || t.Title || '',
                    category: t.Category || 'Other',
                    fromWalletID: (t.FromWalletID as any)?.toString(),
                    toWalletID: (t.ToWalletID as any)?.toString(),
                    upiWalletUsed: upiWalletUsed, // Added UPI wallet information
                    createdAt: (t as any).Date || (t as any).createdAt || new Date()
                };
            });

            return {
                Status: 1,
                Message: "Wallet overview retrieved successfully",
                Data: {
                    totalBalance,
                    totalIncome,
                    totalExpenses,
                    netFlow,
                    walletBreakdown,
                    recentTransactions: mappedTransactions
                }
            };
        } catch (error) {
            console.error("Error fetching wallet overview:", error);
            return {
                Status: 0,
                Message: "Failed to fetch wallet overview",
                Error: error
            };
        }
    }
}
