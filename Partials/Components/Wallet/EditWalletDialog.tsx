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
    PencilIcon,
    BanknotesIcon,
    BuildingLibraryIcon,
    ArrowsRightLeftIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useDesignTheme } from '../../Hooks/useDesignTheme';
import { LiquidGlassCard, LiquidGlassButton } from '../LiquidGlass';
import { OneUICard, OneUIButton } from '../OneUI';
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

interface EditWalletDialogProps {
    open: boolean;
    onClose: () => void;
    onWalletUpdated: () => void;
    wallet: Wallet | null;
}

const walletTypes = [
    { 
        key: 'WALLET', 
        label: 'Digital Wallet', 
        description: 'For independent transactions',
        icon: BanknotesIcon 
    },
    { 
        key: 'BANK', 
        label: 'Bank Account', 
        description: 'Traditional bank account',
        icon: BuildingLibraryIcon 
    },
    { 
        key: 'UPI', 
        label: 'UPI Account', 
        description: 'For transfers only',
        icon: ArrowsRightLeftIcon 
    },
];

const currencies = [
    { key: 'USD', label: 'USD ($)', symbol: '$' },
    { key: 'EUR', label: 'EUR (€)', symbol: '€' },
    { key: 'GBP', label: 'GBP (£)', symbol: '£' },
    { key: 'INR', label: 'INR (₹)', symbol: '₹' },
    { key: 'CAD', label: 'CAD (C$)', symbol: 'C$' },
    { key: 'AUD', label: 'AUD (A$)', symbol: 'A$' },
    { key: 'JPY', label: 'JPY (¥)', symbol: '¥' },
];

const EditWalletDialog: React.FC<EditWalletDialogProps> = ({
    open,
    onClose,
    onWalletUpdated,
    wallet
}) => {
    const { designTheme, palette } = useDesignTheme();
    const isApple = designTheme === 'apple';

    const [formData, setFormData] = useState({
        name: '',
        type: 'WALLET' as 'WALLET' | 'BANK' | 'UPI',
        currency: 'USD',
        isActive: true,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (wallet) {
            setFormData({
                name: wallet.name,
                type: wallet.type,
                currency: wallet.currency,
                isActive: wallet.isActive,
            });
        }
        setError(null);
        setSuccess(false);
    }, [wallet, open]);

    const handleSubmit = async () => {
        if (!wallet) return;
        
        if (!formData.name.trim()) {
            setError('Wallet name is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await Axios.put(`/api/wallets/${wallet._id}`, {
                ...formData,
                userID: wallet.userID,
            });

            if (response.status === 200) {
                setSuccess(true);
                setTimeout(() => {
                    onWalletUpdated();
                    handleClose();
                }, 1000);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update wallet');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            type: 'WALLET',
            currency: 'USD',
            isActive: true,
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
                {(onClose) => (
                    <>
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
                                    <PencilIcon 
                                        className={isApple ? 'h-6 w-6' : 'h-7 w-7'}
                                        style={{ color: palette.accent }}
                                    />
                                </div>
                                <div>
                                    <h2 
                                        className={`${isApple ? 'text-2xl font-bold' : 'text-3xl font-black'}`}
                                        style={{ color: palette.textPrimary }}
                                    >
                                        Edit Wallet
                                    </h2>
                                    <p 
                                        className={`${isApple ? 'text-sm' : 'text-base font-medium'} mt-1`}
                                        style={{ color: palette.textSecondary }}
                                    >
                                        Update wallet details
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
                                            <span className="text-sm text-green-600 dark:text-green-400">Wallet updated successfully!</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Wallet Name */}
                                <div>
                                    <label 
                                        className={`block ${isApple ? 'text-sm font-medium' : 'text-base font-bold'} mb-2`}
                                        style={{ color: palette.textPrimary }}
                                    >
                                        Wallet Name
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

                                {/* Wallet Type */}
                                <div>
                                    <label 
                                        className={`block ${isApple ? 'text-sm font-medium' : 'text-base font-bold'} mb-2`}
                                        style={{ color: palette.textPrimary }}
                                    >
                                        Wallet Type
                                    </label>
                                    <Select
                                        selectedKeys={[formData.type]}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                        variant="bordered"
                                        size={isApple ? "md" : "lg"}
                                        classNames={{
                                            trigger: isApple ? "rounded-xl" : "rounded-2xl",
                                        }}
                                        renderValue={(items) => {
                                            const selected = walletTypes.find(t => t.key === formData.type);
                                            return selected ? (
                                                <div className="flex items-center gap-3">
                                                    <selected.icon className="h-5 w-5" style={{ color: palette.accent }} />
                                                    <div>
                                                        <div className="font-medium" style={{ color: palette.textPrimary }}>
                                                            {selected.label}
                                                        </div>
                                                        <div className="text-xs" style={{ color: palette.textTertiary }}>
                                                            {selected.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null;
                                        }}
                                    >
                                        {walletTypes.map((type) => (
                                            <SelectItem 
                                                key={type.key}
                                                textValue={type.label}
                                            >
                                                <div className="flex items-center gap-3 py-1">
                                                    <type.icon className="h-5 w-5" style={{ color: palette.accent }} />
                                                    <div>
                                                        <div className="font-medium">{type.label}</div>
                                                        <div className="text-xs text-gray-500">{type.description}</div>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </Select>
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
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                        variant="bordered"
                                        size={isApple ? "md" : "lg"}
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
                                </div>

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
                                            {formData.isActive ? 'Wallet is active' : 'Wallet is inactive'}
                                        </p>
                                    </div>
                                    <Switch
                                        isSelected={formData.isActive}
                                        onValueChange={(value) => setFormData({ ...formData, isActive: value })}
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
                                    size={isApple ? "md" : "lg"}
                                    className={`flex-1 ${isApple ? 'rounded-xl' : 'rounded-2xl font-semibold'}`}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={handleSubmit}
                                    size={isApple ? "md" : "lg"}
                                    className={`flex-1 ${isApple ? 'rounded-xl' : 'rounded-2xl font-semibold'}`}
                                    isLoading={loading}
                                    disabled={loading || success}
                                >
                                    {success ? 'Updated!' : 'Save Changes'}
                                </Button>
                            </motion.div>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default EditWalletDialog;
