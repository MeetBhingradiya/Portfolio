'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
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
    ShoppingBagIcon,
    TruckIcon,
    SparklesIcon,
    BoltIcon,
    HeartIcon,
    AcademicCapIcon,
    GlobeAltIcon,
    BriefcaseIcon,
    CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { useSession } from '../../Lib/auth-client';
import { Axios } from '../../Utils/Axios';
import { useDesignTheme } from '../../Hooks/useDesignTheme';
import { LiquidGlassCard, LiquidGlassButton } from '../LiquidGlass';
import { OneUICard, OneUIButton } from '../OneUI';

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
    { name: 'Food & Dining', icon: ShoppingBagIcon, color: '#f59e0b' },
    { name: 'Transportation', icon: TruckIcon, color: '#3b82f6' },
    { name: 'Shopping', icon: ShoppingBagIcon, color: '#ec4899' },
    { name: 'Entertainment', icon: SparklesIcon, color: '#8b5cf6' },
    { name: 'Bills & Utilities', icon: BoltIcon, color: '#ef4444' },
    { name: 'Healthcare', icon: HeartIcon, color: '#10b981' },
    { name: 'Education', icon: AcademicCapIcon, color: '#6366f1' },
    { name: 'Travel', icon: GlobeAltIcon, color: '#14b8a6' },
    { name: 'Investments', icon: ArrowTrendingUpIcon, color: '#059669' },
    { name: 'Salary', icon: CurrencyDollarIcon, color: '#10b981' },
    { name: 'Business', icon: BriefcaseIcon, color: '#0891b2' },
    { name: 'Other', icon: EllipsisVerticalIcon, color: '#6b7280' }
];

