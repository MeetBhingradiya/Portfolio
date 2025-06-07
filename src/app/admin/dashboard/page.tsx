'use client';

import React from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Tabs,
    Tab,
    Avatar,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Divider,
    Paper,
    IconButton,
    CircularProgress,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    AirplaneTicket as TicketIcon,
    Send as SendIcon,
    Edit as EditIcon,
    Logout as LogoutIcon,
    Settings as SettingsIcon,
    Assessment as StatsIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    AccessTime as TimeIcon,
    TrendingUp as TrendingUpIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth, withAuth } from '@contexts/AuthContext';
import { useAdminTickets, useDashboardStats } from '@Hooks/useTickets';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`admin-tabpanel-${index}`}
            aria-labelledby={`admin-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

function AdminDashboard() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const { tickets, loading: ticketsLoading, error, stats, updateTicketStatus, addAdminResponse, updating } = useAdminTickets();
    const { stats: dashboardStats, loading: statsLoading } = useDashboardStats();

    const [tabValue, setTabValue] = React.useState(0);
    const [selectedTicket, setSelectedTicket] = React.useState<any>(null);
    const [adminResponse, setAdminResponse] = React.useState('');
    const [responseDialogOpen, setResponseDialogOpen] = React.useState(false);
    const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = React.useState(false);
    const [newStatus, setNewStatus] = React.useState('');
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    const openResponseDialog = (ticket: any) => {
        setSelectedTicket(ticket);
        setResponseDialogOpen(true);
    };

    const openStatusDialog = (ticket: any) => {
        setSelectedTicket(ticket);
        setNewStatus(ticket.status);
        setStatusUpdateDialogOpen(true);
    };

    const sendAdminResponse = async () => {
        if (!selectedTicket || !adminResponse.trim()) return;

        const result = await addAdminResponse(selectedTicket.id, adminResponse);
        
        if (result.success) {
            setAdminResponse('');
            setResponseDialogOpen(false);
        }
    };

    const updateStatus = async () => {
        if (!selectedTicket || !newStatus) return;

        const result = await updateTicketStatus(selectedTicket.id, newStatus);
        
        if (result.success) {
            setStatusUpdateDialogOpen(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'info';
            case 'in-progress': return 'warning';
            case 'resolved': return 'success';
            case 'closed': return 'default';
            default: return 'default';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'error';
            case 'medium': return 'warning';
            case 'low': return 'success';
            default: return 'default';
        }
    };

    const handlePageChange = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedTickets = tickets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {/* Header */}
            <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                            <DashboardIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" fontWeight="bold">
                                Admin Dashboard
                            </Typography>
                            <Typography variant="body1" sx={{ opacity: 0.9 }}>
                                Manage users, tickets, and system statistics
                            </Typography>
                        </Box>
                    </Box>
                    <Box display="flex" gap={1}>
                        <IconButton 
                            color="inherit" 
                            onClick={() => router.push('/dashboard')}
                            title="User Dashboard"
                        >
                            <PersonIcon />
                        </IconButton>
                        <IconButton color="inherit" title="Settings">
                            <SettingsIcon />
                        </IconButton>
                        <IconButton 
                            color="inherit" 
                            onClick={logout}
                            title="Logout"
                        >
                            <LogoutIcon />
                        </IconButton>
                    </Box>
                </Box>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}
            {/* Statistics Cards */}
            <Box 
                sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { 
                        xs: '1fr', 
                        sm: 'repeat(2, 1fr)', 
                        md: 'repeat(4, 1fr)' 
                    }, 
                    gap: 3, 
                    mb: 3 
                }}
            >
                <Card>
                    <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    Total Users
                                </Typography>
                                <Typography variant="h4">
                                    {statsLoading ? <CircularProgress size={20} /> : dashboardStats?.totalUsers || 0}
                                </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <PeopleIcon />
                            </Avatar>
                        </Box>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    Total Tickets
                                </Typography>
                                <Typography variant="h4">
                                    {stats.total}
                                </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'info.main' }}>
                                <TicketIcon />
                            </Avatar>
                        </Box>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    Open Tickets
                                </Typography>
                                <Typography variant="h4">
                                    {stats.open}
                                </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'warning.main' }}>
                                <AssignmentIcon />
                            </Avatar>
                        </Box>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    Active Sessions
                                </Typography>
                                <Typography variant="h4">
                                    {statsLoading ? <CircularProgress size={20} /> : dashboardStats?.activeSessions || 0}
                                </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'success.main' }}>
                                <TrendingUpIcon />
                            </Avatar>
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                    <Tab label="Tickets Management" icon={<TicketIcon />} />
                    <Tab label="System Statistics" icon={<StatsIcon />} />
                </Tabs>
            </Box>

            {/* Tickets Management Tab */}
            <TabPanel value={tabValue} index={0}>
                <Card>
                    <CardContent>
                        <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
                            <Typography variant="h5" fontWeight="bold">
                                Support Tickets Management
                            </Typography>
                            <Box display="flex" gap={2}>
                                <Chip label={`Open: ${stats.open}`} color="info" />
                                <Chip label={`In Progress: ${stats.inProgress}`} color="warning" />
                                <Chip label={`Resolved: ${stats.resolved}`} color="success" />
                                <Chip label={`Closed: ${stats.closed}`} color="default" />
                            </Box>
                        </Box>

                        {ticketsLoading ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Ticket ID</TableCell>
                                                <TableCell>Subject</TableCell>
                                                <TableCell>Email</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Priority</TableCell>
                                                <TableCell>Created</TableCell>
                                                <TableCell>Responses</TableCell>
                                                <TableCell>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {paginatedTickets.map((ticket) => (
                                                <TableRow key={ticket.id} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" fontFamily="monospace">
                                                            {ticket.id.slice(-8)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                                                            {ticket.subject}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {ticket.email}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip 
                                                            label={ticket.status} 
                                                            color={getStatusColor(ticket.status) as any}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip 
                                                            label={ticket.priority} 
                                                            color={getPriorityColor(ticket.priority) as any}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {ticket.responses.length}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box display="flex" gap={1}>
                                                            <Button 
                                                                size="small"
                                                                onClick={() => openStatusDialog(ticket)}
                                                                disabled={updating}
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </Button>
                                                            <Button 
                                                                size="small"
                                                                onClick={() => openResponseDialog(ticket)}
                                                                disabled={updating}
                                                            >
                                                                <SendIcon fontSize="small" />
                                                            </Button>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25]}
                                    component="div"
                                    count={tickets.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handlePageChange}
                                    onRowsPerPageChange={handleRowsPerPageChange}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>
            </TabPanel>            {/* System Statistics Tab */}
            <TabPanel value={tabValue} index={1}>
                <Box 
                    sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: { 
                            xs: '1fr', 
                            md: 'repeat(2, 1fr)' 
                        }, 
                        gap: 3 
                    }}
                >
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                User Statistics
                            </Typography>
                            {statsLoading ? (
                                <CircularProgress />
                            ) : (
                                <List>
                                    <ListItem>
                                        <ListItemText
                                            primary="Total Users"
                                            secondary={dashboardStats?.totalUsers || 0}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Active Users"
                                            secondary={dashboardStats?.activeUsers || 0}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Total Sessions"
                                            secondary={dashboardStats?.totalSessions || 0}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Active Sessions"
                                            secondary={dashboardStats?.activeSessions || 0}
                                        />
                                    </ListItem>
                                </List>
                            )}
                        </CardContent>
                    </Card>
                      <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Ticket Statistics
                            </Typography>
                            <List>
                                <ListItem>
                                    <ListItemText
                                        primary="Total Tickets"
                                        secondary={stats.total}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="Open Tickets"
                                        secondary={stats.open}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="In Progress"
                                        secondary={stats.inProgress}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="Resolved"
                                        secondary={stats.resolved}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="Closed"
                                        secondary={stats.closed}
                                    />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Box>
            </TabPanel>

            {/* Admin Response Dialog */}
            <Dialog 
                open={responseDialogOpen} 
                onClose={() => setResponseDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Add Admin Response to Ticket: {selectedTicket?.id}
                </DialogTitle>
                <DialogContent>
                    <Box mb={2}>
                        <Typography variant="body2" color="textSecondary">
                            Customer: {selectedTicket?.email}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Subject: {selectedTicket?.subject}
                        </Typography>
                    </Box>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Admin Response"
                        multiline
                        rows={4}
                        fullWidth
                        variant="outlined"
                        value={adminResponse}
                        onChange={(e) => setAdminResponse(e.target.value)}
                        placeholder="Type your admin response here..."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResponseDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={sendAdminResponse}
                        variant="contained"
                        startIcon={<SendIcon />}
                        disabled={!adminResponse.trim() || updating}
                    >
                        {updating ? 'Sending...' : 'Send Response'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Status Update Dialog */}
            <Dialog 
                open={statusUpdateDialogOpen} 
                onClose={() => setStatusUpdateDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Update Ticket Status
                </DialogTitle>
                <DialogContent>
                    <Box mb={2}>
                        <Typography variant="body2" color="textSecondary">
                            Ticket: {selectedTicket?.id}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Subject: {selectedTicket?.subject}
                        </Typography>
                    </Box>
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            label="Status"
                        >
                            <MenuItem value="open">Open</MenuItem>
                            <MenuItem value="in-progress">In Progress</MenuItem>
                            <MenuItem value="resolved">Resolved</MenuItem>
                            <MenuItem value="closed">Closed</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStatusUpdateDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={updateStatus}
                        variant="contained"
                        disabled={!newStatus || updating}
                    >
                        {updating ? 'Updating...' : 'Update Status'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default withAuth(AdminDashboard, true);
