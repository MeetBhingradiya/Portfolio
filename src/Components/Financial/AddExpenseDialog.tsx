import React, { useState } from 'react';
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
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { ExpenseCategory, PaymentMethod } from '@Models/index';
import { Axios } from '@Utils/Axios';

interface AddExpenseDialogProps {
    open: boolean;
    onClose: () => void;
    onExpenseAdded: () => void;
    userID: string;
}

const AddExpenseDialog: React.FC<AddExpenseDialogProps> = ({ 
    open, 
    onClose, 
    onExpenseAdded, 
    userID 
}) => {
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: '',
        paymentMethod: '',
        description: '',
        date: new Date().toISOString().split('T')[0], // Format for HTML date input
        tags: [] as string[],
        isRecurring: false,
        vendor: {
            name: '',
            category: '',
            contact: ''
        },
        location: {
            name: '',
            address: '',
            city: '',
            coordinates: { lat: 0, lng: 0 }
        }
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tagInput, setTagInput] = useState('');

    const expenseCategories = [
        { value: ExpenseCategory.FOOD_DINING, label: 'Food & Dining' },
        { value: ExpenseCategory.TRANSPORTATION, label: 'Transportation' },
        { value: ExpenseCategory.ENTERTAINMENT, label: 'Entertainment' },
        { value: ExpenseCategory.UTILITIES, label: 'Utilities' },
        { value: ExpenseCategory.HEALTHCARE, label: 'Healthcare' },
        { value: ExpenseCategory.SHOPPING, label: 'Shopping' },
        { value: ExpenseCategory.EDUCATION, label: 'Education' },
        { value: ExpenseCategory.TRAVEL, label: 'Travel' },
        { value: ExpenseCategory.INSURANCE, label: 'Insurance' },
        { value: ExpenseCategory.HOUSING_RENT, label: 'Housing & Rent' },
        { value: ExpenseCategory.MISCELLANEOUS, label: 'Miscellaneous' }
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

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            // Validate required fields
            if (!formData.title || !formData.amount || !formData.category || !formData.paymentMethod) {
                throw new Error('Please fill in all required fields');
            }

            const amount = parseFloat(formData.amount);
            if (isNaN(amount) || amount <= 0) {
                throw new Error('Please enter a valid amount');
            }

            const expenseData = {
                userID,
                title: formData.title,
                amount,
                category: formData.category,
                paymentMethod: formData.paymentMethod,
                description: formData.description || undefined,
                date: new Date(formData.date).toISOString(),
                tags: formData.tags,
                vendor: formData.vendor.name ? formData.vendor : undefined,
                location: formData.location.name ? formData.location : undefined,
                isRecurring: formData.isRecurring
            };

            const response = await Axios.post('/api/financial/expenses', expenseData);

            if (response.status !== 200) {
                throw new Error(response.data?.error || 'Failed to add expense');
            }

            // Reset form
            setFormData({
                title: '',
                amount: '',
                category: '',
                paymentMethod: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                tags: [],
                isRecurring: false,
                vendor: { name: '', category: '', contact: '' },
                location: { name: '', address: '', city: '', coordinates: { lat: 0, lng: 0 } }
            });

            onExpenseAdded();
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
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    Add New Expense
                </ModalHeader>
                <ModalBody>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            isRequired
                            label="Expense Title"
                            placeholder="e.g., Lunch at restaurant"
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
                            {expenseCategories.map((category) => (
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
                            label="Vendor Name"
                            placeholder="e.g., McDonald's"
                            value={formData.vendor.name}
                            onChange={(e) => handleNestedInputChange('vendor', 'name', e.target.value)}
                            className="md:col-span-1"
                        />

                        <Input
                            label="Location"
                            placeholder="e.g., Mumbai, Maharashtra"
                            value={formData.location.name}
                            onChange={(e) => handleNestedInputChange('location', 'name', e.target.value)}
                            className="md:col-span-1"
                        />

                        <div className="flex items-center gap-2 md:col-span-1">
                            <Switch
                                isSelected={formData.isRecurring}
                                onValueChange={(checked) => handleInputChange('isRecurring', checked)}
                            />
                            <span className="text-sm">Recurring Expense</span>
                        </div>

                        <Textarea
                            label="Description"
                            placeholder="Additional notes about this expense..."
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
                        {loading ? 'Adding...' : 'Add Expense'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AddExpenseDialog;
