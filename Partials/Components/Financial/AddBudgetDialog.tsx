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
    Progress,
} from '@heroui/react';
import { CalendarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { ExpenseCategory } from '../../Models/index';
import { Axios } from '../../Utils/Axios';

interface AddBudgetDialogProps {
    open: boolean;
    onClose: () => void;
    onBudgetAdded: () => void;
    userID: string;
}

const AddBudgetDialog: React.FC<AddBudgetDialogProps> = ({ 
    open, 
    onClose, 
    onBudgetAdded, 
    userID 
}) => {
    const [formData, setFormData] = useState({
        name: '',
        totalAmount: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        description: '',
        categoryAllocations: [
            { category: '', amount: '', percentage: 0 }
        ],
        alerts: {
            enabled: true,
            thresholds: [75, 90, 100] // Alert at 75%, 90%, and 100%
        }
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        { value: ExpenseCategory.SUBSCRIPTIONS, label: 'Subscriptions' },
        { value: ExpenseCategory.MISCELLANEOUS, label: 'Miscellaneous' }
    ];

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Recalculate percentages when total amount changes
        if (field === 'totalAmount') {
            const totalAmount = parseFloat(value) || 0;
            setFormData(prev => ({
                ...prev,
                categoryAllocations: prev.categoryAllocations.map(allocation => ({
                    ...allocation,
                    percentage: totalAmount > 0 ? (parseFloat(allocation.amount) || 0) / totalAmount * 100 : 0
                }))
            }));
        }
    };

    const handleCategoryAllocationChange = (index: number, field: string, value: any) => {
        const newAllocations = [...formData.categoryAllocations];
        newAllocations[index] = { ...newAllocations[index], [field]: value };
        
        // Recalculate percentage when amount changes
        if (field === 'amount') {
            const totalAmount = parseFloat(formData.totalAmount) || 0;
            newAllocations[index].percentage = totalAmount > 0 ? (parseFloat(value) || 0) / totalAmount * 100 : 0;
        }
        
        setFormData(prev => ({
            ...prev,
            categoryAllocations: newAllocations
        }));
    };

    const addCategoryAllocation = () => {
        setFormData(prev => ({
            ...prev,
            categoryAllocations: [
                ...prev.categoryAllocations,
                { category: '', amount: '', percentage: 0 }
            ]
        }));
    };

    const removeCategoryAllocation = (index: number) => {
        if (formData.categoryAllocations.length > 1) {
            setFormData(prev => ({
                ...prev,
                categoryAllocations: prev.categoryAllocations.filter((_, i) => i !== index)
            }));
        }
    };

    const getTotalAllocated = () => {
        return formData.categoryAllocations.reduce((total, allocation) => {
            return total + (parseFloat(allocation.amount) || 0);
        }, 0);
    };

    const getTotalPercentage = () => {
        return formData.categoryAllocations.reduce((total, allocation) => {
            return total + (allocation.percentage || 0);
        }, 0);
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            // Validate required fields
            if (!formData.name || !formData.totalAmount || !formData.startDate || !formData.endDate) {
                throw new Error('Please fill in all required fields');
            }

            const totalAmount = parseFloat(formData.totalAmount);
            if (isNaN(totalAmount) || totalAmount <= 0) {
                throw new Error('Please enter a valid total amount');
            }

            // Validate dates
            if (new Date(formData.endDate) <= new Date(formData.startDate)) {
                throw new Error('End date must be after start date');
            }

            // Validate category allocations
            const validAllocations = formData.categoryAllocations.filter(
                allocation => allocation.category && allocation.amount
            );

            if (validAllocations.length === 0) {
                throw new Error('Please add at least one category allocation');
            }

            const totalAllocated = getTotalAllocated();
            if (totalAllocated > totalAmount) {
                throw new Error('Total allocated amount cannot exceed budget amount');
            }

            const budgetData = {
                userID,
                name: formData.name,
                totalAmount,
                period: {
                    startDate: new Date(formData.startDate).toISOString(),
                    endDate: new Date(formData.endDate).toISOString()
                },
                description: formData.description || undefined,
                categoryAllocations: validAllocations.map(allocation => ({
                    category: allocation.category,
                    allocatedAmount: parseFloat(allocation.amount),
                    spentAmount: 0,
                    percentage: allocation.percentage
                })),
                alerts: formData.alerts
            };

            const response = await Axios.post('/api/financial/budgets', budgetData);

            if (response.status !== 200) {
                throw new Error(response.data?.error || 'Failed to create budget');
            }

            // Reset form
            setFormData({
                name: '',
                totalAmount: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                description: '',
                categoryAllocations: [{ category: '', amount: '', percentage: 0 }],
                alerts: { enabled: true, thresholds: [75, 90, 100] }
            });

            onBudgetAdded();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const totalAllocated = getTotalAllocated();
    const totalPercentage = getTotalPercentage();
    const totalAmount = parseFloat(formData.totalAmount) || 0;

    return (
        <Modal 
            isOpen={open} 
            onClose={onClose}
            placement="center"
            size="3xl"
            scrollBehavior="inside"
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    Create New Budget
                </ModalHeader>
                <ModalBody>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                isRequired
                                label="Budget Name"
                                placeholder="e.g., Monthly Budget - March 2024"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="md:col-span-1"
                            />

                            <Input
                                isRequired
                                type="number"
                                label="Total Amount"
                                placeholder="0.00"
                                value={formData.totalAmount}
                                onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                                startContent={
                                    <div className="pointer-events-none flex items-center">
                                        <span className="text-default-400 text-small">₹</span>
                                    </div>
                                }
                                className="md:col-span-1"
                            />

                            <Input
                                isRequired
                                type="date"
                                label="Start Date"
                                value={formData.startDate}
                                onChange={(e) => handleInputChange('startDate', e.target.value)}
                                className="md:col-span-1"
                            />

                            <Input
                                isRequired
                                type="date"
                                label="End Date"
                                value={formData.endDate}
                                onChange={(e) => handleInputChange('endDate', e.target.value)}
                                className="md:col-span-1"
                            />

                            <Textarea
                                label="Description"
                                placeholder="Budget description (optional)"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                minRows={2}
                                className="md:col-span-2"
                            />
                        </div>

                        {/* Budget Allocation Overview */}
                        {totalAmount > 0 && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                <h4 className="text-sm font-medium mb-3">Budget Overview</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600 dark:text-gray-400">Total Budget</p>
                                        <p className="font-semibold">₹{totalAmount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 dark:text-gray-400">Allocated</p>
                                        <p className="font-semibold">₹{totalAllocated.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 dark:text-gray-400">Remaining</p>
                                        <p className="font-semibold">₹{(totalAmount - totalAllocated).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 dark:text-gray-400">% Allocated</p>
                                        <p className="font-semibold">{totalPercentage.toFixed(1)}%</p>
                                    </div>
                                </div>
                                <Progress 
                                    value={totalPercentage} 
                                    className="mt-3"
                                    color={totalPercentage > 100 ? "danger" : "primary"}
                                />
                            </div>
                        )}

                        {/* Category Allocations */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-medium">Category Allocations</h4>
                                <Button
                                    size="sm"
                                    color="primary"
                                    variant="light"
                                    onClick={addCategoryAllocation}
                                >
                                    Add Category
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {formData.categoryAllocations.map((allocation, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <Select
                                            label="Category"
                                            placeholder="Select category"
                                            selectedKeys={allocation.category ? [allocation.category] : []}
                                            onSelectionChange={(keys) => {
                                                const selected = Array.from(keys)[0];
                                                handleCategoryAllocationChange(index, 'category', selected);
                                            }}
                                            className="md:col-span-1"
                                        >
                                            {expenseCategories.map((category) => (
                                                <SelectItem key={category.value}>
                                                    {category.label}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <Input
                                            type="number"
                                            label="Amount"
                                            placeholder="0.00"
                                            value={allocation.amount}
                                            onChange={(e) => handleCategoryAllocationChange(index, 'amount', e.target.value)}
                                            startContent={
                                                <div className="pointer-events-none flex items-center">
                                                    <span className="text-default-400 text-small">₹</span>
                                                </div>
                                            }
                                            className="md:col-span-1"
                                        />

                                        <div className="flex items-center">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                {allocation.percentage.toFixed(1)}%
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <Button
                                                size="sm"
                                                color="danger"
                                                variant="light"
                                                onClick={() => removeCategoryAllocation(index)}
                                                isDisabled={formData.categoryAllocations.length === 1}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Alert Settings */}
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                                <Switch
                                    isSelected={formData.alerts.enabled}
                                    onValueChange={(checked) => 
                                        setFormData(prev => ({
                                            ...prev,
                                            alerts: { ...prev.alerts, enabled: checked }
                                        }))
                                    }
                                />
                                <span className="text-sm font-medium">Enable Budget Alerts</span>
                            </div>
                            {formData.alerts.enabled && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    You will receive notifications when you reach 75%, 90%, and 100% of your budget allocations.
                                </p>
                            )}
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
                        {loading ? 'Creating...' : 'Create Budget'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AddBudgetDialog;