const WalletDetailView: React.FC<WalletDetailViewProps> = ({ walletId, onBack, onWalletSwitch }) => {
    const { data: session } = useSession();
    const { designTheme, palette } = useDesignTheme();
    const isApple = designTheme === 'apple';

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

    // Get wallet type color
    const getWalletColor = () => {
        if (!walletData.wallet) return isApple ? '#6b7280' : '#8a94a6';
        if (walletData.wallet.type === 'BANK') return isApple ? '#3b82f6' : '#5b9aff';
        if (walletData.wallet.type === 'UPI') return isApple ? '#f97316' : '#ff8c42';
        return isApple ? '#6b7280' : '#8a94a6';
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
                {isApple ? (
                    <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onClick={onBack}
                        className="hover:scale-105 transition-transform"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                    </Button>
                ) : (
                    <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onClick={onBack}
                        className="hover:scale-105 transition-transform"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                    </Button>
                )}
                <h1 className={`text-2xl ${isApple ? 'font-semibold' : 'font-black'}`} style={{ color: palette.textPrimary }}>
                    Wallet Details
                </h1>
            </div>

            {/* Wallet Info Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {isApple ? (
                    <LiquidGlassCard>
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                {/* Wallet Icon & Name */}
                                <div className="flex items-center gap-4">
                                    <div 
                                        className="p-4 rounded-2xl"
                                        style={{ backgroundColor: `${getWalletColor()}20` }}
                                    >
                                        <WalletIcon 
                                            className="h-8 w-8" 
                                            style={{ color: getWalletColor() }}
                                        />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-semibold mb-1" style={{ color: palette.textPrimary }}>
                                            {walletData.wallet.name}
                                        </h2>
                                        <div className="flex items-center gap-3">
                                            <Chip
                                                size="sm"
                                                variant="flat"
                                                className="uppercase text-xs font-semibold"
                                                style={{ 
                                                    backgroundColor: `${getWalletColor()}15`,
                                                    color: getWalletColor()
                                                }}
                                            >
                                                {walletData.wallet.type}
                                            </Chip>
                                            <Chip
                                                size="sm"
                                                variant="dot"
                                                color={walletData.wallet.isActive ? 'success' : 'default'}
                                            >
                                                {walletData.wallet.isActive ? 'Active' : 'Inactive'}
                                            </Chip>
                                        </div>
                                    </div>
                                </div>

                                {/* Edit Button */}
                                <Button
                                    size="sm"
                                    variant="light"
                                    onClick={() => handleModalToggle('editWallet', true)}
                                    className="hover:scale-105 transition-transform"
                                >
                                    <PencilIcon className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                            </div>

                            {/* Balance Display */}
                            <div className="mb-6">
                                <p className="text-sm mb-2" style={{ color: palette.textSecondary }}>Current Balance</p>
                                <p className="text-4xl font-bold" style={{ color: palette.textPrimary }}>
                                    {formatCurrency(walletData.wallet.balance, walletData.wallet.currency)}
                                </p>
                            </div>

                            {/* Wallet Switcher */}
                            {walletData.allWallets.length > 1 && (
                                <div className="pt-4" style={{ borderTop: `1px solid ${palette.border}` }}>
                                    <Dropdown>
                                        <DropdownTrigger>
                                            <Button
                                                variant="light"
                                                size="sm"
                                                endContent={<ChevronDownIcon className="w-4 h-4" />}
                                                className="text-sm"
                                                style={{ color: palette.textSecondary }}
                                                aria-label="Switch to another wallet"
                                            >
                                                Switch Wallet
                                            </Button>
                                        </DropdownTrigger>
                                        <DropdownMenu aria-label="Switch wallet">
                                            {walletData.allWallets
                                                .filter(w => w._id !== walletId)
                                                .map((wallet) => (
                                                    <DropdownItem
                                                        key={wallet._id}
                                                        onClick={() => handleWalletSwitch(wallet._id)}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div 
                                                                className="w-2 h-2 rounded-full"
                                                                style={{
                                                                    backgroundColor: wallet.type === 'BANK' ? '#3b82f6' :
                                                                        wallet.type === 'UPI' ? '#f97316' : '#6b7280'
                                                                }}
                                                            />
                                                            <span>{wallet.name}</span>
                                                        </div>
                                                    </DropdownItem>
                                                ))}
                                        </DropdownMenu>
                                    </Dropdown>
                                </div>
                            )}
                        </div>
                    </LiquidGlassCard>
                ) : (
                    <OneUICard>
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                {/* Wallet Icon & Name */}
                                <div className="flex items-center gap-4">
                                    <div 
                                        className="p-4 rounded-3xl"
                                        style={{ backgroundColor: `${getWalletColor()}25` }}
                                    >
                                        <WalletIcon 
                                            className="h-8 w-8" 
                                            style={{ color: getWalletColor() }}
                                        />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black mb-1" style={{ color: palette.textPrimary }}>
                                            {walletData.wallet.name}
                                        </h2>
                                        <div className="flex items-center gap-3">
                                            <Chip
                                                size="sm"
                                                variant="flat"
                                                className="uppercase text-xs font-black border"
                                                style={{ 
                                                    backgroundColor: `${getWalletColor()}20`,
                                                    color: getWalletColor(),
                                                    borderColor: `${getWalletColor()}30`
                                                }}
                                            >
                                                {walletData.wallet.type}
                                            </Chip>
                                            <Chip
                                                size="sm"
                                                variant="dot"
                                                color={walletData.wallet.isActive ? 'success' : 'default'}
                                                className="font-bold"
                                            >
                                                {walletData.wallet.isActive ? 'Active' : 'Inactive'}
                                            </Chip>
                                        </div>
                                    </div>
                                </div>

                                {/* Edit Button */}
                                <Button
                                    size="sm"
                                    variant="light"
                                    onClick={() => handleModalToggle('editWallet', true)}
                                    className="font-bold hover:scale-105 transition-transform"
                                >
                                    <PencilIcon className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                            </div>

                            {/* Balance Display */}
                            <div className="mb-6">
                                <p className="text-sm font-bold mb-2" style={{ color: palette.textSecondary }}>Current Balance</p>
                                <p className="text-4xl font-black" style={{ color: palette.textPrimary }}>
                                    {formatCurrency(walletData.wallet.balance, walletData.wallet.currency)}
                                </p>
                            </div>

                            {/* Wallet Switcher */}
                            {walletData.allWallets.length > 1 && (
                                <div className="pt-4" style={{ borderTop: `1px solid ${palette.border}` }}>
                                    <Dropdown>
                                        <DropdownTrigger>
                                            <Button
                                                variant="light"
                                                size="sm"
                                                endContent={<ChevronDownIcon className="w-4 h-4" />}
                                                className="text-sm font-bold"
                                                style={{ color: palette.textSecondary }}
                                                aria-label="Switch to another wallet"
                                            >
                                                Switch Wallet
                                            </Button>
                                        </DropdownTrigger>
                                        <DropdownMenu aria-label="Switch wallet">
                                            {walletData.allWallets
                                                .filter(w => w._id !== walletId)
                                                .map((wallet) => (
                                                    <DropdownItem
                                                        key={wallet._id}
                                                        onClick={() => handleWalletSwitch(wallet._id)}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div 
                                                                className="w-2 h-2 rounded-full"
                                                                style={{
                                                                    backgroundColor: wallet.type === 'BANK' ? '#5b9aff' :
                                                                        wallet.type === 'UPI' ? '#ff8c42' : '#8a94a6'
                                                                }}
                                                            />
                                                            <span className="font-bold">{wallet.name}</span>
                                                        </div>
                                                    </DropdownItem>
                                                ))}
                                        </DropdownMenu>
                                    </Dropdown>
                                </div>
                            )}
                        </div>
                    </OneUICard>
                )}
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{isApple ? (
                    <LiquidGlassCard className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium" style={{ color: palette.textSecondary }}>Total Income</p>
                                <p className="text-xl font-bold text-green-600">
                                    {formatCurrency(walletStats.totalIncome, walletData.wallet.currency)}
                                </p>
                            </div>
                        </div>
                    </LiquidGlassCard>
                ) : (
                    <OneUICard className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-green-500/20">
                                <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs font-black" style={{ color: palette.textSecondary }}>Total Income</p>
                                <p className="text-xl font-black text-green-600">
                                    {formatCurrency(walletStats.totalIncome, walletData.wallet.currency)}
                                </p>
                            </div>
                        </div>
                    </OneUICard>
                )}

                {isApple ? (
                    <LiquidGlassCard className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/10">
                                <ArrowTrendingDownIcon className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium" style={{ color: palette.textSecondary }}>Total Expenses</p>
                                <p className="text-xl font-bold text-red-600">
                                    {formatCurrency(walletStats.totalExpenses, walletData.wallet.currency)}
                                </p>
                            </div>
                        </div>
                    </LiquidGlassCard>
                ) : (
                    <OneUICard className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-red-500/20">
                                <ArrowTrendingDownIcon className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs font-black" style={{ color: palette.textSecondary }}>Total Expenses</p>
                                <p className="text-xl font-black text-red-600">
                                    {formatCurrency(walletStats.totalExpenses, walletData.wallet.currency)}
                                </p>
                            </div>
                        </div>
                    </OneUICard>
                )}

                {isApple ? (
                    <LiquidGlassCard className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: `${palette.accent}15` }}>
                                <BanknotesIcon className="w-5 h-5" style={{ color: palette.accent }} />
                            </div>
                            <div>
                                <p className="text-xs font-medium" style={{ color: palette.textSecondary }}>Transactions</p>
                                <p className="text-xl font-bold" style={{ color: palette.textPrimary }}>
                                    {walletStats.transactionCount}
                                </p>
                            </div>
                        </div>
                    </LiquidGlassCard>
                ) : (
                    <OneUICard className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl" style={{ backgroundColor: `${palette.accent}20` }}>
                                <BanknotesIcon className="w-5 h-5" style={{ color: palette.accent }} />
                            </div>
                            <div>
                                <p className="text-xs font-black" style={{ color: palette.textSecondary }}>Transactions</p>
                                <p className="text-xl font-black" style={{ color: palette.textPrimary }}>
                                    {walletStats.transactionCount}
                                </p>
                            </div>
                        </div>
                    </OneUICard>
                )}
            </div>

            {/* Transactions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
            >
                {isApple ? (
                    <LiquidGlassCard>
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-semibold" style={{ color: palette.textPrimary }}>
                                        Transactions
                                    </h3>
                                    <p className="text-sm mt-1" style={{ color: palette.textSecondary }}>
                                        {processedTransactions.length} total
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="light"
                                    onClick={() => handleModalToggle('addTransaction', true)}
                                    className="hover:scale-105 transition-transform"
                                >
                                    <PlusIcon className="w-4 h-4 mr-2" />
                                    Add Transaction
                                </Button>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap gap-3 mb-6">
                                <Input
                                    size="sm"
                                    placeholder="Search transactions..."
                                    className="max-w-xs"
                                    variant="bordered"
                                    startContent={<MagnifyingGlassIcon className="w-4 h-4" style={{ color: palette.textSecondary }} />}
                                    value={tableState.search}
                                    onChange={(e) => handleTableStateChange('search', e.target.value)}
                                />

                                <Select
                                    size="sm"
                                    placeholder="All Types"
                                    className="max-w-[140px]"
                                    variant="bordered"
                                    selectedKeys={tableState.typeFilter !== 'all' ? [tableState.typeFilter] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0] as string;
                                        handleTableStateChange('typeFilter', selectedKey || 'all');
                                    }}
                                >
                                    <SelectItem key="all">All Types</SelectItem>
                                    <SelectItem key="INCOME">Income</SelectItem>
                                    <SelectItem key="EXPENSE">Expense</SelectItem>
                                </Select>

                                <Select
                                    size="sm"
                                    placeholder="All Categories"
                                    className="max-w-[160px]"
                                    variant="bordered"
                                    selectedKeys={tableState.categoryFilter !== 'all' ? [tableState.categoryFilter] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0] as string;
                                        handleTableStateChange('categoryFilter', selectedKey || 'all');
                                    }}
                                >
                                    <SelectItem key="all">All Categories</SelectItem>
                                    {categories.map(category => <SelectItem key={category.name}>{category.name}</SelectItem>) as any}
                                </Select>
                            </div>

                            {/* Transaction List */}
                            {paginatedTransactions.length > 0 ? (
                                <div className="space-y-2">
                                    {paginatedTransactions.map((transaction, index) => {
                                        const isIncome = transaction.type === 'INCOME' || transaction.type === 'TRANSFER_IN';
                                        const categoryData = categories.find(c => c.name === transaction.category);
                                        const CategoryIcon = categoryData?.icon || BanknotesIcon;

                                        return (
                                            <motion.div
                                                key={transaction._id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all cursor-pointer group"
                                                onClick={() => openEditTransaction(transaction)}
                                                style={{ borderLeft: `3px solid ${isIncome ? '#10b981' : '#ef4444'}` }}
                                            >
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    {/* Category Icon */}
                                                    <div 
                                                        className="p-2.5 rounded-xl flex-shrink-0"
                                                        style={{ 
                                                            backgroundColor: categoryData ? `${categoryData.color}15` : '#f3f4f6',
                                                        }}
                                                    >
                                                        <CategoryIcon 
                                                            className="w-5 h-5"
                                                            style={{ color: categoryData?.color || '#6b7280' }}
                                                        />
                                                    </div>

                                                    {/* Transaction Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-semibold truncate" style={{ color: palette.textPrimary }}>
                                                                {transaction.description || 'No description'}
                                                            </p>
                                                            {transaction.upiWalletUsed && (
                                                                <Chip size="sm" variant="flat" className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                                                                    <div className="flex items-center gap-1">
                                                                        <ArrowsRightLeftIcon className="w-3 h-3" />
                                                                        <span className="text-xs">{transaction.upiWalletUsed.name}</span>
                                                                    </div>
                                                                </Chip>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs" style={{ color: palette.textSecondary }}>
                                                            <span>{transaction.category}</span>
                                                            <span>•</span>
                                                            <span>{new Date(transaction.createdAt).toLocaleDateString('en-US', { 
                                                                month: 'short', 
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Amount */}
                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    <div className={`text-lg font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                                                        {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, walletData.wallet?.currency || 'USD')}
                                                    </div>
                                                    
                                                    <Dropdown>
                                                        <DropdownTrigger>
                                                            <Button
                                                                isIconOnly
                                                                size="sm"
                                                                variant="light"
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={(e) => e.stopPropagation()}
                                                                aria-label="Transaction actions"
                                                            >
                                                                <EllipsisVerticalIcon className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownTrigger>
                                                        <DropdownMenu>
                                                            <DropdownItem
                                                                key="edit"
                                                                startContent={<PencilIcon className="w-4 h-4" />}
                                                                onPress={() => openEditTransaction(transaction)}
                                                            >
                                                                Edit
                                                            </DropdownItem>
                                                            <DropdownItem
                                                                key="delete"
                                                                className="text-danger"
                                                                color="danger"
                                                                startContent={<TrashIcon className="w-4 h-4" />}
                                                                onPress={() => openDeleteTransaction(transaction)}
                                                            >
                                                                Delete
                                                            </DropdownItem>
                                                        </DropdownMenu>
                                                    </Dropdown>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                                        <BanknotesIcon className="w-8 h-8" style={{ color: palette.textSecondary }} />
                                    </div>
                                    <p className="font-medium mb-2" style={{ color: palette.textPrimary }}>No transactions yet</p>
                                    <p className="text-sm mb-4" style={{ color: palette.textSecondary }}>
                                        Get started by adding your first transaction
                                    </p>
                                    <Button
                                        size="sm"
                                        color="primary"
                                        onClick={() => handleModalToggle('addTransaction', true)}
                                        className="hover:scale-105 transition-transform"
                                    >
                                        <PlusIcon className="w-4 h-4 mr-2" />
                                        Add Transaction
                                    </Button>
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center mt-6 pt-6" style={{ borderTop: `1px solid ${palette.border}` }}>
                                    <Pagination
                                        total={totalPages}
                                        page={tableState.currentPage}
                                        onChange={(page) => handleTableStateChange('currentPage', page)}
                                        size="sm"
                                        showControls
                                    />
                                </div>
                            )}
                        </div>
                    </LiquidGlassCard>
                ) : (
                    <OneUICard>
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-black" style={{ color: palette.textPrimary }}>
                                        Transactions
                                    </h3>
                                    <p className="text-sm font-bold mt-1" style={{ color: palette.textSecondary }}>
                                        {processedTransactions.length} total
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="light"
                                    onClick={() => handleModalToggle('addTransaction', true)}
                                    className="font-bold hover:scale-105 transition-transform"
                                >
                                    <PlusIcon className="w-4 h-4 mr-2" />
                                    Add Transaction
                                </Button>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap gap-3 mb-6">
                                <Input
                                    size="sm"
                                    placeholder="Search transactions..."
                                    className="max-w-xs"
                                    variant="bordered"
                                    startContent={<MagnifyingGlassIcon className="w-4 h-4" style={{ color: palette.textSecondary }} />}
                                    value={tableState.search}
                                    onChange={(e) => handleTableStateChange('search', e.target.value)}
                                />

                                <Select
                                    size="sm"
                                    placeholder="All Types"
                                    className="max-w-[140px]"
                                    variant="bordered"
                                    selectedKeys={tableState.typeFilter !== 'all' ? [tableState.typeFilter] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0] as string;
                                        handleTableStateChange('typeFilter', selectedKey || 'all');
                                    }}
                                >
                                    <SelectItem key="all">All Types</SelectItem>
                                    <SelectItem key="INCOME">Income</SelectItem>
                                    <SelectItem key="EXPENSE">Expense</SelectItem>
                                </Select>

                                <Select
                                    size="sm"
                                    placeholder="All Categories"
                                    className="max-w-[160px]"
                                    variant="bordered"
                                    selectedKeys={tableState.categoryFilter !== 'all' ? [tableState.categoryFilter] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0] as string;
                                        handleTableStateChange('categoryFilter', selectedKey || 'all');
                                    }}
                                >
                                    <SelectItem key="all">All Categories</SelectItem>
                                    {categories.map(category => <SelectItem key={category.name}>{category.name}</SelectItem>) as any}
                                </Select>
                            </div>

                            {/* Transaction List */}
                            {paginatedTransactions.length > 0 ? (
                                <div className="space-y-2">
                                    {paginatedTransactions.map((transaction, index) => {
                                        const isIncome = transaction.type === 'INCOME' || transaction.type === 'TRANSFER_IN';
                                        const categoryData = categories.find(c => c.name === transaction.category);
                                        const CategoryIcon = categoryData?.icon || BanknotesIcon;

                                        return (
                                            <motion.div
                                                key={transaction._id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all cursor-pointer group"
                                                onClick={() => openEditTransaction(transaction)}
                                                style={{ borderLeft: `4px solid ${isIncome ? '#10b981' : '#ef4444'}` }}
                                            >
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    {/* Category Icon */}
                                                    <div 
                                                        className="p-3 rounded-2xl flex-shrink-0"
                                                        style={{ 
                                                            backgroundColor: categoryData ? `${categoryData.color}20` : '#f3f4f6',
                                                        }}
                                                    >
                                                        <CategoryIcon 
                                                            className="w-5 h-5"
                                                            style={{ color: categoryData?.color || '#6b7280' }}
                                                        />
                                                    </div>

                                                    {/* Transaction Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-black truncate" style={{ color: palette.textPrimary }}>
                                                                {transaction.description || 'No description'}
                                                            </p>
                                                            {transaction.upiWalletUsed && (
                                                                <Chip size="sm" variant="flat" className="bg-orange-600/20 text-orange-400 border border-orange-500/30">
                                                                    <div className="flex items-center gap-1">
                                                                        <ArrowsRightLeftIcon className="w-3 h-3" />
                                                                        <span className="text-xs font-bold">{transaction.upiWalletUsed.name}</span>
                                                                    </div>
                                                                </Chip>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs font-bold" style={{ color: palette.textSecondary }}>
                                                            <span>{transaction.category}</span>
                                                            <span>•</span>
                                                            <span>{new Date(transaction.createdAt).toLocaleDateString('en-US', { 
                                                                month: 'short', 
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Amount */}
                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    <div className={`text-lg font-black ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                                                        {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, walletData.wallet?.currency || 'USD')}
                                                    </div>
                                                    
                                                    <Dropdown>
                                                        <DropdownTrigger>
                                                            <Button
                                                                isIconOnly
                                                                size="sm"
                                                                variant="light"
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={(e) => e.stopPropagation()}
                                                                aria-label="Transaction actions"
                                                            >
                                                                <EllipsisVerticalIcon className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownTrigger>
                                                        <DropdownMenu>
                                                            <DropdownItem
                                                                key="edit"
                                                                startContent={<PencilIcon className="w-4 h-4" />}
                                                                onPress={() => openEditTransaction(transaction)}
                                                            >
                                                                Edit
                                                            </DropdownItem>
                                                            <DropdownItem
                                                                key="delete"
                                                                className="text-danger"
                                                                color="danger"
                                                                startContent={<TrashIcon className="w-4 h-4" />}
                                                                onPress={() => openDeleteTransaction(transaction)}
                                                            >
                                                                Delete
                                                            </DropdownItem>
                                                        </DropdownMenu>
                                                    </Dropdown>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
                                        <BanknotesIcon className="w-8 h-8" style={{ color: palette.textSecondary }} />
                                    </div>
                                    <p className="font-black mb-2" style={{ color: palette.textPrimary }}>No transactions yet</p>
                                    <p className="text-sm font-bold mb-4" style={{ color: palette.textSecondary }}>
                                        Get started by adding your first transaction
                                    </p>
                                    <Button
                                        size="sm"
                                        color="primary"
                                        onClick={() => handleModalToggle('addTransaction', true)}
                                        className="font-bold hover:scale-105 transition-transform"
                                    >
                                        <PlusIcon className="w-4 h-4 mr-2" />
                                        Add Transaction
                                    </Button>
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center mt-6 pt-6" style={{ borderTop: `1px solid ${palette.border}` }}>
                                    <Pagination
                                        total={totalPages}
                                        page={tableState.currentPage}
                                        onChange={(page) => handleTableStateChange('currentPage', page)}
                                        size="sm"
                                        showControls
                                    />
                                </div>
                            )}
                        </div>
                    </OneUICard>
                )}
            </motion.div>

            {/* Modals */}
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
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Transaction Type
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { 
                                                type: 'INCOME' as const, 
                                                label: 'Income',
                                                description: 'Money received',
                                                icon: ArrowTrendingUpIcon,
                                                color: '#10b981' // green
                                            },
                                            { 
                                                type: 'EXPENSE' as const, 
                                                label: 'Expense',
                                                description: 'Money spent',
                                                icon: ArrowTrendingDownIcon,
                                                color: '#ef4444' // red
                                            }
                                        ].map((item) => {
                                            const isSelected = transactionForm.type === item.type;
                                            const Icon = item.icon;
                                            
                                            return (
                                                <motion.button
                                                    key={item.type}
                                                    type="button"
                                                    onClick={() => setTransactionForm(prev => ({ ...prev, type: item.type }))}
                                                    className={`
                                                        relative p-4 rounded-xl border-2 transition-all
                                                        ${isSelected 
                                                            ? 'border-current shadow-lg' 
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                        }
                                                        bg-white dark:bg-gray-800/50
                                                    `}
                                                    style={{
                                                        borderColor: isSelected ? item.color : undefined,
                                                        backgroundColor: isSelected ? `${item.color}10` : undefined
                                                    }}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <div className="flex flex-col items-center gap-2 text-center">
                                                        <div 
                                                            className="p-2 rounded-lg"
                                                            style={{ backgroundColor: `${item.color}20` }}
                                                        >
                                                            <Icon 
                                                                className="w-6 h-6" 
                                                                style={{ color: item.color }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-sm text-gray-900 dark:text-white">
                                                                {item.label}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                {item.description}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="absolute top-2 right-2 rounded-full p-0.5"
                                                            style={{ backgroundColor: item.color }}
                                                        >
                                                            <CheckIcon className="w-3 h-3 text-white" />
                                                        </motion.div>
                                                    )}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
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
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Category
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {categories.map((category) => {
                                            const isSelected = transactionForm.category === category.name;
                                            const Icon = category.icon;
                                            
                                            return (
                                                <motion.button
                                                    key={category.name}
                                                    type="button"
                                                    onClick={() => setTransactionForm(prev => ({ ...prev, category: category.name }))}
                                                    className={`
                                                        relative px-3 py-2.5 rounded-lg border transition-all text-left
                                                        ${isSelected 
                                                            ? 'border-current shadow-md' 
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                        }
                                                        bg-white dark:bg-gray-800/50
                                                    `}
                                                    style={{
                                                        borderColor: isSelected ? category.color : undefined,
                                                        backgroundColor: isSelected ? `${category.color}15` : undefined
                                                    }}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Icon 
                                                            className="w-4 h-4 flex-shrink-0" 
                                                            style={{ color: isSelected ? category.color : undefined }}
                                                        />
                                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                                            {category.name}
                                                        </span>
                                                    </div>
                                                    {isSelected && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="absolute -top-1 -right-1 rounded-full p-0.5"
                                                            style={{ backgroundColor: category.color }}
                                                        >
                                                            <CheckIcon className="w-2.5 h-2.5 text-white" />
                                                        </motion.div>
                                                    )}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
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
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Transaction Type
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { 
                                                type: 'INCOME' as const, 
                                                label: 'Income',
                                                description: 'Money received',
                                                icon: ArrowTrendingUpIcon,
                                                color: '#10b981' // green
                                            },
                                            { 
                                                type: 'EXPENSE' as const, 
                                                label: 'Expense',
                                                description: 'Money spent',
                                                icon: ArrowTrendingDownIcon,
                                                color: '#ef4444' // red
                                            }
                                        ].map((item) => {
                                            const isSelected = transactionForm.type === item.type;
                                            const Icon = item.icon;
                                            
                                            return (
                                                <motion.button
                                                    key={item.type}
                                                    type="button"
                                                    onClick={() => setTransactionForm(prev => ({ ...prev, type: item.type }))}
                                                    className={`
                                                        relative p-4 rounded-xl border-2 transition-all
                                                        ${isSelected 
                                                            ? 'border-current shadow-lg' 
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                        }
                                                        bg-white dark:bg-gray-800/50
                                                    `}
                                                    style={{
                                                        borderColor: isSelected ? item.color : undefined,
                                                        backgroundColor: isSelected ? `${item.color}10` : undefined
                                                    }}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <div className="flex flex-col items-center gap-2 text-center">
                                                        <div 
                                                            className="p-2 rounded-lg"
                                                            style={{ backgroundColor: `${item.color}20` }}
                                                        >
                                                            <Icon 
                                                                className="w-6 h-6" 
                                                                style={{ color: item.color }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-sm text-gray-900 dark:text-white">
                                                                {item.label}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                {item.description}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="absolute top-2 right-2 rounded-full p-0.5"
                                                            style={{ backgroundColor: item.color }}
                                                        >
                                                            <CheckIcon className="w-3 h-3 text-white" />
                                                        </motion.div>
                                                    )}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
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
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Category
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {categories.map((category) => {
                                            const isSelected = transactionForm.category === category.name;
                                            const Icon = category.icon;
                                            
                                            return (
                                                <motion.button
                                                    key={category.name}
                                                    type="button"
                                                    onClick={() => setTransactionForm(prev => ({ ...prev, category: category.name }))}
                                                    className={`
                                                        relative px-3 py-2.5 rounded-lg border transition-all text-left
                                                        ${isSelected 
                                                            ? 'border-current shadow-md' 
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                        }
                                                        bg-white dark:bg-gray-800/50
                                                    `}
                                                    style={{
                                                        borderColor: isSelected ? category.color : undefined,
                                                        backgroundColor: isSelected ? `${category.color}15` : undefined
                                                    }}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Icon 
                                                            className="w-4 h-4 flex-shrink-0" 
                                                            style={{ color: isSelected ? category.color : undefined }}
                                                        />
                                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                                            {category.name}
                                                        </span>
                                                    </div>
                                                    {isSelected && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="absolute -top-1 -right-1 rounded-full p-0.5"
                                                            style={{ backgroundColor: category.color }}
                                                        >
                                                            <CheckIcon className="w-2.5 h-2.5 text-white" />
                                                        </motion.div>
                                                    )}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
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

