'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Select,
    SelectItem,
    Switch,
} from '@heroui/react';
import {
    BanknotesIcon,
    BuildingLibraryIcon,
    ArrowsRightLeftIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useDesignTheme } from '../../Hooks/useDesignTheme';
import { Axios } from '../../Utils/Axios';

interface Wallet {
    _id: string;
    walletID: string;
    userID: string;
    name: string;
    type: 'WALLET' | 'BANK' | 'UPI';
    balance: number;
    currency: string;
    isActive: boolean;
    linkedPocketId?: string;
    createdAt: string;
    updatedAt: string;
}

interface AddWalletDialogProps {
    open: boolean;
    onClose: () => void;
    onWalletAdded: () => void;
    userID: string;
}

const walletTypes = [
    { 
        key: 'WALLET', 
        label: 'Digital Wallet', 
        description: 'For independent transactions',
        icon: BanknotesIcon,
        color: '#3b82f6'
    },
    { 
        key: 'BANK', 
        label: 'Bank Account', 
        description: 'Traditional bank account',
        icon: BuildingLibraryIcon,
        color: '#8b5cf6'
    },
    { 
        key: 'UPI', 
        label: 'UPI Transfer', 
        description: 'Only for transfers',
        icon: ArrowsRightLeftIcon,
        color: '#f59e0b'
    },
];

const currencies = [
    { key: 'USD', label: 'USD ($)' },
    { key: 'EUR', label: 'EUR (€)' },
    { key: 'GBP', label: 'GBP (£)' },
    { key: 'INR', label: 'INR (₹)' },
    { key: 'CAD', label: 'CAD (C$)' },
    { key: 'AUD', label: 'AUD (A$)' },
    { key: 'JPY', label: 'JPY (¥)' },
];

