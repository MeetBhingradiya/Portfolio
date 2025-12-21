'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Card,
    CardHeader,
    CardBody,
    Button,
    Chip,
    Spinner,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Input,
    Select,
    SelectItem,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Pagination,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Tooltip,
    Avatar,
    Divider,
} from '@heroui/react';
import {
    BanknotesIcon,
    BuildingLibraryIcon,
    CreditCardIcon,
    PlusIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ArrowsRightLeftIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    PencilIcon,
    TrashIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    AdjustmentsHorizontalIcon,
    EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { useSession } from '../../Lib/auth-client';
import { Axios } from '../../Utils/Axios';
import AddWalletExpenseDialog from './AddWalletExpenseDialog';
import AddWalletIncomeDialog from './AddWalletIncomeDialog';
import AddWalletDialog from './AddWalletDialog';
import AddWalletTransferDialog from './AddWalletTransferDialog';
import EditWalletDialog from './EditWalletDialog';
import WalletDetailView from './WalletDetailView';
import { useDesignTheme } from '../../Hooks/useDesignTheme';
import { LiquidGlassCard, LiquidGlassButton } from '../LiquidGlass';
import { OneUICard, OneUIButton, OneUIHeader } from '../OneUI';

interface Wallet {
    _id: string;
    walletID: string; // Backend WalletID field
    userID: string;
    name: string;
    type: 'WALLET' | 'BANK' | 'UPI';
    balance: number;
    currency: string;
    isActive: boolean;
    linkedPocketId?: string; // For UPI wallets - which pocket they're linked to
    linkedUpiWallets?: Wallet[]; // For pockets - their linked UPI wallets
    totalBalance?: number; // For pockets - balance including linked UPI wallets
    createdAt: string;
    updatedAt: string;
}

interface WalletTransaction {
    _id: string;
    walletID: string;
    userID: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER_IN' | 'TRANSFER_OUT';
    amount: number;
    description: string;
    category: string;
    fromWalletID?: string;
    toWalletID?: string;
    upiWalletUsed?: {
        _id: string;
        name: string;
        type: 'UPI';
    } | null;
    createdAt: string;
    title?: string;
    paymentMethod?: string;
    status?: string;
}

interface WalletOverview {
    totalBalance: number;
    totalIncome: number;
    totalExpenses: number;
    netFlow: number;
    walletBreakdown: {
        walletID: string;
        name: string;
        type: string;
        balance: number;
        totalIncome: number;
        totalExpenses: number;
    }[];
    recentTransactions: WalletTransaction[];
}

interface TableFilters {
    search: string;
    type: string;
    category: string;
    walletID: string;
    dateRange: string;
}

interface SortConfig {
    key: keyof WalletTransaction | 'walletName';
    direction: 'asc' | 'desc';
}

const WalletDashboard: React.FC = () => {
    const { data: session } = useSession();
    const { designTheme, palette, colorMode } = useDesignTheme();
    const isApple = designTheme === 'apple';

    // Consolidated state for better performance
    const [dashboardData, setDashboardData] = useState({
        wallets: [] as Wallet[],
        overview: null as WalletOverview | null,
        allTransactions: [] as WalletTransaction[], // Ensure this is always an array
        loading: true,
        error: null as string | null,
    });

    // UI state
    const [dialogs, setDialogs] = useState({
        expense: false,
        income: false,
        wallet: false,
        transfer: false,
        editWallet: false,
    });

    const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
    const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

    // Table state
    const [tableFilters, setTableFilters] = useState<TableFilters>({
        search: '',
        type: 'all',
        category: 'all',
        walletID: 'all',
        dateRange: 'all',
    });

    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: 'createdAt',
        direction: 'desc',
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [editingTransaction, setEditingTransaction] = useState<WalletTransaction | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        wallet: Wallet | null;
    }>({
        isOpen: false,
        wallet: null,
    });
    const itemsPerPage = 10;

    // Memoized utility functions
    const getWalletIcon = useCallback((type: string) => {
        switch (type) {
            case 'BANK': return BuildingLibraryIcon;
            case 'UPI': return ArrowsRightLeftIcon; // Transfer arrows for UPI
            default: return BanknotesIcon;
        }
    }, []);

    const getTypeColor = useCallback((type: string) => {
        switch (type) {
            case 'BANK': return 'primary';
            case 'UPI': return 'warning'; // Warning color to indicate transfer-only
            default: return 'default';
        }
    }, []);

    const formatCurrency = useCallback((amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    }, []);

    // Optimized data fetching with single API call
    const fetchData = useCallback(async () => {
        if (!session?.user?.id) return;

        try {
            setDashboardData(prev => ({ ...prev, loading: true, error: null }));

            // Fetch all data in parallel
            const [walletsResponse, overviewResponse, transactionsResponse] = await Promise.all([
                Axios.get(`/api/wallets?userID=${session.user.id}`),
                Axios.get(`/api/wallet-overview/${session.user.id}`),
                Axios.get(`/api/wallet-transactions?userID=${session.user.id}&limit=1000`), // Get more transactions for table
            ]);

            console.log('API Responses:', {
                wallets: walletsResponse.data,
                overview: overviewResponse.data,
                transactions: transactionsResponse.data
            });

            setDashboardData(prev => ({
                ...prev,
                wallets: Array.isArray(walletsResponse.data.Data) ? walletsResponse.data.Data : [],
                overview: overviewResponse.data,
                allTransactions: Array.isArray(transactionsResponse.data.Data) ? transactionsResponse.data.Data : [],
                loading: false,
            }));
        } catch (err: any) {
            console.error('Error fetching wallet data:', err);
            setDashboardData(prev => ({
                ...prev,
                loading: false,
                error: err.response?.data?.error || 'Failed to load wallet data',
                allTransactions: Array.isArray(prev.allTransactions) ? prev.allTransactions : [], // Ensure array
            }));
        }
    }, [session?.user?.id]);

    // Memoized filtered and sorted transactions
    const processedTransactions = useMemo(() => {
        // Ensure we have a valid array
        const transactions = Array.isArray(dashboardData.allTransactions) ? dashboardData.allTransactions : [];
        let filtered = [...transactions]; // Create a copy to avoid mutating original

        // Apply filters
        if (tableFilters.search) {
            const searchLower = tableFilters.search.toLowerCase();
            filtered = filtered.filter(t =>
                t.description?.toLowerCase().includes(searchLower) ||
                t.title?.toLowerCase().includes(searchLower) ||
                t.category?.toLowerCase().includes(searchLower)
            );
        }

        if (tableFilters.type !== 'all') {
            filtered = filtered.filter(t => t.type === tableFilters.type);
        }

        if (tableFilters.category !== 'all') {
            filtered = filtered.filter(t => t.category === tableFilters.category);
        }

        if (tableFilters.walletID !== 'all') {
            filtered = filtered.filter(t => t.walletID === tableFilters.walletID);
        }

        // Apply date range filter
        if (tableFilters.dateRange !== 'all') {
            const now = new Date();
            let startDate = new Date();

            switch (tableFilters.dateRange) {
                case 'today':
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
                case 'year':
                    startDate.setFullYear(now.getFullYear() - 1);
                    break;
            }

            filtered = filtered.filter(t => new Date(t.createdAt) >= startDate);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aVal: any, bVal: any;

            if (sortConfig.key === 'walletName') {
                const aWallet = dashboardData.wallets.find(w => w._id === a.walletID);
                const bWallet = dashboardData.wallets.find(w => w._id === b.walletID);
                aVal = aWallet?.name || '';
                bVal = bWallet?.name || '';
            } else {
                aVal = a[sortConfig.key];
                bVal = b[sortConfig.key];
            }

            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [dashboardData.allTransactions, dashboardData.wallets, tableFilters, sortConfig]);

    // Memoized pagination
    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return processedTransactions.slice(startIndex, startIndex + itemsPerPage);
    }, [processedTransactions, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(processedTransactions.length / itemsPerPage);

    // Memoized unique values for filters with defensive checks
    const filterOptions = useMemo(() => {
        const transactions = Array.isArray(dashboardData.allTransactions) ? dashboardData.allTransactions : [];
        const availableCategories = [...new Set(transactions.map(t => t.category))].filter(Boolean);
        const availableTypes = ['INCOME', 'EXPENSE', 'TRANSFER_IN', 'TRANSFER_OUT'];

        return {
            categories: availableCategories,
            types: availableTypes,
        };
    }, [dashboardData.allTransactions]);

    // Reset invalid filters when options change
    useEffect(() => {
        const { categories: availableCategories, types: availableTypes } = filterOptions;

        // Reset category filter if current selection is not available
        if (tableFilters.category !== 'all' && !availableCategories.includes(tableFilters.category)) {
            setTableFilters(prev => ({ ...prev, category: 'all' }));
        }

        // Reset type filter if current selection is not available
        if (tableFilters.type !== 'all' && !availableTypes.includes(tableFilters.type)) {
            setTableFilters(prev => ({ ...prev, type: 'all' }));
        }

        // Reset wallet filter if current selection is not available
        const availableWalletIds = dashboardData.wallets.map(w => w._id);
        if (tableFilters.walletID !== 'all' && !availableWalletIds.includes(tableFilters.walletID)) {
            setTableFilters(prev => ({ ...prev, walletID: 'all' }));
        }

        // Reset date range filter if current selection is not available
        const availableDateRanges = ['all', 'today', 'week', 'month', 'year'];
        if (!availableDateRanges.includes(tableFilters.dateRange)) {
            setTableFilters(prev => ({ ...prev, dateRange: 'all' }));
        }
    }, [filterOptions, tableFilters.category, tableFilters.type, tableFilters.walletID, tableFilters.dateRange, dashboardData.wallets]);

    // Reset invalid filters when data changes
    useEffect(() => {
        if (tableFilters.category !== 'all' && !filterOptions.categories.includes(tableFilters.category)) {
            setTableFilters(prev => ({ ...prev, category: 'all' }));
        }
        if (tableFilters.type !== 'all' && !filterOptions.types.includes(tableFilters.type)) {
            setTableFilters(prev => ({ ...prev, type: 'all' }));
        }
        if (tableFilters.walletID !== 'all' && !dashboardData.wallets.some(w => w._id === tableFilters.walletID)) {
            setTableFilters(prev => ({ ...prev, walletID: 'all' }));
        }
    }, [filterOptions.categories, filterOptions.types, dashboardData.wallets, tableFilters.category, tableFilters.type, tableFilters.walletID]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Event handlers
    const handleDialogOpen = useCallback((dialogType: keyof typeof dialogs) => {
        setDialogs(prev => ({ ...prev, [dialogType]: true }));
    }, []);

    const handleDialogClose = useCallback((dialogType: keyof typeof dialogs) => {
        setDialogs(prev => ({ ...prev, [dialogType]: false }));
    }, []);

    const handleTransactionAdded = useCallback(() => {
        fetchData();
    }, [fetchData]);

    const handleWalletClick = useCallback((walletId: string) => {
        setSelectedWalletId(walletId);
    }, []);

    const handleBackToList = useCallback(() => {
        setSelectedWalletId(null);
        fetchData();
    }, [fetchData]);

    const handleSort = useCallback((key: keyof WalletTransaction | 'walletName') => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, []);

    const handleFilterChange = useCallback((key: keyof TableFilters, value: string) => {
        setTableFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    }, []);

    const handleTransactionEdit = useCallback((transaction: WalletTransaction) => {
        setEditingTransaction(transaction);
    }, []);

    const handleTransactionDelete = useCallback(async (transactionId: string) => {
        try {
            await Axios.delete(`/api/wallet-transactions/${transactionId}?userID=${session?.user?.id}`);
            fetchData();
        } catch (err) {
            console.error('Error deleting transaction:', err);
        }
    }, [session?.user?.id, fetchData]);

    const handleWalletDeleteConfirm = useCallback((wallet: Wallet) => {
        setDeleteConfirmation({
            isOpen: true,
            wallet,
        });
    }, []);

    const handleWalletEdit = useCallback((wallet: Wallet) => {
        setEditingWallet(wallet);
        setDialogs(prev => ({ ...prev, editWallet: true }));
    }, []);

    const handleWalletDelete = useCallback(async () => {
        if (!deleteConfirmation.wallet) return;

        try {
            await Axios.delete(`/api/wallets/${deleteConfirmation.wallet._id}?userID=${session?.user?.id}`);
            setDeleteConfirmation({ isOpen: false, wallet: null });
            fetchData();
        } catch (err) {
            console.error('Error deleting wallet:', err);
        }
    }, [deleteConfirmation.wallet, session?.user?.id, fetchData]);

    const handleDeleteCancel = useCallback(() => {
        setDeleteConfirmation({ isOpen: false, wallet: null });
    }, []);

    // Loading and error states
    if (dashboardData.loading) {
        return (
            <div 
                className="min-h-screen"
                style={{ background: palette.background }}
            >
                <div className="flex justify-center items-center min-h-96">
                    <Spinner size="lg" style={{ color: palette.accent }} />
                </div>
            </div>
        );
    }

    if (dashboardData.error) {
        return (
            <div 
                className="min-h-screen p-6"
                style={{ background: palette.background }}
            >
                {isApple ? (
                    <LiquidGlassCard className="max-w-md mx-auto">
                        <div className="text-center" style={{ color: palette.textPrimary }}>
                            <h3 className="text-lg font-semibold mb-2" style={{ color: '#ef4444' }}>Error Loading Data</h3>
                            <p>{dashboardData.error}</p>
                            <LiquidGlassButton className="mt-4" onClick={fetchData}>
                                Retry
                            </LiquidGlassButton>
                        </div>
                    </LiquidGlassCard>
                ) : (
                    <OneUICard className="max-w-md mx-auto">
                        <div className="text-center">
                            <h3 className="text-lg font-black mb-2" style={{ color: '#ef4444' }}>Error Loading Data</h3>
                            <p style={{ color: palette.textSecondary }}>{dashboardData.error}</p>
                            <OneUIButton className="mt-4" onClick={fetchData}>
                                Retry
                            </OneUIButton>
                        </div>
                    </OneUICard>
                )}
            </div>
        );
    }

    // Show wallet detail view if selected
    if (selectedWalletId) {
        return (
            <WalletDetailView
                walletId={selectedWalletId}
                onBack={handleBackToList}
                onWalletSwitch={(newWalletId) => setSelectedWalletId(newWalletId)}
            />
        );
    }

    return (
        <div 
            className="min-h-screen"
            style={{ background: palette.background }}
        >
            <div className="max-w-7xl mx-auto p-6 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        {isApple ? (
                            <>
                                <h1 
                                    className="text-3xl font-bold" 
                                    style={{ color: palette.textPrimary }}
                                >
                                    Wallets
                                </h1>
                                <p className="text-sm mt-1" style={{ color: palette.textSecondary }}>
                                    Manage your finances and track transactions
                                </p>
                            </>
                        ) : (
                            <>
                                <OneUIHeader title="Wallets" />
                                <p className="text-base mt-2" style={{ color: palette.textSecondary }}>
                                    Manage your finances and track transactions
                                </p>
                            </>
                        )}
                    </div>

                    <Dropdown>
                        <DropdownTrigger>
                            <Button
                                color="primary"
                                size={isApple ? "md" : "lg"}
                                className={isApple ? "rounded-xl" : "rounded-2xl font-semibold"}
                                startContent={<PlusIcon className={isApple ? "h-4 w-4" : "h-5 w-5"} />}
                            >
                                Add
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Add options">
                            <DropdownItem
                                key="create-wallet"
                                startContent={<BanknotesIcon className="h-4 w-4" />}
                                onPress={() => handleDialogOpen('wallet')}
                            >
                                Create Wallet
                            </DropdownItem>
                            <DropdownItem
                                key="income"
                                startContent={<ArrowTrendingUpIcon className="h-4 w-4" />}
                                onPress={() => handleDialogOpen('income')}
                            >
                                Add Income
                            </DropdownItem>
                            <DropdownItem
                                key="expense"
                                startContent={<ArrowTrendingDownIcon className="h-4 w-4" />}
                                onPress={() => handleDialogOpen('expense')}
                            >
                                Add Expense
                            </DropdownItem>
                            <DropdownItem
                                key="transfer"
                                startContent={<ArrowsRightLeftIcon className="h-4 w-4" />}
                                onPress={() => handleDialogOpen('transfer')}
                            >
                                Transfer Funds
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>

            {/* Overview Cards with Animations */}
            {dashboardData.overview && (
                <motion.div 
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Total Balance Card */}
                    <motion.div whileHover={{ scale: isApple ? 1.02 : 1 }}>
                        {isApple ? (
                            <LiquidGlassCard className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: palette.accent }}>
                                            Total Balance
                                        </p>
                                        <p className="text-3xl font-bold mt-1" style={{ color: palette.textPrimary }}>
                                            {formatCurrency(dashboardData.overview.totalBalance)}
                                        </p>
                                    </div>
                                    <div 
                                        className="w-12 h-12 rounded-full flex items-center justify-center"
                                        style={{ background: palette.accentSubtle }}
                                    >
                                        <BanknotesIcon className="h-6 w-6" style={{ color: palette.accent }} />
                                    </div>
                                </div>
                            </LiquidGlassCard>
                        ) : (
                            <OneUICard>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: palette.accent }}>
                                            Total Balance
                                        </p>
                                        <p className="text-3xl font-black mt-2" style={{ color: palette.textPrimary }}>
                                            {formatCurrency(dashboardData.overview.totalBalance)}
                                        </p>
                                    </div>
                                    <div 
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                        style={{ background: palette.accentSubtle }}
                                    >
                                        <BanknotesIcon className="h-7 w-7" style={{ color: palette.accent }} />
                                    </div>
                                </div>
                            </OneUICard>
                        )}
                    </motion.div>

                    {/* Total Income Card */}
                    <motion.div whileHover={{ scale: isApple ? 1.02 : 1 }}>
                        {isApple ? (
                            <LiquidGlassCard className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: '#10b981' }}>
                                            Total Income
                                        </p>
                                        <p className="text-3xl font-bold mt-1" style={{ color: palette.textPrimary }}>
                                            {formatCurrency(dashboardData.overview.totalIncome)}
                                        </p>
                                    </div>
                                    <div 
                                        className="w-12 h-12 rounded-full flex items-center justify-center"
                                        style={{ background: 'rgba(16, 185, 129, 0.1)' }}
                                    >
                                        <ArrowTrendingUpIcon className="h-6 w-6 text-green-500" />
                                    </div>
                                </div>
                            </LiquidGlassCard>
                        ) : (
                            <OneUICard>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-green-600">
                                            Total Income
                                        </p>
                                        <p className="text-3xl font-black mt-2" style={{ color: palette.textPrimary }}>
                                            {formatCurrency(dashboardData.overview.totalIncome)}
                                        </p>
                                    </div>
                                    <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <ArrowTrendingUpIcon className="h-7 w-7 text-green-600" />
                                    </div>
                                </div>
                            </OneUICard>
                        )}
                    </motion.div>

                    {/* Total Expenses Card */}
                    <motion.div whileHover={{ scale: isApple ? 1.02 : 1 }}>
                        {isApple ? (
                            <LiquidGlassCard className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: '#ef4444' }}>
                                            Total Expenses
                                        </p>
                                        <p className="text-3xl font-bold mt-1" style={{ color: palette.textPrimary }}>
                                            {formatCurrency(dashboardData.overview.totalExpenses)}
                                        </p>
                                    </div>
                                    <div 
                                        className="w-12 h-12 rounded-full flex items-center justify-center"
                                        style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                                    >
                                        <ArrowTrendingDownIcon className="h-6 w-6 text-red-500" />
                                    </div>
                                </div>
                            </LiquidGlassCard>
                        ) : (
                            <OneUICard>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-red-600">
                                            Total Expenses
                                        </p>
                                        <p className="text-3xl font-black mt-2" style={{ color: palette.textPrimary }}>
                                            {formatCurrency(dashboardData.overview.totalExpenses)}
                                        </p>
                                    </div>
                                    <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                        <ArrowTrendingDownIcon className="h-7 w-7 text-red-600" />
                                    </div>
                                </div>
                            </OneUICard>
                        )}
                    </motion.div>

                    {/* Net Flow Card */}
                    <motion.div whileHover={{ scale: isApple ? 1.02 : 1 }}>
                        {isApple ? (
                            <LiquidGlassCard className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium" style={{ 
                                            color: dashboardData.overview.netFlow >= 0 ? '#10b981' : '#f59e0b' 
                                        }}>
                                            Net Flow
                                        </p>
                                        <p className="text-3xl font-bold mt-1" style={{ color: palette.textPrimary }}>
                                            {formatCurrency(dashboardData.overview.netFlow)}
                                        </p>
                                    </div>
                                    <div 
                                        className="w-12 h-12 rounded-full flex items-center justify-center"
                                        style={{ 
                                            background: dashboardData.overview.netFlow >= 0 
                                                ? 'rgba(16, 185, 129, 0.1)' 
                                                : 'rgba(245, 158, 11, 0.1)' 
                                        }}
                                    >
                                        {dashboardData.overview.netFlow >= 0 ? (
                                            <ChevronUpIcon className="h-6 w-6 text-green-500" />
                                        ) : (
                                            <ChevronDownIcon className="h-6 w-6 text-orange-500" />
                                        )}
                                    </div>
                                </div>
                            </LiquidGlassCard>
                        ) : (
                            <OneUICard>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className={`text-sm font-bold ${
                                            dashboardData.overview.netFlow >= 0 ? 'text-emerald-600' : 'text-orange-600'
                                        }`}>
                                            Net Flow
                                        </p>
                                        <p className="text-3xl font-black mt-2" style={{ color: palette.textPrimary }}>
                                            {formatCurrency(dashboardData.overview.netFlow)}
                                        </p>
                                    </div>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                                        dashboardData.overview.netFlow >= 0 
                                            ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                                            : 'bg-orange-100 dark:bg-orange-900/30'
                                    }`}>
                                        {dashboardData.overview.netFlow >= 0 ? (
                                            <ChevronUpIcon className="h-7 w-7 text-emerald-600" />
                                        ) : (
                                            <ChevronDownIcon className="h-7 w-7 text-orange-600" />
                                        )}
                                    </div>
                                </div>
                            </OneUICard>
                        )}
                    </motion.div>
                </motion.div>
            )}

            {/* Wallets Grid */}
            {dashboardData.wallets.length === 0 ? (
                <div className="relative">
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-indigo-50/30 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-indigo-900/10 rounded-3xl"></div>

                    <Card className="relative text-center py-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl animate-fade-in overflow-hidden">
                        {/* Floating background elements */}
                        <div className="absolute top-4 left-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-xl"></div>
                        <div className="absolute bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-indigo-400/20 to-pink-500/20 rounded-full blur-lg"></div>
                        <div className="absolute top-1/2 left-8 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <div className="absolute top-1/3 right-12 w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-1000"></div>

                        <CardBody className="relative z-10">
                            <div className="space-y-8">
                                {/* Icon section with enhanced styling */}
                                <div className="relative flex justify-center">
                                    <div className="relative">
                                        {/* Main icon background */}
                                        <div className="w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-600/10 dark:from-blue-400/20 dark:to-purple-500/20 rounded-3xl flex items-center justify-center">
                                            <BanknotesIcon className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                                        </div>

                                        {/* Floating elements around icon */}
                                        <div className="absolute -top-2 -right-2">
                                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
                                                <PlusIcon className="h-4 w-4 text-white" />
                                            </div>
                                        </div>

                                        <div className="absolute -bottom-3 -left-3">
                                            <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                                        </div>

                                        <div className="absolute top-1/2 -right-6">
                                            <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Text content */}
                                <div className="space-y-4 text-center">
                                    <div>
                                        <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                                            No Wallets Yet
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                                            Create your first wallet to get started
                                        </p>
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <div className="space-y-2 text-center">
                                    <Button
                                        color="primary"
                                        size="lg"
                                        variant="shadow"
                                        startContent={<PlusIcon className="h-5 w-5" />}
                                        onPress={() => handleDialogOpen('wallet')}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        Create Your First Wallet
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
                    {dashboardData.wallets.map((wallet, index) => {
                        const IconComponent = getWalletIcon(wallet.type);
                        const isLinkedToWallet = wallet.type === 'UPI' && wallet.linkedPocketId;
                        const linkedWallet = wallet.linkedPocketId ?
                            dashboardData.wallets.find(w => w._id === wallet.linkedPocketId) : null;

                        // Determine icon background color based on wallet type
                        const getIconColor = () => {
                            if (wallet.type === 'BANK') return isApple ? '#3b82f6' : '#5b9aff';
                            if (wallet.type === 'UPI') return isApple ? '#f97316' : '#ff8c42';
                            return isApple ? '#6b7280' : '#8a94a6';
                        };

                        const getTypeBadgeStyle = () => {
                            if (wallet.type === 'BANK') {
                                return isApple 
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'bg-blue-600/20 text-blue-400 border border-blue-500/30';
                            }
                            if (wallet.type === 'UPI') {
                                return isApple
                                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                    : 'bg-orange-600/20 text-orange-400 border border-orange-500/30';
                            }
                            return isApple
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                : 'bg-gray-600/20 text-gray-400 border border-gray-500/30';
                        };

                        return (
                            <motion.div
                                key={wallet._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                {isApple ? (
                                    <LiquidGlassCard className="group overflow-hidden transition-all duration-300 hover:scale-[1.02]">
                                        <div 
                                            className="p-6 cursor-pointer"
                                            onClick={() => handleWalletClick(wallet._id)}
                                        >
                                            <div className="flex items-start justify-between mb-6">
                                                {/* Icon and Title */}
                                                <div className="flex items-center gap-3">
                                                    <div 
                                                        className="p-3 rounded-2xl"
                                                        style={{ backgroundColor: `${getIconColor()}20` }}
                                                    >
                                                        <IconComponent 
                                                            className="h-6 w-6" 
                                                            style={{ color: getIconColor() }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-semibold truncate max-w-[180px]" style={{ color: palette.textPrimary }}>
                                                            {wallet.name || 'Unnamed Wallet'}
                                                        </h3>
                                                        <p className="text-sm mt-0.5" style={{ color: palette.textSecondary }}>
                                                            {wallet.type === 'WALLET' ? 'Digital Wallet' :
                                                                wallet.type === 'BANK' ? 'Bank Account' :
                                                                    'UPI Wallet'}
                                                            {isLinkedToWallet && linkedWallet && (
                                                                <span className="ml-2" style={{ color: palette.accent }}>
                                                                    • Linked to {linkedWallet.name}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Menu Dropdown */}
                                                <Dropdown>
                                                    <DropdownTrigger>
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            variant="light"
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{ color: palette.textSecondary }}
                                                        >
                                                            <EllipsisVerticalIcon className="h-5 w-5" />
                                                        </Button>
                                                    </DropdownTrigger>
                                                    <DropdownMenu aria-label="Wallet actions">
                                                        <DropdownItem
                                                            key="view"
                                                            startContent={<BanknotesIcon className="h-4 w-4" />}
                                                            onPress={() => handleWalletClick(wallet._id)}
                                                        >
                                                            View Details
                                                        </DropdownItem>
                                                        <DropdownItem
                                                            key="edit"
                                                            startContent={<PencilIcon className="h-4 w-4" />}
                                                            onPress={() => handleWalletEdit(wallet)}
                                                        >
                                                            Edit Wallet
                                                        </DropdownItem>
                                                        <DropdownItem
                                                            key="delete"
                                                            className="text-danger"
                                                            color="danger"
                                                            startContent={<TrashIcon className="h-4 w-4" />}
                                                            onPress={() => handleWalletDeleteConfirm(wallet)}
                                                        >
                                                            Delete Wallet
                                                        </DropdownItem>
                                                    </DropdownMenu>
                                                </Dropdown>
                                            </div>

                                            {/* Balance Section */}
                                            <div className="mb-4">
                                                <p className="text-sm mb-1" style={{ color: palette.textSecondary }}>Balance</p>
                                                <p className="text-3xl font-bold" style={{ color: palette.textPrimary }}>
                                                    {formatCurrency(wallet.balance || 0, wallet.currency || 'USD')}
                                                </p>
                                            </div>

                                            {/* Footer with Type and Status */}
                                            <div className="flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${palette.border}` }}>
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    className={`uppercase text-xs font-semibold ${getTypeBadgeStyle()}`}
                                                >
                                                    {wallet.type}
                                                </Chip>
                                                <Chip
                                                    size="sm"
                                                    variant="dot"
                                                    color={wallet.isActive ? 'success' : 'default'}
                                                    className="font-medium"
                                                >
                                                    {wallet.isActive ? 'Active' : 'Inactive'}
                                                </Chip>
                                            </div>
                                        </div>
                                    </LiquidGlassCard>
                                ) : (
                                    <OneUICard className="group overflow-hidden">
                                        <div 
                                            className="p-6 cursor-pointer"
                                            onClick={() => handleWalletClick(wallet._id)}
                                        >
                                            <div className="flex items-start justify-between mb-6">
                                                {/* Icon and Title */}
                                                <div className="flex items-center gap-3">
                                                    <div 
                                                        className="p-3 rounded-3xl"
                                                        style={{ backgroundColor: `${getIconColor()}25` }}
                                                    >
                                                        <IconComponent 
                                                            className="h-6 w-6" 
                                                            style={{ color: getIconColor() }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-black truncate max-w-[180px]" style={{ color: palette.textPrimary }}>
                                                            {wallet.name || 'Unnamed Wallet'}
                                                        </h3>
                                                        <p className="text-sm mt-1 font-medium" style={{ color: palette.textSecondary }}>
                                                            {wallet.type === 'WALLET' ? 'Digital Wallet' :
                                                                wallet.type === 'BANK' ? 'Bank Account' :
                                                                    'UPI Wallet'}
                                                            {isLinkedToWallet && linkedWallet && (
                                                                <span className="ml-2" style={{ color: palette.accent }}>
                                                                    • Linked to {linkedWallet.name}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Menu Dropdown */}
                                                <Dropdown>
                                                    <DropdownTrigger>
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            variant="light"
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{ color: palette.textSecondary }}
                                                        >
                                                            <EllipsisVerticalIcon className="h-5 w-5" />
                                                        </Button>
                                                    </DropdownTrigger>
                                                    <DropdownMenu aria-label="Wallet actions">
                                                        <DropdownItem
                                                            key="view"
                                                            startContent={<BanknotesIcon className="h-4 w-4" />}
                                                            onPress={() => handleWalletClick(wallet._id)}
                                                        >
                                                            View Details
                                                        </DropdownItem>
                                                        <DropdownItem
                                                            key="edit"
                                                            startContent={<PencilIcon className="h-4 w-4" />}
                                                            onPress={() => handleWalletEdit(wallet)}
                                                        >
                                                            Edit Wallet
                                                        </DropdownItem>
                                                        <DropdownItem
                                                            key="delete"
                                                            className="text-danger"
                                                            color="danger"
                                                            startContent={<TrashIcon className="h-4 w-4" />}
                                                            onPress={() => handleWalletDeleteConfirm(wallet)}
                                                        >
                                                            Delete Wallet
                                                        </DropdownItem>
                                                    </DropdownMenu>
                                                </Dropdown>
                                            </div>

                                            {/* Balance Section */}
                                            <div className="mb-4">
                                                <p className="text-sm font-bold mb-1" style={{ color: palette.textSecondary }}>Balance</p>
                                                <p className="text-3xl font-black" style={{ color: palette.textPrimary }}>
                                                    {formatCurrency(wallet.balance || 0, wallet.currency || 'USD')}
                                                </p>
                                            </div>

                                            {/* Footer with Type and Status */}
                                            <div className="flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${palette.border}` }}>
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    className={`uppercase text-xs font-black ${getTypeBadgeStyle()}`}
                                                >
                                                    {wallet.type}
                                                </Chip>
                                                <Chip
                                                    size="sm"
                                                    variant="dot"
                                                    color={wallet.isActive ? 'success' : 'default'}
                                                    className="font-bold"
                                                >
                                                    {wallet.isActive ? 'Active' : 'Inactive'}
                                                </Chip>
                                            </div>
                                        </div>
                                    </OneUICard>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Comprehensive Transactions Table */}
            {dashboardData.allTransactions.length > 0 && (
                <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg animate-fade-in">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    All Transactions
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    {processedTransactions.length} transactions found
                                </p>
                            </div>

                            {/* Search and Filters */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Input
                                    placeholder="Search transactions..."
                                    value={tableFilters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    startContent={<MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />}
                                    className="min-w-64"
                                    variant="bordered"
                                />

                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button
                                            variant="bordered"
                                            startContent={<FunnelIcon className="h-4 w-4" />}
                                            className="min-w-32"
                                        >
                                            Filters
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu aria-label="Filter options" className="min-w-64">
                                        <DropdownItem key="filters-header" isReadOnly className="opacity-100">
                                            <div className="space-y-4 p-2">
                                                <Select
                                                    label="Transaction Type"
                                                    selectedKeys={tableFilters.type !== 'all' && filterOptions.types.includes(tableFilters.type) ? [tableFilters.type] : []}
                                                    onSelectionChange={(keys) => {
                                                        const value = Array.from(keys)[0] as string || 'all';
                                                        handleFilterChange('type', value);
                                                    }}
                                                    size="sm"
                                                    variant="bordered"
                                                    items={[{ key: 'all', label: 'All Types' }, ...filterOptions.types.map(type => ({ key: type, label: type.replace('_', ' ') }))]}
                                                >
                                                    {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
                                                </Select>

                                                <Select
                                                    label="Category"
                                                    selectedKeys={tableFilters.category !== 'all' && filterOptions.categories.includes(tableFilters.category) ? [tableFilters.category] : []}
                                                    onSelectionChange={(keys) => {
                                                        const value = Array.from(keys)[0] as string || 'all';
                                                        handleFilterChange('category', value);
                                                    }}
                                                    size="sm"
                                                    variant="bordered"
                                                    items={[{ key: 'all', label: 'All Categories' }, ...filterOptions.categories.map(category => ({ key: category, label: category }))]}
                                                >
                                                    {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
                                                </Select>

                                                <Select
                                                    label="Wallet"
                                                    selectedKeys={tableFilters.walletID !== 'all' && dashboardData.wallets.some(w => w._id === tableFilters.walletID) ? [tableFilters.walletID] : []}
                                                    onSelectionChange={(keys) => {
                                                        const value = Array.from(keys)[0] as string || 'all';
                                                        handleFilterChange('walletID', value);
                                                    }}
                                                    size="sm"
                                                    variant="bordered"
                                                    items={[{ key: 'all', label: 'All Wallets' }, ...dashboardData.wallets.map(wallet => ({ key: wallet._id, label: wallet.name }))]}
                                                >
                                                    {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
                                                </Select>

                                                <Select
                                                    label="Date Range"
                                                    selectedKeys={
                                                        tableFilters.dateRange !== 'all' &&
                                                            ['today', 'week', 'month', 'year'].includes(tableFilters.dateRange)
                                                            ? [tableFilters.dateRange]
                                                            : []
                                                    }
                                                    onSelectionChange={(keys) => {
                                                        const value = Array.from(keys)[0] as string || 'all';
                                                        handleFilterChange('dateRange', value);
                                                    }}
                                                    size="sm"
                                                    variant="bordered"
                                                >
                                                    <SelectItem key="all">All Time</SelectItem>
                                                    <SelectItem key="today">Today</SelectItem>
                                                    <SelectItem key="week">Last 7 Days</SelectItem>
                                                    <SelectItem key="month">Last Month</SelectItem>
                                                    <SelectItem key="year">Last Year</SelectItem>
                                                </Select>
                                            </div>
                                        </DropdownItem>
                                    </DropdownMenu>
                                </Dropdown>
                            </div>
                        </div>
                    </CardHeader>
                    <CardBody className="p-0">
                        <Table
                            aria-label="Transactions table"
                            isStriped
                            removeWrapper
                            classNames={{
                                th: "bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 font-semibold",
                                td: "py-4",
                                tbody: "divide-y divide-gray-200 dark:divide-gray-700",
                            }}
                        >
                            <TableHeader>
                                <TableColumn
                                    key="type"
                                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    onClick={() => handleSort('type')}
                                >
                                    <div className="flex items-center gap-1">
                                        Type
                                        {sortConfig.key === 'type' && (
                                            sortConfig.direction === 'asc' ?
                                                <ChevronUpIcon className="h-4 w-4" /> :
                                                <ChevronDownIcon className="h-4 w-4" />
                                        )}
                                    </div>
                                </TableColumn>
                                <TableColumn
                                    key="description"
                                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    onClick={() => handleSort('description')}
                                >
                                    <div className="flex items-center gap-1">
                                        Description
                                        {sortConfig.key === 'description' && (
                                            sortConfig.direction === 'asc' ?
                                                <ChevronUpIcon className="h-4 w-4" /> :
                                                <ChevronDownIcon className="h-4 w-4" />
                                        )}
                                    </div>
                                </TableColumn>
                                <TableColumn
                                    key="amount"
                                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    onClick={() => handleSort('amount')}
                                >
                                    <div className="flex items-center gap-1">
                                        Amount
                                        {sortConfig.key === 'amount' && (
                                            sortConfig.direction === 'asc' ?
                                                <ChevronUpIcon className="h-4 w-4" /> :
                                                <ChevronDownIcon className="h-4 w-4" />
                                        )}
                                    </div>
                                </TableColumn>
                                <TableColumn
                                    key="walletName"
                                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    onClick={() => handleSort('walletName')}
                                >
                                    <div className="flex items-center gap-1">
                                        Wallet
                                        {sortConfig.key === 'walletName' && (
                                            sortConfig.direction === 'asc' ?
                                                <ChevronUpIcon className="h-4 w-4" /> :
                                                <ChevronDownIcon className="h-4 w-4" />
                                        )}
                                    </div>
                                </TableColumn>
                                <TableColumn
                                    key="category"
                                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    onClick={() => handleSort('category')}
                                >
                                    <div className="flex items-center gap-1">
                                        Category
                                        {sortConfig.key === 'category' && (
                                            sortConfig.direction === 'asc' ?
                                                <ChevronUpIcon className="h-4 w-4" /> :
                                                <ChevronDownIcon className="h-4 w-4" />
                                        )}
                                    </div>
                                </TableColumn>
                                <TableColumn
                                    key="createdAt"
                                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    onClick={() => handleSort('createdAt')}
                                >
                                    <div className="flex items-center gap-1">
                                        Date
                                        {sortConfig.key === 'createdAt' && (
                                            sortConfig.direction === 'asc' ?
                                                <ChevronUpIcon className="h-4 w-4" /> :
                                                <ChevronDownIcon className="h-4 w-4" />
                                        )}
                                    </div>
                                </TableColumn>
                                <TableColumn key="actions">Actions</TableColumn>
                            </TableHeader>
                            <TableBody emptyContent="No transactions found">
                                {paginatedTransactions.map((transaction) => {
                                    const wallet = dashboardData.wallets.find(w => w._id === transaction.walletID);
                                    const isIncome = transaction.type === 'INCOME' || transaction.type === 'TRANSFER_IN';
                                    const IconComponent = isIncome ? ArrowTrendingUpIcon :
                                        transaction.type === 'TRANSFER_OUT' ? ArrowsRightLeftIcon : ArrowTrendingDownIcon;

                                    return (
                                        <TableRow
                                            key={transaction._id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                            onClick={() => handleTransactionEdit(transaction)}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <IconComponent className={`h-5 w-5 ${isIncome ? 'text-success' :
                                                        transaction.type === 'TRANSFER_OUT' ? 'text-primary' : 'text-danger'
                                                        }`} />
                                                    <Chip
                                                        color={isIncome ? 'success' : transaction.type === 'TRANSFER_OUT' ? 'primary' : 'danger'}
                                                        size="sm"
                                                        variant="flat"
                                                    >
                                                        {transaction.type.replace('_', ' ')}
                                                    </Chip>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{transaction.description}</p>
                                                    {transaction.title && (
                                                        <p className="text-sm text-gray-500">{transaction.title}</p>
                                                    )}
                                                    {transaction.upiWalletUsed && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <ArrowsRightLeftIcon className="h-3 w-3 text-orange-500" />
                                                            <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                                                via {transaction.upiWalletUsed.name}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`font-bold ${isIncome ? 'text-success' : 'text-danger'}`}>
                                                    {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {wallet && (
                                                        <>
                                                            <Avatar
                                                                icon={React.createElement(getWalletIcon(wallet.type), { className: "h-4 w-4" })}
                                                                size="sm"
                                                                className={`${getTypeColor(wallet.type) === 'primary' ? 'bg-blue-500' :
                                                                    getTypeColor(wallet.type) === 'warning' ? 'bg-orange-500' : 'bg-gray-500'
                                                                    } text-white`}
                                                            />
                                                            <span className="font-medium">{wallet.name}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip size="sm" variant="flat" color="default">
                                                    {transaction.category}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <p>{new Date(transaction.createdAt).toLocaleDateString()}</p>
                                                    <p className="text-gray-500">{new Date(transaction.createdAt).toLocaleTimeString()}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Tooltip content="Edit transaction">
                                                        <Button
                                                            size="sm"
                                                            variant="light"
                                                            isIconOnly
                                                            onPress={() => {
                                                                handleTransactionEdit(transaction);
                                                            }}
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                        </Button>
                                                    </Tooltip>
                                                    <Tooltip content="Delete transaction" color="danger">
                                                        <Button
                                                            size="sm"
                                                            variant="light"
                                                            color="danger"
                                                            isIconOnly
                                                            onPress={() => {
                                                                handleTransactionDelete(transaction._id);
                                                            }}
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </Button>
                                                    </Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center py-4 border-t border-gray-200 dark:border-gray-700">
                                <Pagination
                                    total={totalPages}
                                    page={currentPage}
                                    onChange={setCurrentPage}
                                    size="lg"
                                    showControls
                                    showShadow
                                    color="primary"
                                />
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}

            {/* Edit Transaction Modal */}
            <Modal
                isOpen={!!editingTransaction}
                onClose={() => setEditingTransaction(null)}
                size="2xl"
                classNames={{
                    backdrop: "backdrop-blur-sm bg-background/30",
                    base: "border-none bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm",
                    header: "border-b border-gray-200 dark:border-gray-700",
                    footer: "border-t border-gray-200 dark:border-gray-700",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <h3 className="text-xl font-bold">Edit Transaction</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Modify transaction details
                                </p>
                            </ModalHeader>
                            <ModalBody>
                                {editingTransaction && (
                                    <div className="space-y-4">
                                        <p className="text-center text-gray-600 dark:text-gray-400">
                                            Transaction editing functionality will be implemented next.
                                        </p>
                                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                            <h4 className="font-semibold mb-2">Current Transaction:</h4>
                                            <div className="space-y-1 text-sm">
                                                <p><strong>Description:</strong> {editingTransaction.description}</p>
                                                <p><strong>Amount:</strong> {formatCurrency(editingTransaction.amount)}</p>
                                                <p><strong>Type:</strong> {editingTransaction.type}</p>
                                                <p><strong>Category:</strong> {editingTransaction.category}</p>
                                                <p><strong>Date:</strong> {new Date(editingTransaction.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button color="primary" onPress={onClose}>
                                    Save Changes
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Delete Wallet Confirmation Modal */}
            <Modal
                isOpen={deleteConfirmation.isOpen}
                onClose={handleDeleteCancel}
                size="lg"
                classNames={{
                    backdrop: "backdrop-blur-md bg-background/50",
                    base: "border-none",
                }}
            >
                <ModalContent style={{ background: palette.surface }}>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 px-8 pt-8 pb-4">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-3"
                                >
                                    <div
                                        className={`${isApple ? 'w-12 h-12 rounded-xl' : 'w-14 h-14 rounded-2xl'} flex items-center justify-center bg-red-100 dark:bg-red-900/30`}
                                    >
                                        <TrashIcon className={`${isApple ? 'h-6 w-6' : 'h-7 w-7'} text-red-500`} />
                                    </div>
                                    <div>
                                        <h2 className={`${isApple ? 'text-2xl font-bold' : 'text-3xl font-black'} text-red-600 dark:text-red-400`}>
                                            Delete Wallet
                                        </h2>
                                        <p 
                                            className={`${isApple ? 'text-sm' : 'text-base font-medium'} mt-1`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            This action cannot be undone
                                        </p>
                                    </div>
                                </motion.div>
                            </ModalHeader>
                            <ModalBody className="px-8 py-6">
                                {deleteConfirmation.wallet && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-6"
                                    >
                                        {/* Warning Box */}
                                        <div 
                                            className={`${isApple ? 'p-4 rounded-xl' : 'p-5 rounded-2xl'} border-2 border-red-200 dark:border-red-800`}
                                            style={{ background: 'rgba(239, 68, 68, 0.05)' }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 className={`${isApple ? 'font-semibold' : 'font-bold text-lg'} text-red-900 dark:text-red-100`}>
                                                        Are you absolutely sure?
                                                    </h4>
                                                    <p className={`${isApple ? 'text-sm' : 'text-base'} text-red-700 dark:text-red-300 mt-2`}>
                                                        You are about to permanently delete <strong>&quot;{deleteConfirmation.wallet.name}&quot;</strong>. 
                                                        All associated transactions will also be deleted and cannot be recovered.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Wallet Details */}
                                        <div 
                                            className={`${isApple ? 'p-4 rounded-xl' : 'p-5 rounded-2xl'}`}
                                            style={{ background: palette.surfaceSecondary }}
                                        >
                                            <h5 
                                                className={`${isApple ? 'font-semibold mb-3' : 'font-bold text-lg mb-4'}`}
                                                style={{ color: palette.textPrimary }}
                                            >
                                                Wallet Details
                                            </h5>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span 
                                                        className={isApple ? 'text-sm' : 'text-base'}
                                                        style={{ color: palette.textSecondary }}
                                                    >
                                                        Name
                                                    </span>
                                                    <span 
                                                        className={`${isApple ? 'font-medium' : 'font-bold'}`}
                                                        style={{ color: palette.textPrimary }}
                                                    >
                                                        {deleteConfirmation.wallet.name}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span 
                                                        className={isApple ? 'text-sm' : 'text-base'}
                                                        style={{ color: palette.textSecondary }}
                                                    >
                                                        Type
                                                    </span>
                                                    <Chip size="sm" variant="flat" color={
                                                        deleteConfirmation.wallet.type === 'BANK' ? 'primary' :
                                                        deleteConfirmation.wallet.type === 'UPI' ? 'warning' : 'default'
                                                    }>
                                                        {deleteConfirmation.wallet.type}
                                                    </Chip>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span 
                                                        className={isApple ? 'text-sm' : 'text-base'}
                                                        style={{ color: palette.textSecondary }}
                                                    >
                                                        Current Balance
                                                    </span>
                                                    <span 
                                                        className={`${isApple ? 'font-bold text-lg' : 'font-black text-xl'}`}
                                                        style={{ color: palette.accent }}
                                                    >
                                                        {formatCurrency(deleteConfirmation.wallet.balance || 0, deleteConfirmation.wallet.currency || 'USD')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </ModalBody>
                            <ModalFooter className="px-8 pb-8 pt-4">
                                <motion.div 
                                    className="flex gap-3 w-full"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <Button
                                        variant="flat"
                                        onPress={onClose}
                                        size={isApple ? "md" : "lg"}
                                        className={`flex-1 ${isApple ? 'rounded-xl' : 'rounded-2xl font-semibold'}`}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        color="danger"
                                        onPress={handleWalletDelete}
                                        size={isApple ? "md" : "lg"}
                                        className={`flex-1 ${isApple ? 'rounded-xl' : 'rounded-2xl font-semibold'}`}
                                        startContent={<TrashIcon className="h-4 w-4" />}
                                    >
                                        Delete Permanently
                                    </Button>
                                </motion.div>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Dialogs */}
            <AddWalletDialog
                open={dialogs.wallet}
                onClose={() => handleDialogClose('wallet')}
                onWalletAdded={handleTransactionAdded}
                userID={session?.user?.id || ''}
            />

            <AddWalletExpenseDialog
                open={dialogs.expense}
                onClose={() => handleDialogClose('expense')}
                onExpenseAdded={handleTransactionAdded}
                userID={session?.user?.id || ''}
            />

            <AddWalletIncomeDialog
                open={dialogs.income}
                onClose={() => handleDialogClose('income')}
                onIncomeAdded={handleTransactionAdded}
                userID={session?.user?.id || ''}
            />

            <AddWalletTransferDialog
                open={dialogs.transfer}
                onClose={() => handleDialogClose('transfer')}
                onTransferCompleted={handleTransactionAdded}
                userID={session?.user?.id || ''}
            />

            <EditWalletDialog
                open={dialogs.editWallet}
                onClose={() => {
                    handleDialogClose('editWallet');
                    setEditingWallet(null);
                }}
                onWalletUpdated={handleTransactionAdded}
                wallet={editingWallet}
            />
            </div>
        </div>
    );
};

export default WalletDashboard;
