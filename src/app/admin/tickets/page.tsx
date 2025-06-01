"use client";

import React, { useState, useEffect } from "react";
import { 
    Box, 
    Paper, 
    Typography, 
    TextField, 
    Button, 
    Chip, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    TablePagination,
    Select, 
    MenuItem, 
    FormControl, 
    InputLabel, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions,
    IconButton,
    Alert,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider
} from "@mui/material";
import { 
    Search, 
    Edit, 
    Delete, 
    Reply, 
    ExpandMore, 
    Security, 
    Visibility, 
    VisibilityOff,
    Refresh,
    FilterList
} from "@mui/icons-material";
import { Axios } from "@Utils/Axios";

interface Ticket {
    _id: string;
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    projectType: string;
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high';
    clientIP?: string;
    responses: Array<{
        id: string;
        message: string;
        isAdmin: boolean;
        createdAt: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

interface AdminState {
    isAuthenticated: boolean;
    token: string;
    signature: string;
    showPassword: boolean;
    authError: string;
    tryCount: number;
    isBlocked: boolean;
    blockExpiry: number;
}

interface TicketState {
    tickets: Ticket[];
    loading: boolean;
    error: string;
    selectedTicket: Ticket | null;
    showResponseDialog: boolean;
    responseText: string;
    filters: {
        status: string;
        priority: string;
        search: string;
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

const statusColors = {
    open: 'error',
    'in-progress': 'warning',
    resolved: 'success',
    closed: 'default'
} as const;

const priorityColors = {
    low: 'success',
    medium: 'warning',
    high: 'error'
} as const;

export default function AdminTicketsPortal() {
    const [adminState, setAdminState] = useState<AdminState>({
        isAuthenticated: false,
        token: '',
        signature: '',
        showPassword: false,
        authError: '',
        tryCount: 0,
        isBlocked: false,
        blockExpiry: 0
    });

    const [ticketState, setTicketState] = useState<TicketState>({
        tickets: [],
        loading: false,
        error: '',
        selectedTicket: null,
        showResponseDialog: false,
        responseText: '',
        filters: {
            status: 'all',
            priority: 'all',
            search: ''
        },
        pagination: {
            page: 1,
            limit: 20,
            total: 0,
            pages: 0
        }
    });

    useEffect(() => {
        checkIfBlocked();
    }, []);

    useEffect(() => {
        if (adminState.isAuthenticated) {
            loadTickets();
        }
    }, [adminState.isAuthenticated, ticketState.filters, ticketState.pagination.page]);

    const checkIfBlocked = () => {
        const isBlocked = localStorage.getItem('adminAccessBlocked') === 'true';
        const blockedUntil = localStorage.getItem('adminAccessBlockExpiry');
        const tryCount = parseInt(localStorage.getItem('adminAccessTryCount') || '0');

        if (isBlocked && blockedUntil) {
            const blockExpiry = parseInt(blockedUntil);
            if (Date.now() < blockExpiry) {
                setAdminState(prev => ({
                    ...prev,
                    isBlocked: true,
                    blockExpiry,
                    tryCount,
                    authError: "You are blocked for 24 hours due to too many failed attempts."
                }));
                return;
            } else {
                // Clear expired block
                localStorage.removeItem('adminAccessBlocked');
                localStorage.removeItem('adminAccessBlockExpiry');
                localStorage.removeItem('adminAccessTryCount');
            }
        }
    };

    const handleAdminLogin = async () => {
        if (adminState.isBlocked) return;

        if (adminState.tryCount >= 3) {
            blockUser();
            return;
        }

        try {
            const response = await Axios.post("/api/adminsignature", {
                signature: adminState.signature
            });

            setAdminState(prev => ({
                ...prev,
                isAuthenticated: true,
                token: response.data.Data,
                authError: '',
                tryCount: 0
            }));

            // Clear any existing block
            localStorage.removeItem('adminAccessBlocked');
            localStorage.removeItem('adminAccessBlockExpiry');
            localStorage.removeItem('adminAccessTryCount');

        } catch (error: any) {
            const newTryCount = adminState.tryCount + 1;
            setAdminState(prev => ({
                ...prev,
                authError: error?.response?.data?.Message || 'Authentication failed',
                tryCount: newTryCount
            }));

            if (newTryCount >= 3) {
                blockUser();
            }
        }
    };

    const blockUser = () => {
        const blockExpiry = Date.now() + (24 * 60 * 60 * 1000);
        
        localStorage.setItem('adminAccessBlocked', 'true');
        localStorage.setItem('adminAccessBlockExpiry', blockExpiry.toString());
        localStorage.setItem('adminAccessTryCount', adminState.tryCount.toString());

        setAdminState(prev => ({
            ...prev,
            isBlocked: true,
            blockExpiry,
            authError: "You have exceeded the maximum number of attempts. You are blocked for 24 hours."
        }));
    };

    const loadTickets = async () => {
        setTicketState(prev => ({ ...prev, loading: true, error: '' }));
        
        try {
            const params = new URLSearchParams({
                page: ticketState.pagination.page.toString(),
                limit: ticketState.pagination.limit.toString(),
                ...(ticketState.filters.status !== 'all' && { status: ticketState.filters.status }),
                ...(ticketState.filters.priority !== 'all' && { priority: ticketState.filters.priority }),
                ...(ticketState.filters.search && { search: ticketState.filters.search })
            });

            const response = await Axios.get(`/api/admin/tickets?${params}`, {
                headers: {
                    Authorization: `Bearer ${adminState.token}`
                }
            });

            setTicketState(prev => ({
                ...prev,
                tickets: response.data.tickets,
                pagination: response.data.pagination,
                loading: false
            }));

        } catch (error: any) {
            setTicketState(prev => ({
                ...prev,
                error: error?.response?.data?.error || 'Failed to load tickets',
                loading: false
            }));
        }
    };

    const updateTicketStatus = async (ticketId: string, status: string) => {
        try {
            await Axios.patch('/api/admin/tickets', {
                ticketId,
                status
            }, {
                headers: {
                    Authorization: `Bearer ${adminState.token}`
                }
            });

            loadTickets();
        } catch (error: any) {
            setTicketState(prev => ({
                ...prev,
                error: error?.response?.data?.error || 'Failed to update ticket'
            }));
        }
    };

    const addAdminResponse = async () => {
        if (!ticketState.selectedTicket || !ticketState.responseText.trim()) return;

        try {
            await Axios.patch('/api/admin/tickets', {
                ticketId: ticketState.selectedTicket.id,
                response: ticketState.responseText
            }, {
                headers: {
                    Authorization: `Bearer ${adminState.token}`
                }
            });

            setTicketState(prev => ({
                ...prev,
                showResponseDialog: false,
                responseText: '',
                selectedTicket: null
            }));

            loadTickets();
        } catch (error: any) {
            setTicketState(prev => ({
                ...prev,
                error: error?.response?.data?.error || 'Failed to add response'
            }));
        }
    };

    const deleteTicket = async (ticketId: string) => {
        if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
            return;
        }

        try {
            await Axios.delete(`/api/admin/tickets?id=${ticketId}`, {
                headers: {
                    Authorization: `Bearer ${adminState.token}`
                }
            });

            loadTickets();
        } catch (error: any) {
            setTicketState(prev => ({
                ...prev,
                error: error?.response?.data?.error || 'Failed to delete ticket'
            }));
        }
    };

    // Authentication Form
    if (!adminState.isAuthenticated) {
        return (
            <Box 
                sx={{ 
                    minHeight: '100vh', 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2
                }}
            >
                <Paper 
                    elevation={10} 
                    sx={{ 
                        p: 4, 
                        maxWidth: 400, 
                        width: '100%',
                        borderRadius: 3,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Security sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
                        <Typography variant="h4" gutterBottom fontWeight="bold">
                            Admin Portal
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Ticket Management System
                        </Typography>
                    </Box>

                    {adminState.authError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {adminState.authError}
                        </Alert>
                    )}

                    {adminState.isBlocked && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Access blocked until: {new Date(adminState.blockExpiry).toLocaleString()}
                        </Alert>
                    )}

                    <TextField
                        fullWidth
                        label="Admin Signature"
                        type={adminState.showPassword ? 'text' : 'password'}
                        value={adminState.signature}
                        onChange={(e) => setAdminState(prev => ({ 
                            ...prev, 
                            signature: e.target.value 
                        }))}
                        disabled={adminState.isBlocked}
                        sx={{ mb: 2 }}
                        InputProps={{
                            endAdornment: (
                                <IconButton
                                    onClick={() => setAdminState(prev => ({ 
                                        ...prev, 
                                        showPassword: !prev.showPassword 
                                    }))}
                                >
                                    {adminState.showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            )
                        }}
                    />

                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleAdminLogin}
                        disabled={adminState.isBlocked || !adminState.signature.trim()}
                        sx={{ 
                            py: 1.5,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                            }
                        }}
                    >
                        Access Admin Portal
                    </Button>

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                        Attempts: {adminState.tryCount}/3
                    </Typography>
                </Paper>
            </Box>
        );
    }

    // Main Admin Dashboard
    return (
        <Box sx={{ p: 3, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" fontWeight="bold">
                        Ticket Management Portal
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={loadTickets}
                        disabled={ticketState.loading}
                    >
                        Refresh
                    </Button>
                </Box>

                {/* Filters */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                    <TextField
                        placeholder="Search tickets..."
                        value={ticketState.filters.search}
                        onChange={(e) => setTicketState(prev => ({
                            ...prev,
                            filters: { ...prev.filters, search: e.target.value }
                        }))}
                        InputProps={{
                            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                        sx={{ minWidth: 250 }}
                    />

                    <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={ticketState.filters.status}
                            label="Status"
                            onChange={(e) => setTicketState(prev => ({
                                ...prev,
                                filters: { ...prev.filters, status: e.target.value }
                            }))}
                        >
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="open">Open</MenuItem>
                            <MenuItem value="in-progress">In Progress</MenuItem>
                            <MenuItem value="resolved">Resolved</MenuItem>
                            <MenuItem value="closed">Closed</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel>Priority</InputLabel>
                        <Select
                            value={ticketState.filters.priority}
                            label="Priority"
                            onChange={(e) => setTicketState(prev => ({
                                ...prev,
                                filters: { ...prev.filters, priority: e.target.value }
                            }))}
                        >
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="low">Low</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="high">High</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {ticketState.error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setTicketState(prev => ({ ...prev, error: '' }))}>
                        {ticketState.error}
                    </Alert>
                )}
            </Paper>

            {/* Tickets Table */}
            <Paper elevation={2}>
                {ticketState.loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Ticket ID</TableCell>
                                        <TableCell>Customer</TableCell>
                                        <TableCell>Subject</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Priority</TableCell>
                                        <TableCell>Created</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {ticketState.tickets.map((ticket) => (
                                        <React.Fragment key={ticket.id}>
                                            <TableRow hover>
                                                <TableCell>
                                                    <Typography variant="body2" fontFamily="monospace">
                                                        {ticket.id}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {ticket.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {ticket.email}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                                        {ticket.subject}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <FormControl size="small" sx={{ minWidth: 120 }}>
                                                        <Select
                                                            value={ticket.status}
                                                            onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}
                                                            variant="outlined"
                                                        >
                                                            <MenuItem value="open">Open</MenuItem>
                                                            <MenuItem value="in-progress">In Progress</MenuItem>
                                                            <MenuItem value="resolved">Resolved</MenuItem>
                                                            <MenuItem value="closed">Closed</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        label={ticket.priority}
                                                        color={priorityColors[ticket.priority]}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption">
                                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setTicketState(prev => ({
                                                            ...prev,
                                                            selectedTicket: ticket,
                                                            showResponseDialog: true
                                                        }))}
                                                        title="Add Response"
                                                    >
                                                        <Reply />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => deleteTicket(ticket.id)}
                                                        color="error"
                                                        title="Delete Ticket"
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                            
                                            {/* Expandable ticket details */}
                                            <TableRow>
                                                <TableCell colSpan={7} sx={{ py: 0 }}>
                                                    <Accordion elevation={0}>
                                                        <AccordionSummary expandIcon={<ExpandMore />}>
                                                            <Typography variant="body2">
                                                                View Details & Responses ({ticket.responses.length})
                                                            </Typography>
                                                        </AccordionSummary>
                                                        <AccordionDetails>
                                                            <Box sx={{ mb: 2 }}>
                                                                <Typography variant="subtitle2" gutterBottom>
                                                                    Message:
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ mb: 2 }}>
                                                                    {ticket.message}
                                                                </Typography>
                                                                
                                                                {ticket.responses.length > 0 && (
                                                                    <>
                                                                        <Divider sx={{ my: 2 }} />
                                                                        <Typography variant="subtitle2" gutterBottom>
                                                                            Responses:
                                                                        </Typography>
                                                                        {ticket.responses.map((response) => (
                                                                            <Box 
                                                                                key={response.id}
                                                                                sx={{ 
                                                                                    mb: 2, 
                                                                                    p: 2, 
                                                                                    bgcolor: response.isAdmin ? '#e3f2fd' : '#f5f5f5',
                                                                                    borderRadius: 1
                                                                                }}
                                                                            >
                                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                                                    <Chip 
                                                                                        label={response.isAdmin ? 'Admin' : 'Customer'} 
                                                                                        size="small"
                                                                                        color={response.isAdmin ? 'primary' : 'default'}
                                                                                    />
                                                                                    <Typography variant="caption">
                                                                                        {new Date(response.createdAt).toLocaleString()}
                                                                                    </Typography>
                                                                                </Box>
                                                                                <Typography variant="body2">
                                                                                    {response.message}
                                                                                </Typography>
                                                                            </Box>
                                                                        ))}
                                                                    </>
                                                                )}
                                                            </Box>
                                                        </AccordionDetails>
                                                    </Accordion>
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TablePagination
                            component="div"
                            count={ticketState.pagination.total}
                            page={ticketState.pagination.page - 1}
                            onPageChange={(_, newPage) => setTicketState(prev => ({
                                ...prev,
                                pagination: { ...prev.pagination, page: newPage + 1 }
                            }))}
                            rowsPerPage={ticketState.pagination.limit}
                            onRowsPerPageChange={(e) => setTicketState(prev => ({
                                ...prev,
                                pagination: { ...prev.pagination, limit: parseInt(e.target.value), page: 1 }
                            }))}
                        />
                    </>
                )}
            </Paper>

            {/* Response Dialog */}
            <Dialog 
                open={ticketState.showResponseDialog} 
                onClose={() => setTicketState(prev => ({ ...prev, showResponseDialog: false }))}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Add Admin Response
                    {ticketState.selectedTicket && (
                        <Typography variant="subtitle2" color="text.secondary">
                            Ticket: {ticketState.selectedTicket.id}
                        </Typography>
                    )}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Response Message"
                        value={ticketState.responseText}
                        onChange={(e) => setTicketState(prev => ({ 
                            ...prev, 
                            responseText: e.target.value 
                        }))}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setTicketState(prev => ({ 
                            ...prev, 
                            showResponseDialog: false,
                            responseText: '',
                            selectedTicket: null
                        }))}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={addAdminResponse}
                        disabled={!ticketState.responseText.trim()}
                    >
                        Send Response
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
