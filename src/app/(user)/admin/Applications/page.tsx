"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Tooltip,
    // Grid,
    Card,
    CardContent,
    Alert,
    Tabs,
    Tab,
    Switch,
    FormControlLabel,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    CircularProgress,
    Snackbar,
    GridLegacy as Grid
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Payment as PaymentIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Business as BusinessIcon,
    Computer as ComputerIcon,
    Smartphone as SmartphoneIcon,
    Language as LanguageIcon,
    Storage as StorageIcon,
    ExpandMore as ExpandMoreIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    GetApp as DownloadIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { Axios } from '@Utils/Axios';

interface Application {
    _id: string;
    ApplicationID: string;
    Name?: string;
    Description?: string;
    Icon?: string;
    Company_Name?: string;
    Company_Email?: string;
    Company_Phone?: string;
    Company_Website?: string;
    Amount: number;
    Currency: string;
    BillingCycle: string;
    PaymentDueDate?: Date;
    LastPaymentDate?: Date;
    IsOverdue: boolean;
    OverdueGracePeriodDays?: number;
    Services?: Array<{
        ClientType: "Client" | "Server" | "Database";
        Signature: string;
        enabled: boolean;
        Note?: string;
    }>;
    OverdueActions?: {
        Android?: {
            enabled: boolean;
            action: string;
            redirectUrl?: string;
            errorMessage?: string;
        };
        Backend?: {
            enabled: boolean;
            action: string;
            errorMessage?: string;
            allowedEndpoints?: string[];
        };
        Frontend?: {
            enabled: boolean;
            action: string;
            redirectUrl?: string;
            errorMessage?: string;
        };
    };
    PaymentHistory?: Array<{
        Date: Date;
        Amount: number;
        Currency: string;
        Status: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const ApplicationsAdminPanel: React.FC = () => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [currentTab, setCurrentTab] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // Form states for create/edit
    const [formData, setFormData] = useState<Partial<Application>>({
        Name: '',
        Description: '',
        Company_Name: '',
        Company_Email: '',
        Company_Phone: '',
        Company_Website: '',
        Amount: 0,
        Currency: 'USD',
        BillingCycle: 'Monthly',
        OverdueGracePeriodDays: 45,
        OverdueActions: {
            Android: {
                enabled: true,
                action: 'crash',
                redirectUrl: '',
                errorMessage: 'Payment overdue. Please contact support.'
            },
            Backend: {
                enabled: true,
                action: 'error',
                errorMessage: 'Service suspended due to overdue payment.',
                allowedEndpoints: []
            },
            Frontend: {
                enabled: true,
                action: 'redirect',
                redirectUrl: '',
                errorMessage: 'Payment overdue. Please update payment.'
            }
        }
    });    // Load applications
    const loadApplications = async () => {
        setLoading(true);
        try {
            const response = await Axios({
                method: 'GET',
                url: '/api/admin/applications'
            });
            
            if (response.status === 200) {
                setApplications(response.data.data || []);
            } else {
                throw new Error('Failed to load applications');
            }
        } catch (error) {
            console.error('Error loading applications:', error);
            setSnackbar({
                open: true,
                message: 'Failed to load applications',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadApplications();
    }, []);    // Handle create/edit application
    const handleSaveApplication = async () => {
        try {
            const method = selectedApp ? 'PUT' : 'POST';
            const url = selectedApp 
                ? `/api/admin/applications/${selectedApp._id}`
                : '/api/admin/applications';

            const response = await Axios({
                method,
                url,
                data: formData
            });

            if (response.status === 200) {
                setSnackbar({
                    open: true,
                    message: `Application ${selectedApp ? 'updated' : 'created'} successfully`,
                    severity: 'success'
                });
                setDialogOpen(false);
                setSelectedApp(null);
                setFormData({});
                loadApplications();
            } else {
                throw new Error('Failed to save application');
            }
        } catch (error) {
            console.error('Error saving application:', error);
            setSnackbar({
                open: true,
                message: 'Failed to save application',
                severity: 'error'
            });
        }
    };    // Handle delete application
    const handleDeleteApplication = async () => {
        if (!selectedApp) return;

        try {
            const response = await Axios({
                method: 'DELETE',
                url: `/api/admin/applications/${selectedApp._id}`
            });

            if (response.status === 200) {
                setSnackbar({
                    open: true,
                    message: 'Application deleted successfully',
                    severity: 'success'
                });
                setDeleteDialogOpen(false);
                setSelectedApp(null);
                loadApplications();
            } else {
                throw new Error('Failed to delete application');
            }
        } catch (error) {
            console.error('Error deleting application:', error);
            setSnackbar({
                open: true,
                message: 'Failed to delete application',
                severity: 'error'
            });
        }
    };

    // Filter applications
    const filteredApplications = applications.filter(app => {
        const matchesSearch = 
            app.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.Company_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.ApplicationID.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = 
            filterStatus === 'all' ||
            (filterStatus === 'overdue' && app.IsOverdue) ||
            (filterStatus === 'active' && !app.IsOverdue);

        return matchesSearch && matchesFilter;
    });

    // Statistics
    const stats = {
        total: applications.length,
        overdue: applications.filter(app => app.IsOverdue).length,
        active: applications.filter(app => !app.IsOverdue).length,
        revenue: applications.reduce((sum, app) => sum + app.Amount, 0)
    };

    const getStatusChip = (app: Application) => {
        if (app.IsOverdue) {
            return <Chip icon={<ErrorIcon />} label="Overdue" color="error" size="small" />;
        }
        return <Chip icon={<CheckCircleIcon />} label="Active" color="success" size="small" />;
    };

    const getClientTypeIcon = (type: string) => {
        switch (type) {
            case 'Client': return <LanguageIcon />;
            case 'Server': return <StorageIcon />;
            case 'Database': return <StorageIcon />;
            default: return <ComputerIcon />;
        }
    };

    const openCreateDialog = () => {
        setSelectedApp(null);
        setFormData({
            Name: '',
            Description: '',
            Company_Name: '',
            Company_Email: '',
            Company_Phone: '',
            Company_Website: '',
            Amount: 0,
            Currency: 'USD',
            BillingCycle: 'Monthly',
            OverdueGracePeriodDays: 45,
            OverdueActions: {
                Android: {
                    enabled: true,
                    action: 'crash',
                    redirectUrl: '',
                    errorMessage: 'Payment overdue. Please contact support.'
                },
                Backend: {
                    enabled: true,
                    action: 'error',
                    errorMessage: 'Service suspended due to overdue payment.',
                    allowedEndpoints: []
                },
                Frontend: {
                    enabled: true,
                    action: 'redirect',
                    redirectUrl: '',
                    errorMessage: 'Payment overdue. Please update payment.'
                }
            }
        });
        setDialogOpen(true);
    };

    const openEditDialog = (app: Application) => {
        setSelectedApp(app);
        setFormData({ ...app });
        setDialogOpen(true);
    };

    const openViewDialog = (app: Application) => {
        setSelectedApp(app);
        setViewDialogOpen(true);
    };

    const openDeleteDialog = (app: Application) => {
        setSelectedApp(app);
        setDeleteDialogOpen(true);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: 3, maxWidth: '100%', overflow: 'hidden' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                        Applications Management
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={loadApplications}
                            disabled={loading}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={openCreateDialog}
                        >
                            Create Application
                        </Button>
                    </Box>
                </Box>

                {/* Statistics Cards */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Total Applications
                                </Typography>
                                <Typography variant="h4" component="div">
                                    {stats.total}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Active
                                </Typography>
                                <Typography variant="h4" component="div" color="success.main">
                                    {stats.active}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Overdue
                                </Typography>
                                <Typography variant="h4" component="div" color="error.main">
                                    {stats.overdue}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Total Revenue
                                </Typography>
                                <Typography variant="h4" component="div">
                                    ${stats.revenue.toLocaleString()}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Search and Filter */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                placeholder="Search applications..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Filter by Status</InputLabel>
                                <Select
                                    value={filterStatus}
                                    label="Filter by Status"
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <MenuItem value="all">All Applications</MenuItem>
                                    <MenuItem value="active">Active Only</MenuItem>
                                    <MenuItem value="overdue">Overdue Only</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={() => {
                                    // TODO: Implement export functionality
                                    setSnackbar({
                                        open: true,
                                        message: 'Export functionality coming soon',
                                        severity: 'error'
                                    });
                                }}
                            >
                                Export CSV
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Applications Table */}
                <Paper>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Application</TableCell>
                                    <TableCell>Company</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Billing</TableCell>
                                    <TableCell>Due Date</TableCell>
                                    <TableCell>Services</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center">
                                            <CircularProgress />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredApplications.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center">
                                            No applications found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredApplications.map((app) => (
                                        <TableRow key={app._id} hover>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="subtitle2">
                                                        {app.Name || 'Unnamed Application'}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        ID: {app.ApplicationID}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2">
                                                        {app.Company_Name || 'N/A'}
                                                    </Typography>
                                                    {app.Company_Email && (
                                                        <Typography variant="caption" color="textSecondary">
                                                            {app.Company_Email}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusChip(app)}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {app.Amount} {app.Currency}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={app.BillingCycle} 
                                                    variant="outlined" 
                                                    size="small" 
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {app.PaymentDueDate ? (
                                                    <Typography 
                                                        variant="body2"
                                                        color={app.IsOverdue ? 'error' : 'textPrimary'}
                                                    >
                                                        {format(new Date(app.PaymentDueDate), 'MMM dd, yyyy')}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="body2" color="textSecondary">
                                                        Not set
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    {app.Services?.map((service, index) => (
                                                        <Tooltip key={index} title={`${service.ClientType}: ${service.enabled ? 'Enabled' : 'Disabled'}`}>
                                                            <Chip
                                                                icon={getClientTypeIcon(service.ClientType)}
                                                                label={service.ClientType}
                                                                size="small"
                                                                variant={service.enabled ? "filled" : "outlined"}
                                                                color={service.enabled ? "primary" : "default"}
                                                            />
                                                        </Tooltip>
                                                    )) || <Typography variant="caption">No services</Typography>}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <Tooltip title="View Details">
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => openViewDialog(app)}
                                                        >
                                                            <ViewIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Edit">
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => openEditDialog(app)}
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete">
                                                        <IconButton 
                                                            size="small" 
                                                            color="error"
                                                            onClick={() => openDeleteDialog(app)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                {/* Create/Edit Dialog */}
                <Dialog 
                    open={dialogOpen} 
                    onClose={() => setDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        {selectedApp ? 'Edit Application' : 'Create New Application'}
                    </DialogTitle>
                    <DialogContent>
                        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
                            <Tab label="Basic Info" />
                            <Tab label="Payment" />
                            <Tab label="Overdue Actions" />
                        </Tabs>

                        {/* Basic Info Tab */}
                        {currentTab === 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Application Name"
                                            value={formData.Name || ''}
                                            onChange={(e) => setFormData({...formData, Name: e.target.value})}
                                            margin="normal"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Icon URL"
                                            value={formData.Icon || ''}
                                            onChange={(e) => setFormData({...formData, Icon: e.target.value})}
                                            margin="normal"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Description"
                                            value={formData.Description || ''}
                                            onChange={(e) => setFormData({...formData, Description: e.target.value})}
                                            margin="normal"
                                            multiline
                                            rows={3}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Company Name"
                                            value={formData.Company_Name || ''}
                                            onChange={(e) => setFormData({...formData, Company_Name: e.target.value})}
                                            margin="normal"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Company Email"
                                            value={formData.Company_Email || ''}
                                            onChange={(e) => setFormData({...formData, Company_Email: e.target.value})}
                                            margin="normal"
                                            type="email"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Company Phone"
                                            value={formData.Company_Phone || ''}
                                            onChange={(e) => setFormData({...formData, Company_Phone: e.target.value})}
                                            margin="normal"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Company Website"
                                            value={formData.Company_Website || ''}
                                            onChange={(e) => setFormData({...formData, Company_Website: e.target.value})}
                                            margin="normal"
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {/* Payment Tab */}
                        {currentTab === 1 && (
                            <Box sx={{ mt: 2 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={4}>
                                        <TextField
                                            fullWidth
                                            label="Amount"
                                            value={formData.Amount || 0}
                                            onChange={(e) => setFormData({...formData, Amount: Number(e.target.value)})}
                                            margin="normal"
                                            type="number"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <FormControl fullWidth margin="normal">
                                            <InputLabel>Currency</InputLabel>
                                            <Select
                                                value={formData.Currency || 'USD'}
                                                label="Currency"
                                                onChange={(e) => setFormData({...formData, Currency: e.target.value})}
                                            >
                                                <MenuItem value="USD">USD</MenuItem>
                                                <MenuItem value="EUR">EUR</MenuItem>
                                                <MenuItem value="GBP">GBP</MenuItem>
                                                <MenuItem value="INR">INR</MenuItem>
                                                <MenuItem value="JPY">JPY</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <FormControl fullWidth margin="normal">
                                            <InputLabel>Billing Cycle</InputLabel>
                                            <Select
                                                value={formData.BillingCycle || 'Monthly'}
                                                label="Billing Cycle"
                                                onChange={(e) => setFormData({...formData, BillingCycle: e.target.value})}
                                            >
                                                <MenuItem value="OneTime">One Time</MenuItem>
                                                <MenuItem value="Monthly">Monthly</MenuItem>
                                                <MenuItem value="Yearly">Yearly</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Grace Period (Days)"
                                            value={formData.OverdueGracePeriodDays || 45}
                                            onChange={(e) => setFormData({...formData, OverdueGracePeriodDays: Number(e.target.value)})}
                                            margin="normal"
                                            type="number"
                                        />
                                    </Grid>                                    <Grid item xs={12} md={6}>                                        <DatePicker
                                            label="Payment Due Date"
                                            value={formData.PaymentDueDate ? new Date(formData.PaymentDueDate) : null}
                                            onChange={(date) => setFormData({...formData, PaymentDueDate: date ? (date instanceof Date ? date : date.toJSDate()) : undefined})}
                                            slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {/* Overdue Actions Tab */}
                        {currentTab === 2 && (
                            <Box sx={{ mt: 2 }}>
                                {/* Android Actions */}
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <SmartphoneIcon sx={{ mr: 2 }} />
                                        <Typography>Android Client Actions</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12}>
                                                <FormControlLabel
                                                    control={                                                        <Switch
                                                            checked={formData.OverdueActions?.Android?.enabled || false}
                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                OverdueActions: {
                                                                    ...formData.OverdueActions,
                                                                    Android: {
                                                                        enabled: e.target.checked,
                                                                        action: formData.OverdueActions?.Android?.action || 'crash',
                                                                        redirectUrl: formData.OverdueActions?.Android?.redirectUrl || '',
                                                                        errorMessage: formData.OverdueActions?.Android?.errorMessage || ''
                                                                    }
                                                                }
                                                            })}
                                                        />
                                                    }
                                                    label="Enable Android Overdue Actions"
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <FormControl fullWidth>
                                                    <InputLabel>Action Type</InputLabel>
                                                    <Select
                                                        value={formData.OverdueActions?.Android?.action || 'crash'}
                                                        label="Action Type"                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            OverdueActions: {
                                                                ...formData.OverdueActions,
                                                                Android: {
                                                                    enabled: formData.OverdueActions?.Android?.enabled || false,
                                                                    action: e.target.value,
                                                                    redirectUrl: formData.OverdueActions?.Android?.redirectUrl || '',
                                                                    errorMessage: formData.OverdueActions?.Android?.errorMessage || ''
                                                                }
                                                            }
                                                        })}
                                                    >
                                                        <MenuItem value="crash">Crash App</MenuItem>
                                                        <MenuItem value="redirect">Redirect</MenuItem>
                                                        <MenuItem value="disable">Disable</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    fullWidth
                                                    label="Redirect URL"
                                                    value={formData.OverdueActions?.Android?.redirectUrl || ''}                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        OverdueActions: {
                                                            ...formData.OverdueActions,
                                                            Android: {
                                                                enabled: formData.OverdueActions?.Android?.enabled || false,
                                                                action: formData.OverdueActions?.Android?.action || 'crash',
                                                                redirectUrl: e.target.value,
                                                                errorMessage: formData.OverdueActions?.Android?.errorMessage || ''
                                                            }
                                                        }
                                                    })}
                                                />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    label="Error Message"
                                                    value={formData.OverdueActions?.Android?.errorMessage || ''}                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        OverdueActions: {
                                                            ...formData.OverdueActions,
                                                            Android: {
                                                                enabled: formData.OverdueActions?.Android?.enabled || false,
                                                                action: formData.OverdueActions?.Android?.action || 'crash',
                                                                redirectUrl: formData.OverdueActions?.Android?.redirectUrl || '',
                                                                errorMessage: e.target.value
                                                            }
                                                        }
                                                    })}
                                                    multiline
                                                    rows={2}
                                                />
                                            </Grid>
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>

                                {/* Backend Actions */}
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <StorageIcon sx={{ mr: 2 }} />
                                        <Typography>Backend Client Actions</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12}>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={formData.OverdueActions?.Backend?.enabled || false}                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                OverdueActions: {
                                                                    ...formData.OverdueActions,
                                                                    Backend: {
                                                                        enabled: e.target.checked,
                                                                        action: formData.OverdueActions?.Backend?.action || 'error',
                                                                        errorMessage: formData.OverdueActions?.Backend?.errorMessage || '',
                                                                        allowedEndpoints: formData.OverdueActions?.Backend?.allowedEndpoints || []
                                                                    }
                                                                }
                                                            })}
                                                        />
                                                    }
                                                    label="Enable Backend Overdue Actions"
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <FormControl fullWidth>
                                                    <InputLabel>Action Type</InputLabel>
                                                    <Select
                                                        value={formData.OverdueActions?.Backend?.action || 'error'}
                                                        label="Action Type"                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            OverdueActions: {
                                                                ...formData.OverdueActions,
                                                                Backend: {
                                                                    enabled: formData.OverdueActions?.Backend?.enabled || false,
                                                                    action: e.target.value,
                                                                    errorMessage: formData.OverdueActions?.Backend?.errorMessage || '',
                                                                    allowedEndpoints: formData.OverdueActions?.Backend?.allowedEndpoints || []
                                                                }
                                                            }
                                                        })}
                                                    >
                                                        <MenuItem value="error">Return Error</MenuItem>
                                                        <MenuItem value="disable">Disable Service</MenuItem>
                                                        <MenuItem value="limited_access">Limited Access</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    label="Error Message"
                                                    value={formData.OverdueActions?.Backend?.errorMessage || ''}                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        OverdueActions: {
                                                            ...formData.OverdueActions,
                                                            Backend: {
                                                                enabled: formData.OverdueActions?.Backend?.enabled || false,
                                                                action: formData.OverdueActions?.Backend?.action || 'error',
                                                                errorMessage: e.target.value,
                                                                allowedEndpoints: formData.OverdueActions?.Backend?.allowedEndpoints || []
                                                            }
                                                        }
                                                    })}
                                                    multiline
                                                    rows={2}
                                                />
                                            </Grid>
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>

                                {/* Frontend Actions */}
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <LanguageIcon sx={{ mr: 2 }} />
                                        <Typography>Frontend Client Actions</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12}>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={formData.OverdueActions?.Frontend?.enabled || false}                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                OverdueActions: {
                                                                    ...formData.OverdueActions,
                                                                    Frontend: {
                                                                        enabled: e.target.checked,
                                                                        action: formData.OverdueActions?.Frontend?.action || 'redirect',
                                                                        redirectUrl: formData.OverdueActions?.Frontend?.redirectUrl || '',
                                                                        errorMessage: formData.OverdueActions?.Frontend?.errorMessage || ''
                                                                    }
                                                                }
                                                            })}
                                                        />
                                                    }
                                                    label="Enable Frontend Overdue Actions"
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <FormControl fullWidth>
                                                    <InputLabel>Action Type</InputLabel>
                                                    <Select
                                                        value={formData.OverdueActions?.Frontend?.action || 'redirect'}
                                                        label="Action Type"                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            OverdueActions: {
                                                                ...formData.OverdueActions,
                                                                Frontend: {
                                                                    enabled: formData.OverdueActions?.Frontend?.enabled || false,
                                                                    action: e.target.value,
                                                                    redirectUrl: formData.OverdueActions?.Frontend?.redirectUrl || '',
                                                                    errorMessage: formData.OverdueActions?.Frontend?.errorMessage || ''
                                                                }
                                                            }
                                                        })}
                                                    >
                                                        <MenuItem value="redirect">Redirect</MenuItem>
                                                        <MenuItem value="overlay">Show Overlay</MenuItem>
                                                        <MenuItem value="disable">Disable</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    fullWidth
                                                    label="Redirect URL"
                                                    value={formData.OverdueActions?.Frontend?.redirectUrl || ''}                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        OverdueActions: {
                                                            ...formData.OverdueActions,
                                                            Frontend: {
                                                                enabled: formData.OverdueActions?.Frontend?.enabled || false,
                                                                action: formData.OverdueActions?.Frontend?.action || 'redirect',
                                                                redirectUrl: e.target.value,
                                                                errorMessage: formData.OverdueActions?.Frontend?.errorMessage || ''
                                                            }
                                                        }
                                                    })}
                                                />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    label="Error Message"
                                                    value={formData.OverdueActions?.Frontend?.errorMessage || ''}                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        OverdueActions: {
                                                            ...formData.OverdueActions,
                                                            Frontend: {
                                                                enabled: formData.OverdueActions?.Frontend?.enabled || false,
                                                                action: formData.OverdueActions?.Frontend?.action || 'redirect',
                                                                redirectUrl: formData.OverdueActions?.Frontend?.redirectUrl || '',
                                                                errorMessage: e.target.value
                                                            }
                                                        }
                                                    })}
                                                    multiline
                                                    rows={2}
                                                />
                                            </Grid>
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveApplication} variant="contained">
                            {selectedApp ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* View Dialog */}
                <Dialog 
                    open={viewDialogOpen} 
                    onClose={() => setViewDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        Application Details
                    </DialogTitle>
                    <DialogContent>
                        {selectedApp && (
                            <Box>
                                <Grid container spacing={2}>                                    <Grid item xs={12} md={6}>
                                        <Typography variant="h6" gutterBottom>Basic Information</Typography>
                                        <Typography><Box component="span" fontWeight="bold">Name:</Box> {selectedApp.Name || 'N/A'}</Typography>
                                        <Typography><Box component="span" fontWeight="bold">ID:</Box> {selectedApp.ApplicationID}</Typography>
                                        <Typography><Box component="span" fontWeight="bold">Description:</Box> {selectedApp.Description || 'N/A'}</Typography>
                                        <Typography><Box component="span" fontWeight="bold">Company:</Box> {selectedApp.Company_Name || 'N/A'}</Typography>
                                        <Typography><Box component="span" fontWeight="bold">Email:</Box> {selectedApp.Company_Email || 'N/A'}</Typography>
                                        <Typography><Box component="span" fontWeight="bold">Phone:</Box> {selectedApp.Company_Phone || 'N/A'}</Typography>
                                        <Typography><Box component="span" fontWeight="bold">Website:</Box> {selectedApp.Company_Website || 'N/A'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="h6" gutterBottom>Payment Information</Typography>
                                        <Typography><Box component="span" fontWeight="bold">Amount:</Box> {selectedApp.Amount} {selectedApp.Currency}</Typography>
                                        <Typography><Box component="span" fontWeight="bold">Billing Cycle:</Box> {selectedApp.BillingCycle}</Typography>
                                        <Typography><Box component="span" fontWeight="bold">Status:</Box> {selectedApp.IsOverdue ? 'Overdue' : 'Active'}</Typography>
                                        <Typography><Box component="span" fontWeight="bold">Grace Period:</Box> {selectedApp.OverdueGracePeriodDays || 45} days</Typography>
                                        <Typography><Box component="span" fontWeight="bold">Due Date:</Box> {selectedApp.PaymentDueDate ? format(new Date(selectedApp.PaymentDueDate), 'MMM dd, yyyy') : 'Not set'}</Typography>
                                        <Typography><Box component="span" fontWeight="bold">Last Payment:</Box> {selectedApp.LastPaymentDate ? format(new Date(selectedApp.LastPaymentDate), 'MMM dd, yyyy') : 'None'}</Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="h6" gutterBottom>Services</Typography>
                                        {selectedApp.Services && selectedApp.Services.length > 0 ? (
                                            selectedApp.Services.map((service, index) => (
                                                <Chip
                                                    key={index}
                                                    icon={getClientTypeIcon(service.ClientType)}
                                                    label={`${service.ClientType}: ${service.enabled ? 'Enabled' : 'Disabled'}`}
                                                    variant={service.enabled ? "filled" : "outlined"}
                                                    color={service.enabled ? "primary" : "default"}
                                                    sx={{ mr: 1, mb: 1 }}
                                                />
                                            ))
                                        ) : (
                                            <Typography color="textSecondary">No services configured</Typography>
                                        )}
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="h6" gutterBottom>Payment History</Typography>
                                        {selectedApp.PaymentHistory && selectedApp.PaymentHistory.length > 0 ? (
                                            <Box>
                                                {selectedApp.PaymentHistory.slice(0, 5).map((payment, index) => (
                                                    <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                        <Typography variant="body2">
                                                            {format(new Date(payment.Date), 'MMM dd, yyyy')} - 
                                                            {payment.Amount} {payment.Currency} - 
                                                            <Chip 
                                                                label={payment.Status} 
                                                                size="small" 
                                                                color={payment.Status === 'Completed' ? 'success' : payment.Status === 'Failed' ? 'error' : 'warning'}
                                                                sx={{ ml: 1 }}
                                                            />
                                                        </Typography>
                                                    </Box>
                                                ))}
                                                {selectedApp.PaymentHistory.length > 5 && (
                                                    <Typography variant="caption" color="textSecondary">
                                                        And {selectedApp.PaymentHistory.length - 5} more payments...
                                                    </Typography>
                                                )}
                                            </Box>
                                        ) : (
                                            <Typography color="textSecondary">No payment history</Typography>
                                        )}
                                    </Grid>
                                </Grid>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Dialog */}
                <Dialog 
                    open={deleteDialogOpen} 
                    onClose={() => setDeleteDialogOpen(false)}
                >
                    <DialogTitle>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <WarningIcon color="error" sx={{ mr: 1 }} />
                            Confirm Delete
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete the application "{selectedApp?.Name || selectedApp?.ApplicationID}"?
                        </Typography>
                        <Alert severity="error" sx={{ mt: 2 }}>
                            This action cannot be undone. All associated data will be permanently deleted.
                        </Alert>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleDeleteApplication} color="error" variant="contained">
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Snackbar */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    <Alert 
                        onClose={() => setSnackbar({ ...snackbar, open: false })} 
                        severity={snackbar.severity}
                        sx={{ width: '100%' }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
};

export default ApplicationsAdminPanel;
