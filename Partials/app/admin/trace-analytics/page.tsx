"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton
} from "@mui/material";
import {
    Security,
    Warning,
    CheckCircle,
    Error,
    TrendingUp,
    TrendingDown,
    Computer,
    Phone,
    Public,
    Close,
    Refresh,
    Download
} from "@mui/icons-material";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from "chart.js";
import { Axios } from "../../../Utils/Axios";
import { signOut, useSession } from "../../../Lib/auth-client";

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

interface AnalyticsData {
    basic: {
        totalRequests: number;
        successfulRequests: number;
        successRate: number;
        botRequests: number;
        botRate: number;
        suspiciousRequests: number;
        threatRequests: number;
        avgProcessingTime: number;
        uniqueIpsCount: number;
    };
    geographic: Array<{
        _id: string;
        country: string;
        count: number;
        successRate: number;
    }>;
    browserPlatform: Array<{
        _id: { browser: string; platform: string };
        count: number;
        successRate: number;
        botRate: number;
    }>;
    threats: {
        totalRequests: number;
        botDetected: number;
        suspiciousFingerprints: number;
        threatsDetected: number;
        vpnRequests: number;
        proxyRequests: number;
        torRequests: number;
        avgRiskScore: number;
    };
    hourly: Array<{
        _id: number;
        count: number;
        successCount: number;
        botCount: number;
    }>;
}

