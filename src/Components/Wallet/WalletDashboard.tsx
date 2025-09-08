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
import { useSession } from 'next-auth/react';
import { Axios } from '@Utils/Axios';
import AddWalletExpenseDialog from './AddWalletExpenseDialog';
import AddWalletIncomeDialog from './AddWalletIncomeDialog';
import AddWalletDialog from './AddWalletDialog';
import AddWalletTransferDialog from './AddWalletTransferDialog';
import WalletDetailView from './WalletDetailView';

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
    });

    const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="flex justify-center items-center min-h-96">
                    <Spinner size="lg" />
                </div>
            </div>
        );
    }

    if (dashboardData.error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
                <Card className="max-w-md mx-auto">
                    <CardBody>
                        <div className="text-danger text-center">
                            <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
                            <p>{dashboardData.error}</p>
                            <Button color="primary" className="mt-4" onPress={fetchData}>
                                Retry
                            </Button>
                        </div>
                    </CardBody>
                </Card>
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
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        Wallets
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage your finances and track transactions
                    </p>
                </div>

                <Dropdown>
                    <DropdownTrigger>
                        <Button
                            variant="light"
                            size="sm"
                            startContent={<PlusIcon className="h-4 w-4" />}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <CardBody className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Balance</p>
                                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                                        {formatCurrency(dashboardData.overview.totalBalance)}
                                    </p>
                                </div>
                                <Avatar
                                    icon={<BanknotesIcon className="h-6 w-6" />}
                                    className="bg-blue-500 text-white"
                                />
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <CardBody className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Income</p>
                                    <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">
                                        {formatCurrency(dashboardData.overview.totalIncome)}
                                    </p>
                                </div>
                                <Avatar
                                    icon={<ArrowTrendingUpIcon className="h-6 w-6" />}
                                    className="bg-green-500 text-white"
                                />
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <CardBody className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">Total Expenses</p>
                                    <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-1">
                                        {formatCurrency(dashboardData.overview.totalExpenses)}
                                    </p>
                                </div>
                                <Avatar
                                    icon={<ArrowTrendingDownIcon className="h-6 w-6" />}
                                    className="bg-red-500 text-white"
                                />
                            </div>
                        </CardBody>
                    </Card>

                    <Card className={`bg-gradient-to-br border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${dashboardData.overview.netFlow >= 0
                        ? 'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20'
                        : 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20'
                        }`}>
                        <CardBody className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm font-medium ${dashboardData.overview.netFlow >= 0
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-orange-600 dark:text-orange-400'
                                        }`}>Net Flow</p>
                                    <p className={`text-3xl font-bold mt-1 ${dashboardData.overview.netFlow >= 0
                                        ? 'text-emerald-900 dark:text-emerald-100'
                                        : 'text-orange-900 dark:text-orange-100'
                                        }`}>
                                        {formatCurrency(dashboardData.overview.netFlow)}
                                    </p>
                                </div>
                                <Avatar
                                    icon={<ArrowsRightLeftIcon className="h-6 w-6" />}
                                    className={dashboardData.overview.netFlow >= 0 ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'}
                                />
                            </div>
                        </CardBody>
                    </Card>
                </div>
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
                        console.log('Rendering wallet:', wallet); // Debug log
                        const IconComponent = getWalletIcon(wallet.type);
                        const isLinkedToWallet = wallet.type === 'UPI' && wallet.linkedPocketId;
                        const linkedWallet = wallet.linkedPocketId ?
                            dashboardData.wallets.find(w => w._id === wallet.linkedPocketId) : null;

                        return (
                            <Card
                                key={wallet._id}
                                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-4 w-full">
                                        <Avatar
                                            icon={<IconComponent className="h-6 w-6" />}
                                            className={`${getTypeColor(wallet.type) === 'primary' ? 'bg-blue-500' :
                                                getTypeColor(wallet.type) === 'warning' ? 'bg-orange-500' : 'bg-gray-500'
                                                } text-white`}
                                        />
                                        <div
                                            className="flex-1 min-w-0 cursor-pointer"
                                            onClick={() => handleWalletClick(wallet._id)}
                                        >
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                {wallet.name || 'Unnamed Wallet'}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {wallet.type === 'WALLET' ? 'Digital Wallet' :
                                                    wallet.type === 'BANK' ? 'Bank Account' :
                                                        'UPI Wallet'}
                                                {isLinkedToWallet && linkedWallet && (
                                                    <span className="ml-2 text-blue-600 dark:text-blue-400">
                                                        • Linked to {linkedWallet.name}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <Dropdown>
                                            <DropdownTrigger>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <EllipsisVerticalIcon className="h-4 w-4" />
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
                                </CardHeader>
                                <CardBody
                                    className="pt-0 cursor-pointer"
                                    onClick={() => handleWalletClick(wallet._id)}
                                >
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                {formatCurrency(wallet.balance || 0, wallet.currency || 'USD')}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Chip
                                                color={getTypeColor(wallet.type) as any}
                                                size="sm"
                                                variant="flat"
                                            >
                                                {wallet.type}
                                            </Chip>
                                            <Chip
                                                color={wallet.isActive ? 'success' : 'default'}
                                                size="sm"
                                                variant="dot"
                                            >
                                                {wallet.isActive ? 'Active' : 'Inactive'}
                                            </Chip>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
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
                size="md"
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
                                <h3 className="text-xl font-bold text-danger">Delete Wallet</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    This action cannot be undone
                                </p>
                            </ModalHeader>
                            <ModalBody>
                                {deleteConfirmation.wallet && (
                                    <div className="space-y-4">
                                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                            <div className="flex items-center gap-3">
                                                <TrashIcon className="h-6 w-6 text-red-500 flex-shrink-0" />
                                                <div>
                                                    <h4 className="font-semibold text-red-900 dark:text-red-100">
                                                        Are you sure you want to delete &quot;{deleteConfirmation.wallet.name}&quot;?
                                                    </h4>
                                                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                                        All associated transactions will also be deleted permanently.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                            <h5 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Wallet Details:</h5>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Name:</span>
                                                    <span className="font-medium">{deleteConfirmation.wallet.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                                                    <span className="font-medium">{deleteConfirmation.wallet.type}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Balance:</span>
                                                    <span className="font-medium">
                                                        {formatCurrency(deleteConfirmation.wallet.balance || 0, deleteConfirmation.wallet.currency || 'USD')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button color="default" variant="light" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    color="danger"
                                    onPress={handleWalletDelete}
                                    startContent={<TrashIcon className="h-4 w-4" />}
                                >
                                    Delete Wallet
                                </Button>
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
        </div>
    );
};

export default WalletDashboard;
