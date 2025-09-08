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
    Chip,
    Avatar,
    Card,
    CardBody,
} from '@heroui/react';
import {
    BanknotesIcon,
    BuildingLibraryIcon,
    ArrowsRightLeftIcon,
    ArrowRightIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
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

interface AddWalletTransferDialogProps {
    open: boolean;
    onClose: () => void;
    onTransferCompleted: () => void;
    userID: string;
}

const AddWalletTransferDialog: React.FC<AddWalletTransferDialogProps> = ({
    open,
    onClose,
    onTransferCompleted,
    userID
}) => {
    const [formData, setFormData] = useState({
        fromWalletID: '',
        toWalletID: '',
        amount: 0,
        description: '',
        upiWalletID: '', // Optional UPI wallet for transfer
    });

    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [upiWallets, setUpiWallets] = useState<Wallet[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transferPreview, setTransferPreview] = useState<{
        fromWallet?: Wallet;
        toWallet?: Wallet;
        upiWallet?: Wallet;
        fees?: number;
    }>({});

    // Fetch available wallets
    useEffect(() => {
        if (open && userID) {
            fetchWallets();
        }
    }, [open, userID]);

    // Update transfer preview when form data changes
    useEffect(() => {
        updateTransferPreview();
    }, [formData, wallets, upiWallets]);

    const fetchWallets = async () => {
        try {
            const response = await Axios.get(`/api/wallets?userID=${userID}`);
            if (response.status === 200) {
                const allWallets = response.data.Data || [];

                // Separate regular wallets and UPI wallets
                const regularWallets = allWallets.filter((wallet: Wallet) =>
                    wallet.type !== 'UPI' && wallet.isActive
                );
                const availableUpiWallets = allWallets.filter((wallet: Wallet) =>
                    wallet.type === 'UPI' && wallet.isActive
                );

                setWallets(regularWallets);
                setUpiWallets(availableUpiWallets);
            }
        } catch (err) {
            console.error('Error fetching wallets:', err);
            setError('Failed to load wallets');
        }
    };

    const updateTransferPreview = () => {
        const fromWallet = wallets.find(w => w._id === formData.fromWalletID);
        const toWallet = wallets.find(w => w._id === formData.toWalletID);
        const upiWallet = upiWallets.find(w => w._id === formData.upiWalletID);

        setTransferPreview({
            fromWallet,
            toWallet,
            upiWallet,
            fees: 0 // You can add fee calculation logic here
        });
    };

    const getWalletIcon = (type: string) => {
        switch (type) {
            case 'BANK': return BuildingLibraryIcon;
            case 'UPI': return ArrowsRightLeftIcon;
            default: return BanknotesIcon;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'BANK': return 'primary';
            case 'UPI': return 'warning';
            default: return 'default';
        }
    };

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const transferData = {
                userID,
                fromWalletID: formData.fromWalletID,
                toWalletID: formData.toWalletID,
                amount: formData.amount,
                description: formData.description || 'Wallet Transfer',
                upiWalletID: formData.upiWalletID || undefined,
            };

            const response = await Axios.post('/api/wallet-transfer', transferData);

            if (response.status === 200 || response.status === 201) {
                onTransferCompleted();
                handleClose();
            } else {
                setError(response.data?.message || 'Transfer failed');
            }
        } catch (err: any) {
            console.error('Transfer error:', err);
            setError(err.response?.data?.message || err.message || 'Transfer failed');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            fromWalletID: '',
            toWalletID: '',
            amount: 0,
            description: '',
            upiWalletID: '',
        });
        setError(null);
        setTransferPreview({});
        onClose();
    };

    const canTransfer = formData.fromWalletID &&
        formData.toWalletID &&
        formData.fromWalletID !== formData.toWalletID &&
        formData.amount > 0 &&
        (transferPreview.fromWallet?.balance || 0) >= formData.amount;

    return (
        <Modal
            isOpen={open}
            onClose={handleClose}
            size="2xl"
            classNames={{
                backdrop: "backdrop-blur-sm bg-background/30",
                base: "border-none bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm",
                header: "border-b border-gray-200 dark:border-gray-700",
                footer: "border-t border-gray-200 dark:border-gray-700",
            }}
        >
            <ModalContent>
                <form onSubmit={handleSubmit}>
                    <ModalHeader className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <ArrowsRightLeftIcon className="h-6 w-6 text-blue-600" />
                            <h3 className="text-xl font-bold">Transfer Funds</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Transfer money between your wallets
                        </p>
                    </ModalHeader>
                    <ModalBody className="space-y-6">
                        {error && (
                            <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                <CardBody className="p-3">
                                    <div className="flex items-center gap-2">
                                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                                        <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                                    </div>
                                </CardBody>
                            </Card>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* From Wallet */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    From Wallet
                                </label>
                                <Select
                                    selectedKeys={formData.fromWalletID ? [formData.fromWalletID] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0] as string;
                                        setFormData(prev => ({ ...prev, fromWalletID: selectedKey || '' }));
                                    }}
                                    variant="bordered"
                                    placeholder="Select source wallet"
                                    isRequired
                                >
                                    {wallets.map((wallet) => {
                                        const IconComponent = getWalletIcon(wallet.type);
                                        return (
                                            <SelectItem
                                                key={wallet._id}
                                                startContent={
                                                    <Avatar
                                                        icon={<IconComponent className="h-4 w-4" />}
                                                        size="sm"
                                                        className={`${getTypeColor(wallet.type) === 'primary' ? 'bg-blue-500' :
                                                                getTypeColor(wallet.type) === 'warning' ? 'bg-orange-500' : 'bg-gray-500'
                                                            } text-white`}
                                                    />
                                                }
                                                description={`Balance: ${formatCurrency(wallet.balance, wallet.currency)}`}
                                            >
                                                {wallet.name}
                                            </SelectItem>
                                        );
                                    })}
                                </Select>
                            </div>

                            {/* To Wallet */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    To Wallet
                                </label>
                                <Select
                                    selectedKeys={formData.toWalletID ? [formData.toWalletID] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0] as string;
                                        setFormData(prev => ({ ...prev, toWalletID: selectedKey || '' }));
                                    }}
                                    variant="bordered"
                                    placeholder="Select destination wallet"
                                    isRequired
                                >
                                    {wallets
                                        .filter(wallet => wallet._id !== formData.fromWalletID)
                                        .map((wallet) => {
                                            const IconComponent = getWalletIcon(wallet.type);
                                            return (
                                                <SelectItem
                                                    key={wallet._id}
                                                    startContent={
                                                        <Avatar
                                                            icon={<IconComponent className="h-4 w-4" />}
                                                            size="sm"
                                                            className={`${getTypeColor(wallet.type) === 'primary' ? 'bg-blue-500' :
                                                                    getTypeColor(wallet.type) === 'warning' ? 'bg-orange-500' : 'bg-gray-500'
                                                                } text-white`}
                                                        />
                                                    }
                                                    description={`Balance: ${formatCurrency(wallet.balance, wallet.currency)}`}
                                                >
                                                    {wallet.name}
                                                </SelectItem>
                                            );
                                        })}
                                </Select>
                            </div>
                        </div>

                        {/* UPI Wallet (Optional) */}
                        {upiWallets.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Transfer via UPI (Optional)
                                </label>
                                <Select
                                    selectedKeys={formData.upiWalletID ? [formData.upiWalletID] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0] as string;
                                        setFormData(prev => ({ ...prev, upiWalletID: selectedKey || '' }));
                                    }}
                                    variant="bordered"
                                    placeholder="Select UPI wallet (optional)"
                                >
                                    {upiWallets.map((wallet) => (
                                        <SelectItem
                                            key={wallet._id}
                                            startContent={
                                                <Avatar
                                                    icon={<ArrowsRightLeftIcon className="h-4 w-4" />}
                                                    size="sm"
                                                    className="bg-orange-500 text-white"
                                                />
                                            }
                                        >
                                            {wallet.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                        )}

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Amount
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max={transferPreview.fromWallet?.balance || 0}
                                value={formData.amount.toString()}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    amount: parseFloat(e.target.value) || 0
                                }))}
                                variant="bordered"
                                placeholder="0.00"
                                startContent={
                                    <span className="text-gray-500">
                                        {transferPreview.fromWallet?.currency === 'USD' ? '$' :
                                            transferPreview.fromWallet?.currency === 'EUR' ? '€' :
                                                transferPreview.fromWallet?.currency === 'GBP' ? '£' :
                                                    transferPreview.fromWallet?.currency === 'INR' ? '₹' :
                                                        transferPreview.fromWallet?.currency || '$'}
                                    </span>
                                }
                                description={
                                    transferPreview.fromWallet
                                        ? `Available: ${formatCurrency(transferPreview.fromWallet.balance, transferPreview.fromWallet.currency)}`
                                        : undefined
                                }
                                isRequired
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Description (Optional)
                            </label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    description: e.target.value
                                }))}
                                variant="bordered"
                                placeholder="Transfer description..."
                            />
                        </div>

                        {/* Transfer Preview */}
                        {transferPreview.fromWallet && transferPreview.toWallet && formData.amount > 0 && (
                            <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                <CardBody className="p-4">
                                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Transfer Preview</h4>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Chip size="sm" color="primary" variant="flat">
                                                {transferPreview.fromWallet.name}
                                            </Chip>
                                            <span className="text-blue-700 dark:text-blue-300">
                                                -{formatCurrency(formData.amount, transferPreview.fromWallet.currency)}
                                            </span>
                                        </div>
                                        <ArrowRightIcon className="h-4 w-4 text-blue-600" />
                                        <div className="flex items-center gap-2">
                                            <Chip size="sm" color="success" variant="flat">
                                                {transferPreview.toWallet.name}
                                            </Chip>
                                            <span className="text-green-700 dark:text-green-300">
                                                +{formatCurrency(formData.amount, transferPreview.toWallet.currency)}
                                            </span>
                                        </div>
                                    </div>
                                    {transferPreview.upiWallet && (
                                        <div className="mt-2 text-center">
                                            <Chip size="sm" color="warning" variant="flat">
                                                via {transferPreview.upiWallet.name}
                                            </Chip>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        )}

                        {/* Insufficient funds warning */}
                        {transferPreview.fromWallet && formData.amount > transferPreview.fromWallet.balance && (
                            <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                <CardBody className="p-3">
                                    <div className="flex items-center gap-2">
                                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                                        <p className="text-red-700 dark:text-red-300 text-sm">
                                            Insufficient funds. Available: {formatCurrency(transferPreview.fromWallet.balance, transferPreview.fromWallet.currency)}
                                        </p>
                                    </div>
                                </CardBody>
                            </Card>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            color="danger"
                            variant="light"
                            onPress={handleClose}
                            isDisabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            type="submit"
                            isLoading={loading}
                            isDisabled={!canTransfer}
                            startContent={!loading ? <ArrowsRightLeftIcon className="h-4 w-4" /> : null}
                        >
                            {loading ? 'Processing...' : 'Transfer Funds'}
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

export default AddWalletTransferDialog;
