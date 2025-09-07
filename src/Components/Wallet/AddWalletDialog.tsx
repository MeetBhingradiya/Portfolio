'use client';

import React, { useState, useEffect } from 'react';
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
import { Axios } from '@Utils/Axios';

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
    { key: 'WALLET', label: 'Digital Wallet', description: 'For independent transactions and balance tracking' },
    { key: 'BANK', label: 'Bank Account', description: 'Traditional bank account for transactions' },
    { key: 'UPI', label: 'UPI Transfer Account', description: 'Only for transfers between wallets/banks (no independent transactions)' },
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
    const [formData, setFormData] = useState({
        name: '',
        type: 'WALLET',
        balance: 0,
        currency: 'USD',
        isActive: true,
        linkedWalletID: '', // For UPI wallets
    });
    const [wallets, setWallets] = useState<any[]>([]); // Available wallets for linking
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                onWalletAdded();
                handleClose();
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
        onClose();
    };

    return (
        <Modal 
            isOpen={open} 
            onClose={handleClose}
            size="lg"
            scrollBehavior="inside"
            classNames={{
                base: "dark:bg-gray-900",
                header: "dark:bg-gray-900 dark:text-white",
                body: "dark:bg-gray-900 dark:text-white",
                footer: "dark:bg-gray-900"
            }}
        >
            <ModalContent>
                <form onSubmit={handleSubmit}>
                    <ModalHeader>
                        <h2 className="text-xl font-semibold">Create New Wallet</h2>
                    </ModalHeader>
                    
                    <ModalBody className="space-y-4">
                        {error && (
                            <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
                                <p className="text-danger text-sm">{error}</p>
                            </div>
                        )}

                        <Input
                            label="Wallet Name"
                            placeholder="Enter wallet name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            isRequired
                            variant="bordered"
                        />

                        <Select
                            label="Wallet Type"
                            selectedKeys={[formData.type]}
                            onSelectionChange={(keys) => {
                                const selectedType = Array.from(keys)[0] as string;
                                setFormData({ ...formData, type: selectedType });
                            }}
                            variant="bordered"
                            description="Choose wallet type carefully - UPI wallets are only for transfers between accounts"
                        >
                            {walletTypes.map((type) => (
                                <SelectItem 
                                    key={type.key}
                                    description={type.description}
                                >
                                    {type.label}
                                </SelectItem>
                            ))}
                        </Select>

                        <Select
                            label="Currency"
                            selectedKeys={[formData.currency]}
                            onSelectionChange={(keys) => {
                                const selectedCurrency = Array.from(keys)[0] as string;
                                setFormData({ ...formData, currency: selectedCurrency });
                            }}
                            variant="bordered"
                            isDisabled={formData.type === 'UPI'}
                            description={formData.type === 'UPI' ? 'Currency will be inherited from linked account' : undefined}
                        >
                            {currencies.map((currency) => (
                                <SelectItem key={currency.key}>
                                    {currency.label}
                                </SelectItem>
                            ))}
                        </Select>

                        {formData.type === 'UPI' && (
                            <>
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                                    <div className="flex items-start gap-2">
                                        <div className="text-blue-600 dark:text-blue-400 text-sm">ℹ️</div>
                                        <div className="text-sm text-blue-700 dark:text-blue-300">
                                            <p className="font-medium mb-1">UPI Transfer Account</p>
                                            <p className="text-xs">
                                                UPI accounts are for transfers only. They cannot have independent transactions.
                                                Link to a bank account or wallet to enable transfers between accounts.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <Select
                                    label="Linked Account"
                                    placeholder="Select bank account or wallet to link"
                                    selectedKeys={formData.linkedWalletID ? [wallets.find(w => w.walletID === formData.linkedWalletID)?._id || ''] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedWalletId = Array.from(keys)[0] as string;
                                        const linkedWallet = wallets.find(w => w._id === selectedWalletId);
                                        console.log('Selected wallet:', linkedWallet);
                                        setFormData({ 
                                            ...formData, 
                                            linkedWalletID: linkedWallet ? linkedWallet.walletID : '',
                                            currency: linkedWallet ? linkedWallet.currency : formData.currency
                                        });
                                    }}
                                    variant="bordered"
                                    isRequired
                                    description="UPI apps need to be linked to a bank account or wallet for transactions"
                                    isDisabled={wallets.length === 0}
                                >
                                    {wallets.map((wallet) => {
                                        const currencySymbol = wallet.currency === 'USD' ? '$' : 
                                                              wallet.currency === 'EUR' ? '€' : 
                                                              wallet.currency === 'GBP' ? '£' : 
                                                              wallet.currency === 'INR' ? '₹' : 
                                                              wallet.currency;
                                        
                                        const displayText = `${wallet.name} • ${wallet.type === 'BANK' ? 'Bank Account' : 'Wallet'} • ${currencySymbol}${wallet.balance?.toFixed(2) || '0.00'}`;
                                        
                                        return (
                                            <SelectItem key={wallet._id} textValue={displayText}>
                                                {displayText}
                                            </SelectItem>
                                        );
                                    })}
                                </Select>
                                {wallets.length === 0 && (
                                    <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg dark:bg-warning-900/20 dark:border-warning-800">
                                        <p className="text-warning-700 dark:text-warning-300 text-sm">
                                            <strong>No accounts available for linking.</strong><br />
                                            You need to create at least one bank account or wallet before creating a UPI account.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {formData.type !== 'UPI' && (
                            <Input
                                label="Initial Balance"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={formData.balance.toString()}
                                onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                                variant="bordered"
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
                        )}

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Active Wallet</label>
                            <Switch
                                isSelected={formData.isActive}
                                onValueChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                color="primary"
                            />
                        </div>
                    </ModalBody>
                    
                    <ModalFooter>
                        <Button 
                            variant="light" 
                            onPress={handleClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit"
                            color="primary"
                            isLoading={loading}
                            disabled={loading || (formData.type === 'UPI' && (!formData.linkedWalletID || wallets.length === 0))}
                        >
                            Create Wallet
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

export default AddWalletDialog;
