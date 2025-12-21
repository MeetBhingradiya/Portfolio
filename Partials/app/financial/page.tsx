"use client";

import React, { useState, useEffect } from 'react';
import { PlusIcon, CurrencyDollarIcon, BanknotesIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { FinancialDashboard, AddExpenseDialog, AddIncomeDialog, AddBudgetDialog } from '../../Components/Financial';
import { useAuth } from '../../contexts/NextAuthContext';
import { useRouter } from 'next/navigation';
import { Spinner } from '@heroui/react';

export default function FinancialPage() {
    const { user, isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const [addExpenseOpen, setAddExpenseOpen] = useState(false);
    const [addIncomeOpen, setAddIncomeOpen] = useState(false);
    const [addBudgetOpen, setAddBudgetOpen] = useState(false);
    const [showFabMenu, setShowFabMenu] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Redirect to sign in if not authenticated
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/auth/signin?callbackUrl=/financial');
        }
    }, [isAuthenticated, loading, router]);

    const handleExpenseAdded = () => {
        // Trigger a refresh of the dashboard
        setRefreshTrigger(prev => prev + 1);
        setShowFabMenu(false);
    };

    const handleIncomeAdded = () => {
        // Trigger a refresh of the dashboard
        setRefreshTrigger(prev => prev + 1);
        setShowFabMenu(false);
    };

    const handleBudgetAdded = () => {
        // Trigger a refresh of the dashboard
        setRefreshTrigger(prev => prev + 1);
        setShowFabMenu(false);
    };

    // Show loading spinner while authentication is being checked
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <div className="text-center">
                    <Spinner size="lg" />
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render anything if not authenticated (redirect will happen)
    if (!isAuthenticated || !user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
                        Financial Management
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Welcome {user.firstName || user.name?.split(' ')[0] || user.username}! Track your expenses, manage budgets, and gain insights into your financial health.
                    </p>
                </div>

                {/* Dashboard */}
                <FinancialDashboard 
                    userID={user.id} 
                    key={refreshTrigger} // Force re-render when expenses are added
                />

                {/* Floating Action Buttons */}
                <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50">
                    {/* Sub-buttons */}
                    {showFabMenu && (
                        <div className="absolute bottom-16 right-0 flex flex-col gap-3 mb-2">
                            <button
                                onClick={() => {
                                    setAddBudgetOpen(true);
                                    setShowFabMenu(false);
                                }}
                                className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group flex items-center gap-2 pr-4"
                                aria-label="Add budget"
                            >
                                <ChartBarIcon className="h-5 w-5" />
                                <span className="text-sm font-medium whitespace-nowrap">Create Budget</span>
                            </button>
                            <button
                                onClick={() => {
                                    setAddIncomeOpen(true);
                                    setShowFabMenu(false);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group flex items-center gap-2 pr-4"
                                aria-label="Add income"
                            >
                                <CurrencyDollarIcon className="h-5 w-5" />
                                <span className="text-sm font-medium whitespace-nowrap">Add Income</span>
                            </button>
                            <button
                                onClick={() => {
                                    setAddExpenseOpen(true);
                                    setShowFabMenu(false);
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group flex items-center gap-2 pr-4"
                                aria-label="Add expense"
                            >
                                <BanknotesIcon className="h-5 w-5" />
                                <span className="text-sm font-medium whitespace-nowrap">Add Expense</span>
                            </button>
                        </div>
                    )}

                    {/* Main FAB */}
                    <button
                        onClick={() => setShowFabMenu(!showFabMenu)}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
                        aria-label="Add transaction"
                    >
                        <PlusIcon className={`h-6 w-6 transition-transform duration-200 ${showFabMenu ? 'rotate-45' : 'group-hover:rotate-90'}`} />
                    </button>
                </div>

                {/* Backdrop */}
                {showFabMenu && (
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowFabMenu(false)}
                    />
                )}

                {/* Add Expense Dialog */}
                <AddExpenseDialog
                    open={addExpenseOpen}
                    onClose={() => setAddExpenseOpen(false)}
                    onExpenseAdded={handleExpenseAdded}
                    userID={user.id}
                />

                {/* Add Income Dialog */}
                <AddIncomeDialog
                    open={addIncomeOpen}
                    onClose={() => setAddIncomeOpen(false)}
                    onIncomeAdded={handleIncomeAdded}
                    userID={user.id}
                />

                {/* Add Budget Dialog */}
                <AddBudgetDialog
                    open={addBudgetOpen}
                    onClose={() => setAddBudgetOpen(false)}
                    onBudgetAdded={handleBudgetAdded}
                    userID={user.id}
                />
            </div>
        </div>
    );
}
