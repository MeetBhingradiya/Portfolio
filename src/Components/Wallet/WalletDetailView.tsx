'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    Button,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Select,
    SelectItem,
    Spinner,
    Tooltip,
    Avatar,
    Divider,
    Pagination,
} from '@heroui/react';
import {
    BanknotesIcon,
    BuildingLibraryIcon,
    CreditCardIcon,
    PlusIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ArrowsRightLeftIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    ArrowLeftIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import { Axios } from '@Utils/Axios';

interface Wallet {
    _id: string;
    walletID: string; // Backend WalletID field
    userID: string;
    name: string;
    type: 'WALLET' | 'BANK' | 'UPI';
    balance: number;
    currency: string;
    isActive: boolean;
    linkedPocketId?: string; // For UPI wallets
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
}

interface WalletDetailViewProps {
    walletId: string;
    onBack: () => void;
    onWalletSwitch?: (walletId: string) => void;
}

const categories = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Investments',
    'Salary',
    'Business',
    'Other'
];

const WalletDetailView: React.FC<WalletDetailViewProps> = ({ walletId, onBack, onWalletSwitch }) => {
    const { data: session } = useSession();

    // Consolidated state for better performance
    const [walletData, setWalletData] = useState({
        wallet: null as Wallet | null,
        allWallets: [] as Wallet[], // Add state for all wallets
        transactions: [] as WalletTransaction[],
        loading: true,
        error: null as string | null,
    });

    // UI state consolidated
    const [modals, setModals] = useState({
        editWallet: false,
        addTransaction: false,
        editTransaction: false,
        deleteTransaction: false,
    });

    // Table and filter state
    const [tableState, setTableState] = useState({
        search: '',
        typeFilter: 'all',
        categoryFilter: 'all',
        sortConfig: { key: 'createdAt' as keyof WalletTransaction, direction: 'desc' as 'asc' | 'desc' },
        currentPage: 1,
    });

    const itemsPerPage = 10;

    // Form states
    const [editWalletForm, setEditWalletForm] = useState({
        name: '',
        type: 'WALLET' as 'WALLET' | 'BANK' | 'UPI',
        currency: 'USD',
        isActive: true
    });

    const [transactionForm, setTransactionForm] = useState({
        type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
        amount: 0,
        description: '',
        category: 'Other'
    });

    const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null);

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

    // Memoized calculations
    const walletStats = useMemo(() => {
        const transactions = walletData.transactions || [];
        const totalIncome = transactions
            .filter(t => t.type === 'INCOME' || t.type === 'TRANSFER_IN')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = transactions
            .filter(t => t.type === 'EXPENSE' || t.type === 'TRANSFER_OUT')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            totalIncome,
            totalExpenses,
            netFlow: totalIncome - totalExpenses,
            transactionCount: transactions.length,
        };
    }, [walletData.transactions]);

    // Memoized filtered and sorted transactions
    const processedTransactions = useMemo(() => {
        let filtered = Array.isArray(walletData.transactions) ? [...walletData.transactions] : [];

        // Apply search filter
        if (tableState.search) {
            const searchLower = tableState.search.toLowerCase();
            filtered = filtered.filter(t =>
                (t.description || '').toLowerCase().includes(searchLower) ||
                (t.category || '').toLowerCase().includes(searchLower)
            );
        }

        // Apply type filter
        if (tableState.typeFilter !== 'all') {
            filtered = filtered.filter(t => t.type === tableState.typeFilter);
        }

        // Apply category filter
        if (tableState.categoryFilter !== 'all') {
            filtered = filtered.filter(t => t.category === tableState.categoryFilter);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            const aVal = a[tableState.sortConfig.key];
            const bVal = b[tableState.sortConfig.key];

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return tableState.sortConfig.direction === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return tableState.sortConfig.direction === 'asc'
                    ? aVal - bVal
                    : bVal - aVal;
            }

            return 0;
        });

        return filtered;
    }, [walletData.transactions, tableState]);

    // Memoized pagination
    const paginatedTransactions = useMemo(() => {
        const startIndex = (tableState.currentPage - 1) * itemsPerPage;
        return processedTransactions.slice(startIndex, startIndex + itemsPerPage);
    }, [processedTransactions, tableState.currentPage, itemsPerPage]);

    const totalPages = Math.ceil(processedTransactions.length / itemsPerPage);

    // Memoized filter options - ensure all options are valid
    const filterOptions = useMemo(() => {
        const transactions = Array.isArray(walletData.transactions) ? walletData.transactions : [];
        const availableCategories = [...new Set(transactions.map(t => t.category))].filter(Boolean);
        const availableTypes = ['INCOME', 'EXPENSE', 'TRANSFER_IN', 'TRANSFER_OUT'];

        return {
            categories: availableCategories,
            types: availableTypes,
        };
    }, [walletData.transactions]);

    // Reset invalid filters when options change
    useEffect(() => {
        const { categories: availableCategories, types: availableTypes } = filterOptions;

        // Reset category filter if current selection is not available
        if (tableState.categoryFilter !== 'all' && !availableCategories.includes(tableState.categoryFilter)) {
            setTableState(prev => ({ ...prev, categoryFilter: 'all' }));
        }

        // Reset type filter if current selection is not available
        if (tableState.typeFilter !== 'all' && !availableTypes.includes(tableState.typeFilter)) {
            setTableState(prev => ({ ...prev, typeFilter: 'all' }));
        }
    }, [filterOptions, tableState.categoryFilter, tableState.typeFilter]);

    // Optimized data fetching
    const fetchWalletData = useCallback(async () => {
        if (!session?.user?.id) return;

        try {
            setWalletData(prev => ({ ...prev, loading: true, error: null }));

            const [walletResponse, transactionsResponse] = await Promise.all([
                Axios.get(`/api/wallets?userID=${session.user.id}`),
                Axios.get(`/api/wallet-transactions?walletID=${walletId}&userID=${session.user.id}`)
            ]);

            const foundWallet = walletResponse.data.Data?.find((w: Wallet) => w._id === walletId);

            if (!foundWallet) {
                throw new Error('Wallet not found');
            }

            const transactionsData = Array.isArray(transactionsResponse.data.Data) ? transactionsResponse.data.Data : [];

            setWalletData({
                wallet: foundWallet,
                allWallets: Array.isArray(walletResponse.data.Data) ? walletResponse.data.Data : [],
                transactions: transactionsData,
                loading: false,
                error: null,
            });

            // Update form with wallet data
            setEditWalletForm({
                name: foundWallet.name,
                type: foundWallet.type,
                currency: foundWallet.currency,
                isActive: foundWallet.isActive
            });

        } catch (err: any) {
            console.error('Error fetching wallet data:', err);
            setWalletData(prev => ({
                ...prev,
                loading: false,
                error: err.response?.data?.error || err.message || 'Failed to load wallet data',
            }));
        }
    }, [session?.user?.id, walletId]);

    // Initial data fetch
    useEffect(() => {
        fetchWalletData();
    }, [fetchWalletData]);

    // Event handlers
    const handleModalToggle = useCallback((modalType: keyof typeof modals, isOpen?: boolean) => {
        setModals(prev => ({
            ...prev,
            [modalType]: isOpen !== undefined ? isOpen : !prev[modalType]
        }));
    }, []);

    const handleTableStateChange = useCallback((key: keyof typeof tableState, value: any) => {
        setTableState(prev => ({
            ...prev,
            [key]: value,
            // Reset page when filters change
            ...(key !== 'currentPage' ? { currentPage: 1 } : {})
        }));
    }, []);

    const handleSort = useCallback((key: keyof WalletTransaction) => {
        setTableState(prev => ({
            ...prev,
            sortConfig: {
                key,
                direction: prev.sortConfig.key === key && prev.sortConfig.direction === 'asc' ? 'desc' : 'asc'
            }
        }));
    }, []);

    const handleEditWallet = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            console.log('Submitting wallet update:', editWalletForm); // Debug log

            const response = await Axios.put(`/api/wallets/${walletId}`, {
                ...editWalletForm,
                userID: session?.user?.id
            });

            console.log('Update response:', response.data); // Debug log

            if (response.data.Status === 1) {
                handleModalToggle('editWallet', false);
                fetchWalletData();
            } else {
                console.error('Update failed:', response.data.Message);
                setWalletData(prev => ({
                    ...prev,
                    error: response.data.Message || 'Failed to update wallet'
                }));
            }
        } catch (err: any) {
            console.error('Error updating wallet:', err);
            console.error('Error response:', err.response?.data);
            setWalletData(prev => ({
                ...prev,
                error: err.response?.data?.Message || err.response?.data?.message || err.message || 'Failed to update wallet'
            }));
        }
    }, [editWalletForm, session?.user?.id, walletId, handleModalToggle, fetchWalletData]);

    const handleAddTransaction = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await Axios.post('/api/wallet-transactions', {
                userID: session?.user?.id,
                fromWalletID: walletId,
                amount: transactionForm.amount,
                title: transactionForm.description || `${transactionForm.type} Transaction`,
                description: transactionForm.description,
                financialType: transactionForm.type,
                category: transactionForm.category,
                paymentMethod: 'CASH'
            });

            if (response.data.Status === 1) {
                handleModalToggle('addTransaction', false);
                setTransactionForm({
                    type: 'EXPENSE',
                    amount: 0,
                    description: '',
                    category: 'Other'
                });
                fetchWalletData();
            } else {
                setWalletData(prev => ({
                    ...prev,
                    error: response.data.Message || 'Failed to add transaction'
                }));
            }
        } catch (err: any) {
            console.error('Error adding transaction:', err);
            setWalletData(prev => ({
                ...prev,
                error: err.response?.data?.Message || 'Failed to add transaction'
            }));
        }
    }, [transactionForm, session?.user?.id, walletId, handleModalToggle, fetchWalletData]);

    const handleEditTransaction = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedTransaction) return;

        try {
            const response = await Axios.put(`/api/wallet-transactions/${selectedTransaction._id}`, {
                ...transactionForm,
                userID: session?.user?.id
            });

            if (response.data.Status === 1) {
                handleModalToggle('editTransaction', false);
                setSelectedTransaction(null);
                fetchWalletData();
            } else {
                setWalletData(prev => ({
                    ...prev,
                    error: response.data.Message || 'Failed to update transaction'
                }));
            }
        } catch (err: any) {
            console.error('Error updating transaction:', err);
            setWalletData(prev => ({
                ...prev,
                error: err.response?.data?.Message || 'Failed to update transaction'
            }));
        }
    }, [selectedTransaction, transactionForm, session?.user?.id, handleModalToggle, fetchWalletData]);

    const handleDeleteTransaction = useCallback(async () => {
        if (!selectedTransaction) return;

        try {
            const response = await Axios.delete(`/api/wallet-transactions/${selectedTransaction._id}?userID=${session?.user?.id}`);

            if (response.data.Status === 1) {
                handleModalToggle('deleteTransaction', false);
                setSelectedTransaction(null);
                fetchWalletData();
            } else {
                setWalletData(prev => ({
                    ...prev,
                    error: response.data.Message || 'Failed to delete transaction'
                }));
            }
        } catch (err: any) {
            console.error('Error deleting transaction:', err);
            setWalletData(prev => ({
                ...prev,
                error: err.response?.data?.Message || 'Failed to delete transaction'
            }));
        }
    }, [selectedTransaction, session?.user?.id, handleModalToggle, fetchWalletData]);

    const openEditTransaction = useCallback((transaction: WalletTransaction) => {
        setSelectedTransaction(transaction);
        setTransactionForm({
            type: transaction.type as 'INCOME' | 'EXPENSE',
            amount: transaction.amount,
            description: transaction.description,
            category: transaction.category
        });
        handleModalToggle('editTransaction', true);
    }, [handleModalToggle]);

    const openDeleteTransaction = useCallback((transaction: WalletTransaction) => {
        setSelectedTransaction(transaction);
        handleModalToggle('deleteTransaction', true);
    }, [handleModalToggle]);

    const handleWalletSwitch = useCallback((newWalletId: string) => {
        if (onWalletSwitch) {
            onWalletSwitch(newWalletId);
        }
    }, [onWalletSwitch]);

    if (walletData.loading) {
        return (
            <div className="flex justify-center items-center min-h-96">
                <Spinner size="lg" />
            </div>
        );
    }

    if (walletData.error) {
        return (
            <Card className="max-w-md mx-auto">
                <CardBody className="text-center py-8">
                    <p className="text-danger mb-4">{walletData.error}</p>
                    <Button color="primary" onClick={fetchWalletData}>
                        Try Again
                    </Button>
                </CardBody>
            </Card>
        );
    }

    if (!walletData.wallet) {
        return (
            <Card className="max-w-md mx-auto">
                <CardBody className="text-center py-8">
                    <p className="text-default-500 mb-4">Wallet not found</p>
                    <Button color="primary" onClick={onBack}>
                        Go Back
                    </Button>
                </CardBody>
            </Card>
        );
    }

    const WalletIcon = getWalletIcon(walletData.wallet.type);

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            {/* Clean Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        isIconOnly
                        variant="light"
                        onClick={onBack}
                        size="sm"
                        className="hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                    </Button>

                    {/* Simple Wallet Switcher */}
                    <Dropdown>
                        <DropdownTrigger>
                            <Button
                                variant="light"
                                className="h-auto py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-800"
                                endContent={<ChevronDownIcon className="w-3 h-3 text-gray-400" />}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <div className="text-left">
                                        <div className="font-medium text-lg">{walletData.wallet.name}</div>
                                        <div className="text-xs text-gray-500">
                                            {formatCurrency(walletData.wallet.balance, walletData.wallet.currency)}
                                        </div>
                                    </div>
                                </div>
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label="Switch wallet"
                            className="min-w-64"
                        >
                            {walletData.allWallets.map((wallet) => {
                                const isSelected = wallet._id === walletId;

                                return (
                                    <DropdownItem
                                        key={wallet._id}
                                        onClick={() => handleWalletSwitch(wallet._id)}
                                        className={isSelected ? "bg-gray-50 dark:bg-gray-800" : ""}
                                        startContent={
                                            <div className={`w-2 h-2 rounded-full ${wallet.type === 'BANK' ? 'bg-blue-500' :
                                                    wallet.type === 'UPI' ? 'bg-purple-500' : 'bg-green-500'
                                                }`}></div>
                                        }
                                        endContent={isSelected ? <CheckIcon className="w-3 h-3" /> : null}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">{wallet.name}</span>
                                            <span className="text-xs text-gray-500">
                                                {formatCurrency(wallet.balance, wallet.currency)}
                                            </span>
                                        </div>
                                    </DropdownItem>
                                );
                            })}
                        </DropdownMenu>
                    </Dropdown>
                </div>

                <Button
                    variant="light"
                    size="sm"
                    startContent={<PencilIcon className="w-4 h-4" />}
                    onClick={() => handleModalToggle('editWallet', true)}
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                    Edit
                </Button>
            </div>

            {/* Minimal Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Balance</div>
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(walletData.wallet.balance, walletData.wallet.currency)}
                    </div>
                </div>

                <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Income</div>
                    <div className="text-2xl font-semibold text-green-600">
                        {formatCurrency(walletStats.totalIncome, walletData.wallet.currency)}
                    </div>
                </div>

                <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Expenses</div>
                    <div className="text-2xl font-semibold text-red-600">
                        {formatCurrency(walletStats.totalExpenses, walletData.wallet.currency)}
                    </div>
                </div>

                <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Transactions</div>
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        {walletStats.transactionCount}
                    </div>
                </div>
            </div>

            {/* Transactions */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Transactions</h2>
                            <p className="text-sm text-gray-500">{processedTransactions.length} total</p>
                        </div>
                        <Button
                            size="sm"
                            variant="light"
                            startContent={<PlusIcon className="w-4 h-4" />}
                            onClick={() => handleModalToggle('addTransaction', true)}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                        >
                            Add
                        </Button>
                    </div>
                </div>

                <div className="p-6">
                    {/* Simple Filters */}
                    <div className="flex gap-3 mb-6">
                        <Input
                            size="sm"
                            placeholder="Search..."
                            className="max-w-xs"
                            variant="bordered"
                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
                            value={tableState.search}
                            onChange={(e) => handleTableStateChange('search', e.target.value)}
                        />

                        <Select
                            size="sm"
                            placeholder="Type"
                            className="max-w-32"
                            variant="bordered"
                            selectedKeys={tableState.typeFilter !== 'all' ? [tableState.typeFilter] : []}
                            onSelectionChange={(keys) => {
                                const selectedKey = Array.from(keys)[0] as string;
                                handleTableStateChange('typeFilter', selectedKey || 'all');
                            }}
                        >
                            <SelectItem key="all">All</SelectItem>
                            <SelectItem key="INCOME">Income</SelectItem>
                            <SelectItem key="EXPENSE">Expense</SelectItem>
                        </Select>

                        <Select
                            size="sm"
                            placeholder="Category"
                            className="max-w-40"
                            variant="bordered"
                            selectedKeys={tableState.categoryFilter !== 'all' ? [tableState.categoryFilter] : []}
                            onSelectionChange={(keys) => {
                                const selectedKey = Array.from(keys)[0] as string;
                                handleTableStateChange('categoryFilter', selectedKey || 'all');
                            }}
                        >
                            <SelectItem key="all">All</SelectItem>
                            <SelectItem key="Food & Dining">Food & Dining</SelectItem>
                            <SelectItem key="Transportation">Transportation</SelectItem>
                            <SelectItem key="Shopping">Shopping</SelectItem>
                            <SelectItem key="Entertainment">Entertainment</SelectItem>
                            <SelectItem key="Bills & Utilities">Bills & Utilities</SelectItem>
                            <SelectItem key="Healthcare">Healthcare</SelectItem>
                            <SelectItem key="Education">Education</SelectItem>
                            <SelectItem key="Travel">Travel</SelectItem>
                            <SelectItem key="Investments">Investments</SelectItem>
                            <SelectItem key="Salary">Salary</SelectItem>
                            <SelectItem key="Business">Business</SelectItem>
                            <SelectItem key="Other">Other</SelectItem>
                        </Select>
                    </div>

                    {/* Transaction List */}
                    {paginatedTransactions.length > 0 ? (
                        <div className="space-y-3">
                            {paginatedTransactions.map((transaction) => {
                                const isIncome = transaction.type === 'INCOME' || transaction.type === 'TRANSFER_IN';

                                return (
                                    <div
                                        key={transaction._id}
                                        className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer group"
                                        onClick={() => openEditTransaction(transaction)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${isIncome ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                                    {transaction.description || 'No description'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {transaction.category} • {new Date(transaction.createdAt).toLocaleDateString()}
                                                    {transaction.upiWalletUsed && (
                                                        <span className="ml-2 text-orange-600 dark:text-orange-400 font-medium">
                                                            • via {transaction.upiWalletUsed.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={`font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                                                {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, walletData.wallet?.currency || 'USD')}
                                            </div>
                                            <Dropdown>
                                                <DropdownTrigger>
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <EllipsisVerticalIcon className="w-4 h-4" />
                                                    </Button>
                                                </DropdownTrigger>
                                                <DropdownMenu>
                                                    <DropdownItem
                                                        key="edit"
                                                        startContent={<PencilIcon className="w-4 h-4" />}
                                                        onClick={() => openEditTransaction(transaction)}
                                                    >
                                                        Edit
                                                    </DropdownItem>
                                                    <DropdownItem
                                                        key="delete"
                                                        className="text-danger"
                                                        color="danger"
                                                        startContent={<TrashIcon className="w-4 h-4" />}
                                                        onClick={() => openDeleteTransaction(transaction)}
                                                    >
                                                        Delete
                                                    </DropdownItem>
                                                </DropdownMenu>
                                            </Dropdown>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500 mb-4">No transactions found</p>
                            <Button
                                size="sm"
                                variant="light"
                                onClick={() => handleModalToggle('addTransaction', true)}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                            >
                                Add your first transaction
                            </Button>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                            <Pagination
                                total={totalPages}
                                page={tableState.currentPage}
                                onChange={(page) => handleTableStateChange('currentPage', page)}
                                showControls
                                size="sm"
                                className="text-gray-600"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Clean Modals */}
            <Modal
                isOpen={modals.editWallet}
                onClose={() => handleModalToggle('editWallet', false)}
                size="md"
                classNames={{
                    base: "bg-white dark:bg-gray-900",
                    header: "border-b border-gray-200 dark:border-gray-800",
                    body: "py-6",
                    footer: "border-t border-gray-200 dark:border-gray-800"
                }}
            >
                <ModalContent>
                    <form onSubmit={handleEditWallet}>
                        <ModalHeader>
                            <div>
                                <h3 className="text-lg font-medium">Edit Wallet</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Current type: {editWalletForm.type} | Name: {editWalletForm.name}
                                </p>
                                {walletData.wallet?.type === 'UPI' && (
                                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                                        <p className="text-xs text-blue-700 dark:text-blue-300">
                                            🔒 UPI Wallet Type Locked: UPI wallets are specifically designed for transfers between accounts and cannot be converted to other wallet types.
                                        </p>
                                    </div>
                                )}
                                {walletData.wallet?.type !== 'UPI' && walletStats.transactionCount > 0 && (
                                    <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                                        <p className="text-xs text-amber-700 dark:text-amber-300">
                                            ⚠️ Cannot convert to UPI: This wallet has {walletStats.transactionCount} transactions.
                                            You can freely switch between Bank and Digital Wallet types. UPI is only for transfers between accounts.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Wallet Name
                                    </label>
                                    <Input
                                        value={editWalletForm.name}
                                        onChange={(e) => setEditWalletForm(prev => ({
                                            ...prev,
                                            name: e.target.value
                                        }))}
                                        variant="bordered"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Type
                                    </label>
                                    <Select
                                        selectedKeys={editWalletForm.type ? [editWalletForm.type] : []}
                                        onSelectionChange={(keys) => {
                                            const selectedKey = Array.from(keys)[0];
                                            if (selectedKey) {
                                                const type = selectedKey as 'WALLET' | 'BANK' | 'UPI';
                                                console.log('Changing wallet type to:', type); // Debug log
                                                setEditWalletForm(prev => ({
                                                    ...prev,
                                                    type
                                                }));
                                            }
                                        }}
                                        variant="bordered"
                                        placeholder="Select wallet type"
                                        disallowEmptySelection
                                        isDisabled={walletData.wallet?.type === 'UPI'}
                                        description={
                                            walletData.wallet?.type === 'UPI'
                                                ? "UPI wallet type cannot be changed. UPI wallets are designed specifically for transfers between accounts."
                                                : walletStats.transactionCount > 0
                                                    ? "UPI cannot be selected - wallet has transactions. UPI wallets are only for transfers between accounts."
                                                    : "You can freely switch between Bank and Digital Wallet. UPI is only for transfers between accounts."
                                        }
                                    >
                                        <SelectItem key="WALLET">Digital Wallet</SelectItem>
                                        <SelectItem key="BANK">Bank Account</SelectItem>
                                        <SelectItem
                                            key="UPI"
                                            isDisabled={walletStats.transactionCount > 0}
                                        >
                                            UPI (Transfer Only)
                                        </SelectItem>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Currency
                                    </label>
                                    <Input
                                        value={editWalletForm.currency}
                                        onChange={(e) => setEditWalletForm(prev => ({
                                            ...prev,
                                            currency: e.target.value
                                        }))}
                                        variant="bordered"
                                        required
                                    />
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                variant="light"
                                onClick={() => handleModalToggle('editWallet', false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                color="primary"
                                className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                            >
                                Save
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>

            <Modal
                isOpen={modals.addTransaction}
                onClose={() => handleModalToggle('addTransaction', false)}
                size="md"
                classNames={{
                    base: "bg-white dark:bg-gray-900",
                    header: "border-b border-gray-200 dark:border-gray-800",
                    body: "py-6",
                    footer: "border-t border-gray-200 dark:border-gray-800"
                }}
            >
                <ModalContent>
                    <form onSubmit={handleAddTransaction}>
                        <ModalHeader>
                            <h3 className="text-lg font-medium">Add Transaction</h3>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Type
                                    </label>
                                    <Select
                                        selectedKeys={[transactionForm.type]}
                                        onSelectionChange={(keys) => {
                                            const type = Array.from(keys)[0] as 'INCOME' | 'EXPENSE';
                                            setTransactionForm(prev => ({
                                                ...prev,
                                                type
                                            }));
                                        }}
                                        variant="bordered"
                                    >
                                        <SelectItem key="INCOME">Income</SelectItem>
                                        <SelectItem key="EXPENSE">Expense</SelectItem>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Amount
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={transactionForm.amount.toString()}
                                        onChange={(e) => setTransactionForm(prev => ({
                                            ...prev,
                                            amount: parseFloat(e.target.value) || 0
                                        }))}
                                        variant="bordered"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Description
                                    </label>
                                    <Input
                                        value={transactionForm.description}
                                        onChange={(e) => setTransactionForm(prev => ({
                                            ...prev,
                                            description: e.target.value
                                        }))}
                                        variant="bordered"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Category
                                    </label>
                                    <Select
                                        selectedKeys={[transactionForm.category]}
                                        onSelectionChange={(keys) => {
                                            const category = Array.from(keys)[0] as string;
                                            setTransactionForm(prev => ({
                                                ...prev,
                                                category
                                            }));
                                        }}
                                        variant="bordered"
                                    >
                                        {categories.map(category => (
                                            <SelectItem key={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                variant="light"
                                onClick={() => handleModalToggle('addTransaction', false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                            >
                                Add
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>

            {/* Edit Transaction Modal */}
            <Modal
                isOpen={modals.editTransaction}
                onClose={() => handleModalToggle('editTransaction', false)}
                size="md"
                classNames={{
                    base: "bg-white dark:bg-gray-900",
                    header: "border-b border-gray-200 dark:border-gray-800",
                    body: "py-6",
                    footer: "border-t border-gray-200 dark:border-gray-800"
                }}
            >
                <ModalContent>
                    <form onSubmit={handleEditTransaction}>
                        <ModalHeader>
                            <h3 className="text-lg font-medium">Edit Transaction</h3>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Type
                                    </label>
                                    <Select
                                        selectedKeys={[transactionForm.type]}
                                        onSelectionChange={(keys) => {
                                            const type = Array.from(keys)[0] as 'INCOME' | 'EXPENSE';
                                            setTransactionForm(prev => ({
                                                ...prev,
                                                type
                                            }));
                                        }}
                                        variant="bordered"
                                    >
                                        <SelectItem key="INCOME">Income</SelectItem>
                                        <SelectItem key="EXPENSE">Expense</SelectItem>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Amount
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={transactionForm.amount.toString()}
                                        onChange={(e) => setTransactionForm(prev => ({
                                            ...prev,
                                            amount: parseFloat(e.target.value) || 0
                                        }))}
                                        variant="bordered"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Description
                                    </label>
                                    <Input
                                        value={transactionForm.description}
                                        onChange={(e) => setTransactionForm(prev => ({
                                            ...prev,
                                            description: e.target.value
                                        }))}
                                        variant="bordered"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Category
                                    </label>
                                    <Select
                                        selectedKeys={[transactionForm.category]}
                                        onSelectionChange={(keys) => {
                                            const category = Array.from(keys)[0] as string;
                                            setTransactionForm(prev => ({
                                                ...prev,
                                                category
                                            }));
                                        }}
                                        variant="bordered"
                                    >
                                        {categories.map(category => (
                                            <SelectItem key={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                variant="light"
                                onClick={() => handleModalToggle('editTransaction', false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                            >
                                Save
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>

            {/* Delete Transaction Modal */}
            <Modal
                isOpen={modals.deleteTransaction}
                onClose={() => handleModalToggle('deleteTransaction', false)}
                size="sm"
                classNames={{
                    base: "bg-white dark:bg-gray-900",
                    header: "border-b border-gray-200 dark:border-gray-800",
                    body: "py-6",
                    footer: "border-t border-gray-200 dark:border-gray-800"
                }}
            >
                <ModalContent>
                    <ModalHeader>
                        <h3 className="text-lg font-medium">Delete Transaction</h3>
                    </ModalHeader>
                    <ModalBody>
                        <p className="text-gray-600 dark:text-gray-400">
                            Are you sure you want to delete this transaction? This action cannot be undone.
                        </p>
                        {selectedTransaction && (
                            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                    {selectedTransaction.description}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {formatCurrency(selectedTransaction.amount, walletData.wallet.currency)} • {selectedTransaction.category}
                                </p>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="light"
                            onClick={() => handleModalToggle('deleteTransaction', false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="danger"
                            onClick={handleDeleteTransaction}
                            className="bg-red-600 text-white"
                        >
                            Delete
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
};

export default WalletDetailView;
