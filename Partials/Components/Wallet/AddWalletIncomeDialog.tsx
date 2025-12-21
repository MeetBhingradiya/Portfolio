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
    Textarea,
    Switch,
    Chip,
} from '@heroui/react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { IncomeCategory, PaymentMethod } from '../../Models/index';
import { Axios } from '../../Utils/Axios';

interface Wallet {
    WalletID: string;
    Name: string;
    Type: string;
    Balance: number;
    Currency: string;
}

interface AddWalletIncomeDialogProps {
    open: boolean;
    onClose: () => void;
    onIncomeAdded: () => void;
    userID: string;
}

const AddWalletIncomeDialog: React.FC<AddWalletIncomeDialogProps> = ({ 
    open, 
    onClose, 
    onIncomeAdded, 
    userID 
}) => {
    const [formData, setFormData] = useState({
        walletID: '',
        title: '',
        amount: '',
        category: '',
        paymentMethod: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        tags: [] as string[],
        isRecurring: false,
        source: {
            name: '',
            type: '',
            reference: ''
        },
        tax: {
            isTaxable: false,
            taxDeducted: 0,
            taxRate: 0
        }
    });

    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        if (open) {
            fetchWallets();
        }
    }, [open, userID]);

    const fetchWallets = async () => {
        try {
            const response = await Axios.get(`/api/wallets?userID=${userID}`);
            if (response.status === 200) {
                setWallets(response.data.Data);
            }
        } catch (err) {
            console.error('Failed to fetch wallets:', err);
        }
    };

    const incomeCategories = [
        { value: IncomeCategory.SALARY, label: 'Salary' },
        { value: IncomeCategory.FREELANCE, label: 'Freelance' },
        { value: IncomeCategory.CONSULTING, label: 'Consulting' },
        { value: IncomeCategory.BUSINESS_REVENUE, label: 'Business Revenue' },
        { value: IncomeCategory.DIVIDENDS, label: 'Dividends' },
        { value: IncomeCategory.INTEREST, label: 'Interest' },
        { value: IncomeCategory.CAPITAL_GAINS, label: 'Capital Gains' },
        { value: IncomeCategory.RENTAL_INCOME, label: 'Rental Income' },
        { value: IncomeCategory.SIDE_HUSTLE, label: 'Side Hustle' },
        { value: IncomeCategory.AD_REVENUE, label: 'Ad Revenue' },
        { value: IncomeCategory.MISCELLANEOUS, label: 'Miscellaneous' }
    ];

    const paymentMethods = [
        { value: PaymentMethod.CASH, label: 'Cash' },
        { value: PaymentMethod.CREDIT_CARD, label: 'Credit Card' },
        { value: PaymentMethod.DEBIT_CARD, label: 'Debit Card' },
        { value: PaymentMethod.UPI, label: 'UPI' },
        { value: PaymentMethod.NET_BANKING, label: 'Net Banking' },
        { value: PaymentMethod.DIGITAL_WALLET, label: 'Digital Wallet' },
        { value: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer' },
        { value: PaymentMethod.OTHER, label: 'Other' }
    ];

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNestedInputChange = (parent: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent as keyof typeof prev] as any,
                [field]: value
            }
        }));
    };

    const handleAddTag = (tag: string) => {
        if (tag.trim() && !formData.tags.includes(tag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tag.trim()]
            }));
        }
        setTagInput('');
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const selectedWallet = wallets.find(w => w.WalletID === formData.walletID);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            // Validate required fields
            if (!formData.walletID || !formData.title || !formData.amount || !formData.category || !formData.paymentMethod) {
                throw new Error('Please fill in all required fields');
            }

            const amount = parseFloat(formData.amount);
            if (isNaN(amount) || amount <= 0) {
                throw new Error('Please enter a valid amount');
            }

            const incomeData = {
                userID,
                fromWalletID: formData.walletID,
                amount,
                title: formData.title,
                description: formData.description || undefined,
                financialType: 'INCOME',
                category: formData.category,
                paymentMethod: formData.paymentMethod,
                source: formData.source.name ? formData.source : undefined,
                tax: formData.tax.isTaxable ? formData.tax : undefined,
                tags: formData.tags,
                isRecurring: formData.isRecurring
            };

            const response = await Axios.post('/api/wallet-transactions', incomeData);

            if (response.status !== 201) {
                throw new Error(response.data?.Message || 'Failed to add income');
            }

            // Reset form
            setFormData({
                walletID: '',
                title: '',
                amount: '',
                category: '',
                paymentMethod: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                tags: [],
                isRecurring: false,
                source: { name: '', type: '', reference: '' },
                tax: { isTaxable: false, taxDeducted: 0, taxRate: 0 }
            });

            onIncomeAdded();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal 
            isOpen={open} 
            onClose={onClose}
            placement="center"
            size="2xl"
            scrollBehavior="inside"
            classNames={{
                base: "dark:bg-gray-900",
                header: "dark:bg-gray-900 dark:text-white",
                body: "dark:bg-gray-900 dark:text-white",
                footer: "dark:bg-gray-900"
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    Add New Income
                </ModalHeader>
                <ModalBody>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            isRequired
                            label="To Wallet"
                            placeholder="Select wallet"
                            selectedKeys={formData.walletID ? [formData.walletID] : []}
                            onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0];
                                handleInputChange('walletID', selected);
                            }}
                            className="md:col-span-2"
                            description={selectedWallet ? `Current Balance: ${formatCurrency(selectedWallet.Balance)}` : ''}
                        >
                            {wallets.map((wallet) => (
                                <SelectItem key={wallet.WalletID}>
                                    {wallet.Name} ({wallet.Type}) - {formatCurrency(wallet.Balance)}
                                </SelectItem>
                            ))}
                        </Select>

                        <Input
                            isRequired
                            label="Income Title"
                            placeholder="e.g., Freelance project payment"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            className="md:col-span-1"
                        />

                        <Input
                            isRequired
                            type="number"
                            label="Amount"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => handleInputChange('amount', e.target.value)}
                            startContent={
                                <div className="pointer-events-none flex items-center">
                                    <span className="text-default-400 text-small">₹</span>
                                </div>
                            }
                            className="md:col-span-1"
                        />

                        <Select
                            isRequired
                            label="Category"
                            placeholder="Select category"
                            selectedKeys={formData.category ? [formData.category] : []}
                            onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0];
                                handleInputChange('category', selected);
                            }}
                            className="md:col-span-1"
                        >
                            {incomeCategories.map((category) => (
                                <SelectItem key={category.value}>
                                    {category.label}
                                </SelectItem>
                            ))}
                        </Select>

                        <Select
                            isRequired
                            label="Payment Method"
                            placeholder="Select payment method"
                            selectedKeys={formData.paymentMethod ? [formData.paymentMethod] : []}
                            onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0];
                                handleInputChange('paymentMethod', selected);
                            }}
                            className="md:col-span-1"
                        >
                            {paymentMethods.map((method) => (
                                <SelectItem key={method.value}>
                                    {method.label}
                                </SelectItem>
                            ))}
                        </Select>

                        <Input
                            type="date"
                            label="Date"
                            value={formData.date}
                            onChange={(e) => handleInputChange('date', e.target.value)}
                            className="md:col-span-1"
                        />

                        <Input
                            label="Source Name"
                            placeholder="e.g., Client ABC Corp"
                            value={formData.source.name}
                            onChange={(e) => handleNestedInputChange('source', 'name', e.target.value)}
                            className="md:col-span-1"
                        />

                        <div className="flex items-center gap-2 md:col-span-1">
                            <Switch
                                isSelected={formData.isRecurring}
                                onValueChange={(checked) => handleInputChange('isRecurring', checked)}
                            />
                            <span className="text-sm">Recurring Income</span>
                        </div>

                        <div className="flex items-center gap-2 md:col-span-1">
                            <Switch
                                isSelected={formData.tax.isTaxable}
                                onValueChange={(checked) => handleNestedInputChange('tax', 'isTaxable', checked)}
                            />
                            <span className="text-sm">Taxable Income</span>
                        </div>

                        {formData.tax.isTaxable && (
                            <>
                                <Input
                                    type="number"
                                    label="Tax Deducted"
                                    placeholder="0.00"
                                    value={formData.tax.taxDeducted.toString()}
                                    onChange={(e) => handleNestedInputChange('tax', 'taxDeducted', parseFloat(e.target.value) || 0)}
                                    startContent={
                                        <div className="pointer-events-none flex items-center">
                                            <span className="text-default-400 text-small">₹</span>
                                        </div>
                                    }
                                    className="md:col-span-1"
                                />

                                <Input
                                    type="number"
                                    label="Tax Rate (%)"
                                    placeholder="0"
                                    value={formData.tax.taxRate.toString()}
                                    onChange={(e) => handleNestedInputChange('tax', 'taxRate', parseFloat(e.target.value) || 0)}
                                    endContent={
                                        <div className="pointer-events-none flex items-center">
                                            <span className="text-default-400 text-small">%</span>
                                        </div>
                                    }
                                    className="md:col-span-1"
                                />
                            </>
                        )}

                        <Textarea
                            label="Description"
                            placeholder="Additional notes about this income..."
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            minRows={2}
                            className="md:col-span-2"
                        />

                        <div className="md:col-span-2">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Tags</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {formData.tags.map((tag, index) => (
                                        <Chip
                                            key={index}
                                            onClose={() => handleRemoveTag(tag)}
                                            variant="flat"
                                            size="sm"
                                        >
                                            {tag}
                                        </Chip>
                                    ))}
                                </div>
                                <Input
                                    size="sm"
                                    placeholder="Add tags (press Enter)"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddTag(tagInput);
                                        }
                                    }}
                                    endContent={
                                        <Button
                                            size="sm"
                                            variant="light"
                                            isIconOnly
                                            onClick={() => handleAddTag(tagInput)}
                                        >
                                            <PlusIcon className="h-4 w-4" />
                                        </Button>
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button 
                        color="danger" 
                        variant="light" 
                        onPress={onClose}
                        isDisabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button 
                        color="primary" 
                        onPress={handleSubmit}
                        isLoading={loading}
                    >
                        {loading ? 'Adding...' : 'Add Income'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AddWalletIncomeDialog;
