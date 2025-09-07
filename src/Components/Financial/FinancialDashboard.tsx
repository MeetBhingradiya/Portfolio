import React, { useState, useEffect } from 'react';
import { 
    ArrowTrendingUpIcon, 
    ArrowTrendingDownIcon, 
    BanknotesIcon, 
    CreditCardIcon, 
    ChartPieIcon, 
    ChartBarIcon,
    PlusIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Axios } from '@Utils/Axios';

interface FinancialOverview {
    summary: {
        totalIncome: number;
        totalExpenses: number;
        netIncome: number;
        savingsRate: number;
        period: string;
    };
    expenses: {
        categoryBreakdown: Array<{
            _id: string;
            totalAmount: number;
            count: number;
            averageAmount: number;
        }>;
        totalSpent: {
            total: number;
            count: number;
            average: number;
        };
    };
    income: {
        categoryBreakdown: Array<{
            _id: string;
            totalAmount: number;
            count: number;
            averageAmount: number;
        }>;
        totalIncome: {
            total: number;
            count: number;
            average: number;
        };
        pendingIncome: any[];
    };
    budgets: {
        active: number;
        budgets: Array<{
            Name: string;
            TotalAmount: number;
            SpentAmount: number;
            PercentageUsed: number;
            Status: string;
        }>;
    };
}

interface FinancialDashboardProps {
    userID: string;
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ userID }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
    const [overview, setOverview] = useState<FinancialOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchFinancialOverview();
    }, [userID, period]);

    const fetchFinancialOverview = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await Axios.get(`/api/financial/overview/${userID}?period=${period}`);
            
            if (response.status !== 200) {
                throw new Error(response.data?.error || 'Failed to fetch financial overview');
            }
            
            setOverview(response.data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200';
            case 'EXCEEDED': return 'bg-red-100 text-red-800 border-red-200';
            case 'COMPLETED': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const tabs = [
        { name: 'Expenses', id: 0 },
        { name: 'Income', id: 1 },
        { name: 'Budgets', id: 2 }
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!overview) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex">
                    <ChartBarIcon className="h-5 w-5 text-blue-400" />
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">No Data</h3>
                        <p className="text-sm text-blue-700 mt-1">No financial data available</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Header with Period Selection */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 space-y-4 sm:space-y-0">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Financial Dashboard
                </h2>
                <div className="flex space-x-2">
                    {(['month', 'quarter', 'year'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                period === p
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                            }`}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Income */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(overview.summary.totalIncome)}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                            <ArrowTrendingUpIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                {/* Total Expenses */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(overview.summary.totalExpenses)}
                            </p>
                        </div>
                        <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                            <ArrowTrendingDownIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                </div>

                {/* Net Income */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Income</p>
                            <p className={`text-2xl font-bold ${
                                overview.summary.netIncome >= 0 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                            }`}>
                                {formatCurrency(overview.summary.netIncome)}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <BanknotesIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                {/* Savings Rate */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Savings Rate</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {overview.summary.savingsRate.toFixed(1)}%
                            </p>
                        </div>
                        <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <ChartPieIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {/* Expenses Tab */}
                    {activeTab === 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Expense Categories
                                </h3>
                                <div className="space-y-4">
                                    {overview.expenses.categoryBreakdown.map((category, index) => (
                                        <div key={index}>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                    {category._id.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {formatCurrency(category.totalAmount)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${(category.totalAmount / overview.expenses.totalSpent.total) * 100}%`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Expense Summary
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(overview.expenses.totalSpent.total)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Number of Transactions</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {overview.expenses.totalSpent.count}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Average per Transaction</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {formatCurrency(overview.expenses.totalSpent.average)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Income Tab */}
                    {activeTab === 1 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Income Categories
                                </h3>
                                <div className="space-y-4">
                                    {overview.income.categoryBreakdown.map((category, index) => (
                                        <div key={index}>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                    {category._id.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {formatCurrency(category.totalAmount)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${(category.totalAmount / overview.income.totalIncome.total) * 100}%`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Income Summary
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Income</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(overview.income.totalIncome.total)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Number of Sources</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {overview.income.totalIncome.count}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Average per Source</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {formatCurrency(overview.income.totalIncome.average)}
                                        </p>
                                    </div>
                                    {overview.income.pendingIncome.length > 0 && (
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Pending Income</p>
                                            <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                                                {overview.income.pendingIncome.length} pending
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Budgets Tab */}
                    {activeTab === 2 && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Active Budgets ({overview.budgets.active})
                                </h3>
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors">
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Add Budget
                                </button>
                            </div>

                            {overview.budgets.budgets.length === 0 ? (
                                <div className="text-center py-12">
                                    <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">No active budgets found</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {overview.budgets.budgets.map((budget, index) => (
                                        <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                                    {budget.Name}
                                                </h4>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(budget.Status)}`}>
                                                    {budget.Status}
                                                </span>
                                            </div>
                                            
                                            <div className="mb-4">
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="text-gray-600 dark:text-gray-400">
                                                        {formatCurrency(budget.SpentAmount)} / {formatCurrency(budget.TotalAmount)}
                                                    </span>
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {budget.PercentageUsed.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-500 ${
                                                            budget.PercentageUsed > 90 
                                                                ? 'bg-red-600' 
                                                                : budget.PercentageUsed > 75 
                                                                    ? 'bg-yellow-600' 
                                                                    : 'bg-blue-600'
                                                        }`}
                                                        style={{
                                                            width: `${Math.min(budget.PercentageUsed, 100)}%`
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                            
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Remaining: {formatCurrency(budget.TotalAmount - budget.SpentAmount)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FinancialDashboard;