const AddWalletDialog: React.FC<AddWalletDialogProps> = ({
    open,
    onClose,
    onWalletAdded,
    userID
}) => {
    const { designTheme, palette } = useDesignTheme();
    const isApple = designTheme === 'apple';

    const [formData, setFormData] = useState({
        name: '',
        type: 'WALLET' as 'WALLET' | 'BANK' | 'UPI',
        balance: 0,
        currency: 'USD',
        isActive: true,
        linkedWalletID: '', // For UPI wallets
    });
    const [wallets, setWallets] = useState<any[]>([]); // Available wallets for linking
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Fetch available wallets for UPI linking
    useEffect(() => {
        if (formData.type === 'UPI' && userID) {
            fetchAvailableWallets();
        }
    }, [formData.type, userID]);

    const fetchAvailableWallets = async () => {
        try {
            console.log('Fetching wallets for userID:', userID);
            const response = await Axios.get(`/api/wallets?userID=${userID}`);
            if (response.status === 200) {
                console.log('Available wallets response:', response.data);
                console.log('Raw wallets data:', response.data.Data);
                
                // Temporarily remove filter to debug
                const allWallets = response.data.Data || [];
                console.log('All wallets without filter:', allWallets);
                
                // Filter out UPI wallets and only show BANK and WALLET types for linking
                const availableWallets = allWallets.filter(
                    (wallet: any) => {
                        console.log(`Wallet ${wallet.name} - type: ${wallet.type}, isActive: ${wallet.isActive}`);
                        return wallet.type !== 'UPI' && (wallet.isActive !== false);
                    }
                );
                console.log('Filtered wallets for selection:', availableWallets);
                setWallets(availableWallets);
            }
        } catch (err) {
            console.error('Error fetching wallets:', err);
            setWallets([]); // Set empty array on error
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            setError('Wallet name is required');
            return;
        }

        if (formData.type === 'UPI' && !formData.linkedWalletID) {
            setError('UPI wallets must be linked to a bank account or wallet');
            return;
        }

        if (!userID) {
            setError('User ID is required');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const walletData = {
                userID,
                name: formData.name.trim(),
                type: formData.type,
                initialBalance: formData.type === 'UPI' ? 0 : Number(formData.balance), // UPI wallets don't have their own balance
                currency: formData.currency,
                isActive: formData.isActive,
                linkedWalletID: formData.type === 'UPI' ? formData.linkedWalletID : undefined,
            };

            const response = await Axios.post('/api/wallets', walletData);

            if (response.data.Status === 1) {
                setSuccess(true);
                setTimeout(() => {
                    onWalletAdded();
                    handleClose();
                }, 1000);
            } else {
                setError(response.data.Message || 'Failed to create wallet');
            }
        } catch (err: any) {
            console.error('Error creating wallet:', err);
            setError(err.response?.data?.Message || 'Failed to create wallet');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            type: 'WALLET',
            balance: 0,
            currency: 'USD',
            isActive: true,
            linkedWalletID: '',
        });
        setError(null);
        setSuccess(false);
        onClose();
    };

    return (
        <Modal 
            isOpen={open} 
            onClose={handleClose}
            size="2xl"
            classNames={{
                backdrop: "backdrop-blur-md bg-background/50",
                base: "border-none",
                closeButton: "hover:bg-white/5 active:bg-white/10 transition-colors",
            }}
        >
            <ModalContent style={{ background: palette.surface }}>
                <form onSubmit={handleSubmit}>
                    <ModalHeader className="flex flex-col gap-1 px-8 pt-8 pb-4">
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3"
                        >
                            <div
                                className={`${isApple ? 'w-12 h-12 rounded-xl' : 'w-14 h-14 rounded-2xl'} flex items-center justify-center`}
                                style={{ background: palette.accentSubtle }}
                            >
                                <BanknotesIcon 
                                    className={isApple ? 'h-6 w-6' : 'h-7 w-7'}
                                    style={{ color: palette.accent }}
                                />
                            </div>
                            <div>
                                <h2 
                                    className={`${isApple ? 'text-2xl font-bold' : 'text-3xl font-black'}`}
                                    style={{ color: palette.textPrimary }}
                                >
                                    Create New Wallet
                                </h2>
                                <p 
                                    className={`${isApple ? 'text-sm' : 'text-base font-medium'} mt-1`}
                                    style={{ color: palette.textSecondary }}
                                >
                                    Set up a new wallet for transactions
                                </p>
                            </div>
                        </motion.div>
                    </ModalHeader>
                    
                    <ModalBody className="px-8 py-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="space-y-6"
                        >
                            {/* Error/Success Messages */}
                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className={`${isApple ? 'p-4 rounded-xl' : 'p-5 rounded-2xl'} flex items-center gap-3`}
                                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: `1px solid rgba(239, 68, 68, 0.3)` }}
                                    >
                                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                                        <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                                    </motion.div>
                                )}
                                
                                {success && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className={`${isApple ? 'p-4 rounded-xl' : 'p-5 rounded-2xl'} flex items-center gap-3`}
                                        style={{ background: 'rgba(16, 185, 129, 0.1)', border: `1px solid rgba(16, 185, 129, 0.3)` }}
                                    >
                                        <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                                        <span className="text-sm text-green-600 dark:text-green-400">Wallet created successfully!</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Wallet Name */}
                            <div>
                                <label 
                                    className={`block ${isApple ? 'text-sm font-medium' : 'text-base font-bold'} mb-2`}
                                    style={{ color: palette.textPrimary }}
                                >
                                    Wallet Name *
                                </label>
                                <Input
                                    placeholder="Enter wallet name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    variant="bordered"
                                    size={isApple ? "md" : "lg"}
                                    classNames={{
                                        input: "text-base",
                                        inputWrapper: isApple ? "rounded-xl" : "rounded-2xl",
                                    }}
                                />
                            </div>

                            {/* Wallet Type - Icon Group Buttons */}
                            <div>
                                <label 
                                    className={`block ${isApple ? 'text-sm font-medium' : 'text-base font-bold'} mb-3`}
                                    style={{ color: palette.textPrimary }}
                                >
                                    Wallet Type *
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {walletTypes.map((type) => {
                                        const Icon = type.icon;
                                        const isSelected = formData.type === type.key;
                                        return (
                                            <motion.button
                                                key={type.key}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: type.key as any })}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className={`${isApple ? 'p-4 rounded-xl' : 'p-5 rounded-2xl'} flex flex-col items-center gap-3 transition-all border-2`}
                                                style={{
                                                    background: isSelected 
                                                        ? `${type.color}15` 
                                                        : palette.surfaceSecondary,
                                                    borderColor: isSelected ? type.color : palette.border,
                                                }}
                                            >
                                                <div
                                                    className={`${isApple ? 'w-12 h-12 rounded-lg' : 'w-14 h-14 rounded-xl'} flex items-center justify-center transition-all`}
                                                    style={{
                                                        background: isSelected 
                                                            ? `${type.color}25`
                                                            : palette.background,
                                                    }}
                                                >
                                                    <Icon 
                                                        className={isApple ? 'h-6 w-6' : 'h-7 w-7'}
                                                        style={{ 
                                                            color: isSelected ? type.color : palette.textTertiary 
                                                        }}
                                                    />
                                                </div>
                                                <div className="text-center">
                                                    <p 
                                                        className={`${isApple ? 'text-sm font-semibold' : 'text-base font-bold'}`}
                                                        style={{ 
                                                            color: isSelected ? type.color : palette.textPrimary 
                                                        }}
                                                    >
                                                        {type.label}
                                                    </p>
                                                    <p 
                                                        className="text-xs mt-1"
                                                        style={{ color: palette.textTertiary }}
                                                    >
                                                        {type.description}
                                                    </p>
                                                </div>
                                                {isSelected && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="absolute top-2 right-2"
                                                    >
                                                        <CheckCircleIcon 
                                                            className="h-5 w-5"
                                                            style={{ color: type.color }}
                                                        />
                                                    </motion.div>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Currency */}
                            <div>
                                <label 
                                    className={`block ${isApple ? 'text-sm font-medium' : 'text-base font-bold'} mb-2`}
                                    style={{ color: palette.textPrimary }}
                                >
                                    Currency
                                </label>
                                <Select
                                    selectedKeys={[formData.currency]}
                                    onSelectionChange={(keys) => {
                                        const selectedCurrency = Array.from(keys)[0] as string;
                                        setFormData({ ...formData, currency: selectedCurrency });
                                    }}
                                    variant="bordered"
                                    size={isApple ? "md" : "lg"}
                                    isDisabled={formData.type === 'UPI'}
                                    classNames={{
                                        trigger: isApple ? "rounded-xl" : "rounded-2xl",
                                    }}
                                >
                                    {currencies.map((currency) => (
                                        <SelectItem key={currency.key}>
                                            {currency.label}
                                        </SelectItem>
                                    ))}
                                </Select>
                                {formData.type === 'UPI' && (
                                    <p className="text-xs mt-1" style={{ color: palette.textTertiary }}>
                                        Currency inherited from linked account
                                    </p>
                                )}
                            </div>

                            {/* UPI Linking Section */}
                            {formData.type === 'UPI' && (
                                <AnimatePresence>
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4"
                                    >
                                        <div 
                                            className={`${isApple ? 'p-4 rounded-xl' : 'p-5 rounded-2xl'}`}
                                            style={{ background: 'rgba(59, 130, 246, 0.1)', border: `1px solid rgba(59, 130, 246, 0.3)` }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <svg className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="text-sm">
                                                    <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">
                                                        UPI Transfer Account
                                                    </p>
                                                    <p className="text-blue-700 dark:text-blue-300 text-xs">
                                                        UPI accounts are for transfers only. Link to a bank or wallet to enable transfers.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label 
                                                className={`block ${isApple ? 'text-sm font-medium' : 'text-base font-bold'} mb-2`}
                                                style={{ color: palette.textPrimary }}
                                            >
                                                Linked Account *
                                            </label>
                                            <Select
                                                placeholder="Select bank or wallet to link"
                                                selectedKeys={formData.linkedWalletID ? [wallets.find(w => w.walletID === formData.linkedWalletID)?._id || ''] : []}
                                                onSelectionChange={(keys) => {
                                                    const selectedWalletId = Array.from(keys)[0] as string;
                                                    const linkedWallet = wallets.find(w => w._id === selectedWalletId);
                                                    setFormData({ 
                                                        ...formData, 
                                                        linkedWalletID: linkedWallet ? linkedWallet.walletID : '',
                                                        currency: linkedWallet ? linkedWallet.currency : formData.currency
                                                    });
                                                }}
                                                variant="bordered"
                                                size={isApple ? "md" : "lg"}
                                                isDisabled={wallets.length === 0}
                                                classNames={{
                                                    trigger: isApple ? "rounded-xl" : "rounded-2xl",
                                                }}
                                            >
                                                {wallets.map((wallet) => {
                                                    const currencySymbol = wallet.currency === 'USD' ? '$' : 
                                                                          wallet.currency === 'EUR' ? '€' : 
                                                                          wallet.currency === 'GBP' ? '£' : 
                                                                          wallet.currency === 'INR' ? '₹' : 
                                                                          wallet.currency;
                                                    
                                                    const displayText = `${wallet.name} • ${wallet.type === 'BANK' ? 'Bank' : 'Wallet'} • ${currencySymbol}${wallet.balance?.toFixed(2) || '0.00'}`;
                                                    
                                                    return (
                                                        <SelectItem key={wallet._id} textValue={displayText}>
                                                            {displayText}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </Select>
                                            {wallets.length === 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className={`${isApple ? 'p-3 rounded-lg' : 'p-4 rounded-xl'} mt-2`}
                                                    style={{ background: 'rgba(245, 158, 11, 0.1)', border: `1px solid rgba(245, 158, 11, 0.3)` }}
                                                >
                                                    <p className="text-orange-700 dark:text-orange-300 text-xs">
                                                        <strong>No accounts available.</strong> Create a bank account or wallet first.
                                                    </p>
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            )}

                            {/* Initial Balance - Only for non-UPI wallets */}
                            {formData.type !== 'UPI' && (
                                <div>
                                    <label 
                                        className={`block ${isApple ? 'text-sm font-medium' : 'text-base font-bold'} mb-2`}
                                        style={{ color: palette.textPrimary }}
                                    >
                                        Initial Balance
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={formData.balance.toString()}
                                        onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                                        variant="bordered"
                                        size={isApple ? "md" : "lg"}
                                        classNames={{
                                            input: "text-base",
                                            inputWrapper: isApple ? "rounded-xl" : "rounded-2xl",
                                        }}
                                        startContent={
                                            <div className="pointer-events-none flex items-center">
                                                <span className="text-default-400 text-small">
                                                    {formData.currency === 'USD' ? '$' : 
                                                     formData.currency === 'EUR' ? '€' : 
                                                     formData.currency === 'GBP' ? '£' : 
                                                     formData.currency === 'INR' ? '₹' : 
                                                     formData.currency}
                                                </span>
                                            </div>
                                        }
                                    />
                                </div>
                            )}

                            {/* Active Status */}
                            <div 
                                className={`flex items-center justify-between ${isApple ? 'p-4 rounded-xl' : 'p-5 rounded-2xl'}`}
                                style={{ background: palette.surfaceSecondary }}
                            >
                                <div>
                                    <p 
                                        className={`${isApple ? 'font-medium' : 'font-bold'}`}
                                        style={{ color: palette.textPrimary }}
                                    >
                                        Active Status
                                    </p>
                                    <p 
                                        className={`${isApple ? 'text-xs' : 'text-sm'} mt-1`}
                                        style={{ color: palette.textSecondary }}
                                    >
                                        {formData.isActive ? 'Wallet will be active' : 'Wallet will be inactive'}
                                    </p>
                                </div>
                                <Switch
                                    isSelected={formData.isActive}
                                    onValueChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                    size={isApple ? "md" : "lg"}
                                />
                            </div>
                        </motion.div>
                    </ModalBody>
                    
                    <ModalFooter className="px-8 pb-8 pt-4">
                        <motion.div 
                            className="flex gap-3 w-full"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Button 
                                variant="flat" 
                                onPress={handleClose}
                                disabled={loading}
                                size={isApple ? "md" : "lg"}
                                className={`flex-1 ${isApple ? 'rounded-xl' : 'rounded-2xl font-semibold'}`}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit"
                                color="primary"
                                isLoading={loading}
                                disabled={loading || success || (formData.type === 'UPI' && (!formData.linkedWalletID || wallets.length === 0))}
                                size={isApple ? "md" : "lg"}
                                className={`flex-1 ${isApple ? 'rounded-xl' : 'rounded-2xl font-semibold'}`}
                            >
                                {success ? 'Created!' : 'Create Wallet'}
                            </Button>
                        </motion.div>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

export default AddWalletDialog;