const TraceAnalyticsDashboard: React.FC = () => {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState("24h");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedDetail, setSelectedDetail] = useState<any>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const { data: session, isPending } = useSession();

    // Check admin status and refresh session if needed
    const checkAdminStatus = async () => {
        try {
            const response = await fetch('/api/auth/session');
            const sessionData = await response.json();
            console.log('Current session:', sessionData);
            
            if (!sessionData.user?.isAdmin && sessionData.user) {
                alert('Your admin status has been updated. Please sign out and sign back in to refresh your session.');
            }
        } catch (error) {
            console.error('Failed to check session:', error);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        window.location.href = '/auth/signin';
    };

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);

        try {
            let params = new URLSearchParams();
            params.append("type", "comprehensive");

            if (dateRange === "custom" && startDate && endDate) {
                params.append("startDate", startDate);
                params.append("endDate", endDate);
            } else {
                // Calculate date range
                const end = new Date();
                const start = new Date();
                
                switch (dateRange) {
                    case "1h":
                        start.setHours(start.getHours() - 1);
                        break;
                    case "24h":
                        start.setDate(start.getDate() - 1);
                        break;
                    case "7d":
                        start.setDate(start.getDate() - 7);
                        break;
                    case "30d":
                        start.setDate(start.getDate() - 30);
                        break;
                }
                
                params.append("startDate", start.toISOString());
                params.append("endDate", end.toISOString());
            }

            const response = await Axios.get(`/api/admin/trace-analytics?${params}`);
            
            if (response.data.Status === 1) {
                setAnalyticsData(response.data.Data.data);
            } else {
                setError(response.data.Message);
            }
        } catch (err: any) {
            setError(err.response?.data?.Message || "Failed to fetch analytics");
        }

        setLoading(false);
    };

    useEffect(() => {
        const user = session?.user as any;
        if (user && !user.isAdmin) {
            checkAdminStatus();
        }
    }, [session]);

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange, startDate, endDate]);

    const getDateRangeText = () => {
        switch (dateRange) {
            case "1h": return "Last Hour";
            case "24h": return "Last 24 Hours";
            case "7d": return "Last 7 Days";
            case "30d": return "Last 30 Days";
            case "custom": return "Custom Range";
            default: return "Last 24 Hours";
        }
    };

    // Chart configurations
    const hourlyChartData = {
        labels: analyticsData?.hourly.map(h => `${h._id}:00`) || [],
        datasets: [
            {
                label: "Total Requests",
                data: analyticsData?.hourly.map(h => h.count) || [],
                borderColor: "rgb(75, 192, 192)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                tension: 0.1
            },
            {
                label: "Bot Requests",
                data: analyticsData?.hourly.map(h => h.botCount) || [],
                borderColor: "rgb(255, 99, 132)",
                backgroundColor: "rgba(255, 99, 132, 0.2)",
                tension: 0.1
            }
        ]
    };

    const geographicChartData = {
        labels: analyticsData?.geographic.slice(0, 10).map(g => g.country) || [],
        datasets: [{
            data: analyticsData?.geographic.slice(0, 10).map(g => g.count) || [],
            backgroundColor: [
                "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
                "#FF9F40", "#FF6384", "#C9CBCF", "#4BC0C0", "#FF6384"
            ]
        }]
    };

    const browserPlatformChartData = {
        labels: analyticsData?.browserPlatform.slice(0, 8).map(bp => 
            `${bp._id.browser} (${bp._id.platform})`
        ) || [],
        datasets: [{
            label: "Requests",
            data: analyticsData?.browserPlatform.slice(0, 8).map(bp => bp.count) || [],
            backgroundColor: "rgba(54, 162, 235, 0.6)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1
        }]
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                Trace Analytics Dashboard
            </Typography>

            {/* Admin Status Check */}
            {session && !(session?.user as any)?.isAdmin && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Typography>
                            Admin access required. Your admin role has been updated in the database. 
                            Please refresh your session to continue.
                        </Typography>
                        <Button 
                            variant="outlined" 
                            onClick={handleSignOut}
                            sx={{ ml: 2 }}
                        >
                            Sign Out & Refresh
                        </Button>
                    </Box>
                </Alert>
            )}

            {/* Controls */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth>
                                <InputLabel>Time Range</InputLabel>
                                <Select
                                    value={dateRange}
                                    label="Time Range"
                                    onChange={(e) => setDateRange(e.target.value)}
                                >
                                    <MenuItem value="1h">Last Hour</MenuItem>
                                    <MenuItem value="24h">Last 24 Hours</MenuItem>
                                    <MenuItem value="7d">Last 7 Days</MenuItem>
                                    <MenuItem value="30d">Last 30 Days</MenuItem>
                                    <MenuItem value="custom">Custom Range</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {dateRange === "custom" && (
                            <>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <TextField
                                        fullWidth
                                        label="Start Date"
                                        type="datetime-local"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <TextField
                                        fullWidth
                                        label="End Date"
                                        type="datetime-local"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                            </>
                        )}

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Button
                                variant="contained"
                                onClick={fetchAnalytics}
                                disabled={loading}
                                startIcon={<Refresh />}
                                fullWidth
                            >
                                Refresh
                            </Button>
                        </Grid>
                    </Grid>

                    <Typography variant="subtitle2" sx={{ mt: 2, color: "text.secondary" }}>
                        Showing data for: {getDateRangeText()}
                    </Typography>
                </CardContent>
            </Card>

            {loading && (
                <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
                    <CircularProgress />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {analyticsData && (
                <>
                    {/* Key Metrics */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                        <TrendingUp color="primary" sx={{ mr: 1 }} />
                                        <Typography variant="h6">Total Requests</Typography>
                                    </Box>
                                    <Typography variant="h4">
                                        {analyticsData.basic?.totalRequests || 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {analyticsData.basic?.uniqueIpsCount || 0} unique IPs
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                        <CheckCircle color="success" sx={{ mr: 1 }} />
                                        <Typography variant="h6">Success Rate</Typography>
                                    </Box>
                                    <Typography variant="h4">
                                        {(analyticsData.basic?.successRate || 0).toFixed(1)}%
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {analyticsData.basic?.successfulRequests || 0} successful
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                        <Warning color="warning" sx={{ mr: 1 }} />
                                        <Typography variant="h6">Bot Detection</Typography>
                                    </Box>
                                    <Typography variant="h4">
                                        {(analyticsData.basic?.botRate || 0).toFixed(1)}%
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {analyticsData.basic?.botRequests || 0} bots detected
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                        <Security color="error" sx={{ mr: 1 }} />
                                        <Typography variant="h6">Threats</Typography>
                                    </Box>
                                    <Typography variant="h4">
                                        {analyticsData.threats?.threatsDetected || 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Avg risk: {(analyticsData.threats?.avgRiskScore || 0).toFixed(1)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Charts */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        {/* Hourly Distribution */}
                        <Grid size={{ xs: 12, md: 8 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Hourly Request Distribution
                                    </Typography>
                                    <Box sx={{ height: 300 }}>
                                        <Line 
                                            data={hourlyChartData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: { position: "top" }
                                                }
                                            }}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Geographic Distribution */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Top Countries
                                    </Typography>
                                    <Box sx={{ height: 300 }}>
                                        <Doughnut 
                                            data={geographicChartData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: { position: "bottom" }
                                                }
                                            }}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Browser/Platform Stats */}
                        <Grid size={{ xs: 12 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Browser & Platform Distribution
                                    </Typography>
                                    <Box sx={{ height: 300 }}>
                                        <Bar 
                                            data={browserPlatformChartData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: { display: false }
                                                },
                                                scales: {
                                                    x: {
                                                        ticks: {
                                                            maxRotation: 45
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Threat Analysis */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Security Threat Analysis
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h4" color="error">
                                            {analyticsData.threats?.botDetected || 0}
                                        </Typography>
                                        <Typography variant="body2">Bots Detected</Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h4" color="warning.main">
                                            {analyticsData.threats?.vpnRequests || 0}
                                        </Typography>
                                        <Typography variant="body2">VPN Requests</Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h4" color="warning.main">
                                            {analyticsData.threats?.proxyRequests || 0}
                                        </Typography>
                                        <Typography variant="body2">Proxy Requests</Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h4" color="error">
                                            {analyticsData.threats?.torRequests || 0}
                                        </Typography>
                                        <Typography variant="body2">Tor Requests</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Geographic Details Table */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Geographic Distribution Details
                            </Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Country</TableCell>
                                            <TableCell align="right">Requests</TableCell>
                                            <TableCell align="right">Success Rate</TableCell>
                                            <TableCell align="right">Percentage</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {analyticsData.geographic.slice(0, 10).map((geo, index) => (
                                            <TableRow key={geo._id}>
                                                <TableCell>
                                                    <Box sx={{ display: "flex", alignItems: "center" }}>
                                                        <Typography variant="body2" sx={{ mr: 1 }}>
                                                            {geo._id}
                                                        </Typography>
                                                        {geo.country}
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right">{geo.count}</TableCell>
                                                <TableCell align="right">
                                                    <Chip 
                                                        label={`${(geo.successRate * 100).toFixed(1)}%`}
                                                        color={geo.successRate > 0.8 ? "success" : "warning"}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Box sx={{ display: "flex", alignItems: "center" }}>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={(geo.count / (analyticsData.basic?.totalRequests || 1)) * 100}
                                                            sx={{ width: 60, mr: 1 }}
                                                        />
                                                        {((geo.count / (analyticsData.basic?.totalRequests || 1)) * 100).toFixed(1)}%
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </>
            )}
        </Box>
    );
};

export default TraceAnalyticsDashboard;
