"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Pagination,
    Tooltip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    CircularProgress,
    Alert,
    Box as MuiBox
} from "@mui/material";
import {
    Visibility,
    FilterList,
    Search,
    Warning,
    Security,
    CheckCircle,
    Error,
    Computer,
    Phone,
    Public,
    Close,
    Refresh
} from "@mui/icons-material";
import { Axios } from "../../../Utils/Axios";
import { format } from "date-fns";

interface TraceReport {
    _id: string;
    requestId: string;
    timestamp: string;
    ip: string;
    origin: string;
    browser: string;
    platform: string;
    botDetection: {
        isBot: boolean;
        reason?: string;
        category?: string;
        confidence: number;
    };
    fingerprint: {
        suspicious: boolean;
    };
    validation: {
        threatDetected: boolean;
    };
    result: {
        status: number;
        statusCode: string;
        statusNumber: number;
        message: string;
    };
    performance: {
        processingTime: number;
    };
    geolocation?: {
        country: string;
        countryCode: string;
    };
    session?: {
        isAuthenticated: boolean;
        userId?: string;
    };
    riskScore: number;
}

interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

const TraceReportsPage: React.FC = () => {
    const [reports, setReports] = useState<TraceReport[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    
    // Filters
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [sortBy, setSortBy] = useState("timestamp");
    const [sortOrder, setSortOrder] = useState("desc");
    const [status, setStatus] = useState("all");
    const [isBot, setIsBot] = useState("all");
    const [ipFilter, setIpFilter] = useState("");
    const [browserFilter, setBrowserFilter] = useState("");
    const [platformFilter, setPlatformFilter] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    
    // Detail dialog
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);

    const fetchReports = async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            params.append("page", page.toString());
            params.append("limit", limit.toString());
            params.append("sortBy", sortBy);
            params.append("sortOrder", sortOrder);
            
            if (status !== "all") params.append("status", status);
            if (isBot !== "all") params.append("isBot", isBot);
            if (ipFilter) params.append("ip", ipFilter);
            if (browserFilter) params.append("browser", browserFilter);
            if (platformFilter) params.append("platform", platformFilter);
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);

            const response = await Axios.get(`/api/admin/trace-reports?${params}`);
            
            if (response.data.Status === 1) {
                setReports(response.data.Data.reports);
                setPagination(response.data.Data.pagination);
            } else {
                setError(response.data.Message);
            }
        } catch (err: any) {
            setError(err.response?.data?.Message || "Failed to fetch reports");
        }

        setLoading(false);
    };

    const fetchReportDetail = async (reportId: string) => {
        setDetailLoading(true);
        try {
            const response = await Axios.get(`/api/admin/trace-reports/${reportId}`);
            
            if (response.data.Status === 1) {
                setSelectedReport(response.data.Data);
            } else {
                setError(response.data.Message);
            }
        } catch (err: any) {
            setError(err.response?.data?.Message || "Failed to fetch report detail");
        }
        setDetailLoading(false);
    };

    useEffect(() => {
        fetchReports();
    }, [page, limit, sortBy, sortOrder, status, isBot]);

    const handleViewDetail = (report: TraceReport) => {
        fetchReportDetail(report.requestId);
        setDetailDialogOpen(true);
    };

    const handleApplyFilters = () => {
        setPage(1);
        fetchReports();
    };

    const handleClearFilters = () => {
        setIpFilter("");
        setBrowserFilter("");
        setPlatformFilter("");
        setStartDate("");
        setEndDate("");
        setStatus("all");
        setIsBot("all");
        setPage(1);
        fetchReports();
    };

    const getRiskLevelColor = (score: number) => {
        if (score >= 80) return "error";
        if (score >= 60) return "warning";
        if (score >= 40) return "info";
        return "success";
    };

    const getRiskLevelText = (score: number) => {
        if (score >= 80) return "Critical";
        if (score >= 60) return "High";
        if (score >= 40) return "Medium";
        return "Low";
    };

    const getStatusIcon = (result: TraceReport["result"]) => {
        if (result.status === 1) {
            return <CheckCircle color="success" />;
        }
        return <Error color="error" />;
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Trace Reports
            </Typography>

            {/* Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Filters
                    </Typography>
                    
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={status}
                                    label="Status"
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <MenuItem value="all">All</MenuItem>
                                    <MenuItem value="success">Success</MenuItem>
                                    <MenuItem value="failed">Failed</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Bot Status</InputLabel>
                                <Select
                                    value={isBot}
                                    label="Bot Status"
                                    onChange={(e) => setIsBot(e.target.value)}
                                >
                                    <MenuItem value="all">All</MenuItem>
                                    <MenuItem value="true">Bots Only</MenuItem>
                                    <MenuItem value="false">No Bots</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="IP Address"
                                value={ipFilter}
                                onChange={(e) => setIpFilter(e.target.value)}
                                placeholder="Search IP..."
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Browser"
                                value={browserFilter}
                                onChange={(e) => setBrowserFilter(e.target.value)}
                                placeholder="Search browser..."
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Platform"
                                value={platformFilter}
                                onChange={(e) => setPlatformFilter(e.target.value)}
                                placeholder="Search platform..."
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Limit</InputLabel>
                                <Select
                                    value={limit}
                                    label="Limit"
                                    onChange={(e) => setLimit(Number(e.target.value))}
                                >
                                    <MenuItem value={10}>10</MenuItem>
                                    <MenuItem value={25}>25</MenuItem>
                                    <MenuItem value={50}>50</MenuItem>
                                    <MenuItem value={100}>100</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <TextField
                                fullWidth
                                size="small"
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
                                size="small"
                                label="End Date"
                                type="datetime-local"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Button
                                variant="contained"
                                onClick={handleApplyFilters}
                                disabled={loading}
                                startIcon={<Search />}
                                fullWidth
                            >
                                Apply Filters
                            </Button>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Button
                                variant="outlined"
                                onClick={handleClearFilters}
                                disabled={loading}
                                startIcon={<Refresh />}
                                fullWidth
                            >
                                Clear Filters
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Reports Table */}
            <Card>
                <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="h6">
                            Reports {pagination && `(${pagination.totalCount} total)`}
                        </Typography>
                        
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Sort By</InputLabel>
                            <Select
                                value={sortBy}
                                label="Sort By"
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <MenuItem value="timestamp">Timestamp</MenuItem>
                                <MenuItem value="riskScore">Risk Score</MenuItem>
                                <MenuItem value="performance.processingTime">Processing Time</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <>
                            <TableContainer component={Paper} variant="outlined">
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Timestamp</TableCell>
                                            <TableCell>IP Address</TableCell>
                                            <TableCell>Browser/Platform</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Risk Score</TableCell>
                                            <TableCell>Bot Detection</TableCell>
                                            <TableCell>Location</TableCell>
                                            <TableCell>Processing Time</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {reports.map((report) => (
                                            <TableRow key={report._id}>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {format(new Date(report.timestamp), "MMM dd, yyyy")}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {format(new Date(report.timestamp), "HH:mm:ss")}
                                                    </Typography>
                                                </TableCell>
                                                
                                                <TableCell>
                                                    <Typography variant="body2" fontFamily="monospace">
                                                        {report.ip}
                                                    </Typography>
                                                    {report.session?.isAuthenticated && (
                                                        <Chip 
                                                            label="Auth" 
                                                            size="small" 
                                                            color="primary" 
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </TableCell>
                                                
                                                <TableCell>
                                                    <Box sx={{ display: "flex", alignItems: "center" }}>
                                                        {report.platform.toLowerCase().includes("mobile") ? 
                                                            <Phone fontSize="small" sx={{ mr: 1 }} /> : 
                                                            <Computer fontSize="small" sx={{ mr: 1 }} />
                                                        }
                                                        <Box>
                                                            <Typography variant="body2">
                                                                {report.browser}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {report.platform}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                
                                                <TableCell>
                                                    <Box sx={{ display: "flex", alignItems: "center" }}>
                                                        {getStatusIcon(report.result)}
                                                        <Box sx={{ ml: 1 }}>
                                                            <Typography variant="body2">
                                                                {report.result.status === 1 ? "Success" : "Failed"}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {report.result.statusCode}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                
                                                <TableCell>
                                                    <Chip
                                                        label={`${report.riskScore}% ${getRiskLevelText(report.riskScore)}`}
                                                        color={getRiskLevelColor(report.riskScore)}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                
                                                <TableCell>
                                                    {report.botDetection.isBot ? (
                                                        <Chip
                                                            label={`Bot (${report.botDetection.confidence}%)`}
                                                            color="error"
                                                            size="small"
                                                            icon={<Warning />}
                                                        />
                                                    ) : (
                                                        <Chip
                                                            label="Human"
                                                            color="success"
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </TableCell>
                                                
                                                <TableCell>
                                                    {report.geolocation ? (
                                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                                            <Public fontSize="small" sx={{ mr: 1 }} />
                                                            <Typography variant="body2">
                                                                {report.geolocation.countryCode}
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">
                                                            Unknown
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {report.performance.processingTime}ms
                                                    </Typography>
                                                </TableCell>
                                                
                                                <TableCell>
                                                    <Tooltip title="View Details">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleViewDetail(report)}
                                                        >
                                                            <Visibility />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Pagination */}
                            {pagination && pagination.totalPages > 1 && (
                                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                                    <Pagination
                                        count={pagination.totalPages}
                                        page={pagination.currentPage}
                                        onChange={(_, value) => setPage(value)}
                                        color="primary"
                                    />
                                </Box>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog
                open={detailDialogOpen}
                onClose={() => setDetailDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="h6">Trace Report Details</Typography>
                        <IconButton onClick={() => setDetailDialogOpen(false)}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                
                <DialogContent>
                    {detailLoading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : selectedReport ? (
                        <Box sx={{ mt: 2 }}>
                            {/* Report details would go here */}
                            <Typography variant="h6" gutterBottom>
                                Request ID: {selectedReport.report?.requestId}
                            </Typography>
                            
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Basic Information
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>IP:</strong> {selectedReport.report?.ip}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>User Agent:</strong> {selectedReport.report?.userAgent}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Origin:</strong> {selectedReport.report?.origin}
                                    </Typography>
                                </Grid>
                                
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Risk Assessment
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Risk Score:</strong> {selectedReport.report?.riskScore}%
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Risk Level:</strong> {selectedReport.summary?.riskLevel}
                                    </Typography>
                                </Grid>
                            </Grid>

                            {selectedReport.summary?.recommendations && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Recommendations
                                    </Typography>
                                    {selectedReport.summary.recommendations.map((rec: string, index: number) => (
                                        <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                                            • {rec}
                                        </Typography>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    ) : null}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default TraceReportsPage;
