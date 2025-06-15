"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Box,
	Paper,
	Typography,
	TextField,
	Button,
	Chip,
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
	Card,
	CardContent,
	Grid,
	GridLegacy as GridLegacy,
	Divider,
	Avatar,
	Tooltip,
	Badge,
	Stack,
	AppBar,
	Toolbar,
} from "@mui/material";
import {
	DataGridPremium,
	GridColDef,
	GridRenderCellParams,
	GridActionsCellItem,
	GridRowParams,
	GridToolbar,
	// GridValueGetterParams,
	GridRowId,
} from "@mui/x-data-grid-premium";
import {
	Search,
	Edit,
	Delete,
	Reply,
	Security,
	Visibility,
	VisibilityOff,
	Refresh,
	FilterList,
	Analytics,
	TrendingUp,
	Schedule,
	CheckCircle,
	Error,
	Warning,
	Info,
	Person,
	Support,
	Business,
	Email,
	CalendarToday,
	AccessTime,
	Star,
	Send,
	ResetTv as Priority,
	Dashboard,
	ExitToApp,
	Settings,
	Notifications,
	MoreVert,
	Chat,
} from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Axios } from "@Utils/Axios";
import {
	LicenseInfo,
	generateLicense,
	muiXTelemetrySettings,
} from "@mui/x-license";

muiXTelemetrySettings.disableTelemetry();
LicenseInfo.setLicenseKey(
	generateLicense({
		expiryDate: new Date("2025-12-31"),
		orderNumber: "MUI-123",
		planScope: "premium",
		licenseModel: "subscription",
		planVersion: "initial",
	})
);

interface Ticket {
	_id: string;
	id: string;
	name: string;
	email: string;
	subject: string;
	message: string;
	projectType: string;
	status: "open" | "in-progress" | "resolved" | "closed";
	priority: "low" | "medium" | "high";
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
	showViewResponsesDialog: boolean;
	responseText: string;
	stats: {
		total: number;
		open: number;
		inProgress: number;
		resolved: number;
		closed: number;
		highPriority: number;
	};
}

// GitHub-style theme with enhanced design
const githubTheme: any = createTheme({
	palette: {
		mode: "light",
		primary: {
			main: "#0969da",
			light: "#54aeff",
			dark: "#0550ae",
		},
		secondary: {
			main: "#8250df",
			light: "#a475f9",
			dark: "#6f42c1",
		},
		success: {
			main: "#1a7f37",
			light: "#2da44e",
			dark: "#0f5132",
		},
		warning: {
			main: "#fb8500",
			light: "#ffb700",
			dark: "#e85d00",
		},
		error: {
			main: "#da3633",
			light: "#ff6b6b",
			dark: "#b91c1c",
		},
		background: {
			default: "#f6f8fa",
			paper: "#ffffff",
		},
		text: {
			primary: "#24292f",
			secondary: "#656d76",
		},
		divider: "#d1d9e0",
	},
	shape: {
		borderRadius: 8,
	},
	typography: {
		fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
		h4: {
			fontWeight: 700,
			fontSize: "1.5rem",
		},
		h5: {
			fontWeight: 600,
			fontSize: "1.25rem",
		},
		h6: {
			fontWeight: 600,
			fontSize: "1.125rem",
		},
		body1: {
			fontSize: "0.875rem",
		},
		body2: {
			fontSize: "0.75rem",
		},
	},
	components: {
		MuiDataGrid: {
			styleOverrides: {
				root: {
					border: "1px solid #d1d9e0",
					borderRadius: "12px",
					backgroundColor: "#ffffff",
					"& .MuiDataGrid-cell": {
						borderColor: "#f6f8fa",
						fontSize: "0.875rem",
						display: "flex",
						alignItems: "center",
						minHeight: "52px",
						padding: "8px 12px",
					},
					"& .MuiDataGrid-columnHeaders": {
						backgroundColor: "#f6f8fa",
						borderBottom: "1px solid #d1d9e0",
						borderRadius: "12px 12px 0 0",
						minHeight: "56px",
						"& .MuiDataGrid-columnHeader": {
							fontWeight: 600,
							fontSize: "0.875rem",
							color: "#24292f",
							display: "flex",
							alignItems: "center",
							padding: "8px 12px",
						},
					},
					"& .MuiDataGrid-row": {
						minHeight: "52px",
						"&:hover": {
							backgroundColor: "#f6f8fa",
						},
						"&.Mui-selected": {
							backgroundColor: "#dbeafe",
							"&:hover": {
								backgroundColor: "#bfdbfe",
							},
						},
					},
					"& .MuiDataGrid-footerContainer": {
						borderTop: "1px solid #d1d9e0",
						backgroundColor: "#f6f8fa",
						minHeight: "48px",
					},
				},
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					boxShadow:
						"0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.05)",
					border: "1px solid #d1d9e0",
					borderRadius: "12px",
				},
			},
		},
		MuiCard: {
			styleOverrides: {
				root: {
					boxShadow:
						"0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.05)",
					border: "1px solid #d1d9e0",
					borderRadius: "12px",
					transition: "all 0.2s ease-in-out",
					"&:hover": {
						boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
						transform: "translateY(-2px)",
					},
				},
			},
		},
		MuiChip: {
			styleOverrides: {
				root: {
					fontWeight: 500,
					fontSize: "0.75rem",
					borderRadius: "6px",
				},
			},
		},
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: "8px",
					textTransform: "none",
					fontWeight: 500,
				},
			},
		},
		MuiTextField: {
			styleOverrides: {
				root: {
					"& .MuiOutlinedInput-root": {
						borderRadius: "8px",
					},
				},
			},
		},
	},
} as any);

export default function AdminTicketsPortal() {
	const [adminState, setAdminState] = useState<AdminState>({
		isAuthenticated: false,
		token: "",
		signature: "",
		showPassword: false,
		authError: "",
		tryCount: 0,
		isBlocked: false,
		blockExpiry: 0,
	});
	const [ticketState, setTicketState] = useState<TicketState>({
		tickets: [],
		loading: false,
		error: "",
		selectedTicket: null,
		showResponseDialog: false,
		showViewResponsesDialog: false,
		responseText: "",
		stats: {
			total: 0,
			open: 0,
			inProgress: 0,
			resolved: 0,
			closed: 0,
			highPriority: 0,
		},
	});

	useEffect(() => {
		checkIfBlocked();
	}, []);

	useEffect(() => {
		if (adminState.isAuthenticated) {
			loadTickets();
		}
	}, [adminState.isAuthenticated]);

	const checkIfBlocked = () => {
		const isBlocked = localStorage.getItem("adminAccessBlocked") === "true";
		const blockedUntil = localStorage.getItem("adminAccessBlockExpiry");
		const tryCount = parseInt(
			localStorage.getItem("adminAccessTryCount") || "0"
		);

		if (isBlocked && blockedUntil) {
			const blockExpiry = parseInt(blockedUntil);
			if (Date.now() < blockExpiry) {
				setAdminState((prev) => ({
					...prev,
					isBlocked: true,
					blockExpiry,
					tryCount,
					authError:
						"Access blocked for 24 hours due to too many failed attempts.",
				}));
				return;
			} else {
				localStorage.removeItem("adminAccessBlocked");
				localStorage.removeItem("adminAccessBlockExpiry");
				localStorage.removeItem("adminAccessTryCount");
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
				signature: adminState.signature,
			});

			setAdminState((prev) => ({
				...prev,
				isAuthenticated: true,
				token: response.data.Data,
				authError: "",
				tryCount: 0,
			}));

			localStorage.removeItem("adminAccessBlocked");
			localStorage.removeItem("adminAccessBlockExpiry");
			localStorage.removeItem("adminAccessTryCount");
		} catch (error: any) {
			const newTryCount = adminState.tryCount + 1;
			setAdminState((prev) => ({
				...prev,
				authError:
					error?.response?.data?.Message || "Authentication failed",
				tryCount: newTryCount,
			}));

			localStorage.setItem("adminAccessTryCount", newTryCount.toString());

			if (newTryCount >= 3) {
				blockUser();
			}
		}
	};

	const blockUser = () => {
		const blockExpiry = Date.now() + 24 * 60 * 60 * 1000;

		localStorage.setItem("adminAccessBlocked", "true");
		localStorage.setItem("adminAccessBlockExpiry", blockExpiry.toString());
		localStorage.setItem("adminAccessTryCount", "3");

		setAdminState((prev) => ({
			...prev,
			isBlocked: true,
			blockExpiry,
			authError:
				"Maximum attempts exceeded. Access blocked for 24 hours.",
		}));
	};

	const loadTickets = async () => {
		setTicketState((prev) => ({ ...prev, loading: true, error: "" }));

		try {
			const response = await Axios.get("/api/admin/tickets", {
				headers: {
					Authorization: `Bearer ${adminState.token}`,
				},
			});

			const tickets = response.data.tickets || [];

			// Calculate stats
			const stats = {
				total: tickets.length,
				open: tickets.filter((t: Ticket) => t.status === "open").length,
				inProgress: tickets.filter(
					(t: Ticket) => t.status === "in-progress"
				).length,
				resolved: tickets.filter((t: Ticket) => t.status === "resolved")
					.length,
				closed: tickets.filter((t: Ticket) => t.status === "closed")
					.length,
				highPriority: tickets.filter(
					(t: Ticket) => t.priority === "high"
				).length,
			};

			setTicketState((prev) => ({
				...prev,
				tickets,
				stats,
				loading: false,
			}));
		} catch (error: any) {
			setTicketState((prev) => ({
				...prev,
				error: error?.response?.data?.error || "Failed to load tickets",
				loading: false,
			}));
		}
	};

	const updateTicketStatus = async (ticketId: string, status: string) => {
		try {
			await Axios.patch(
				"/api/admin/tickets",
				{
					ticketId,
					status,
				},
				{
					headers: {
						Authorization: `Bearer ${adminState.token}`,
					},
				}
			);

			loadTickets();
		} catch (error: any) {
			setTicketState((prev) => ({
				...prev,
				error:
					error?.response?.data?.error || "Failed to update ticket",
			}));
		}
	};

	const updateTicketPriority = async (ticketId: string, priority: string) => {
		try {
			await Axios.patch(
				"/api/admin/tickets",
				{
					ticketId,
					priority,
				},
				{
					headers: {
						Authorization: `Bearer ${adminState.token}`,
					},
				}
			);

			loadTickets();
		} catch (error: any) {
			setTicketState((prev) => ({
				...prev,
				error:
					error?.response?.data?.error || "Failed to update priority",
			}));
		}
	};

	const addAdminResponse = async () => {
		if (!ticketState.selectedTicket || !ticketState.responseText.trim())
			return;

		try {
			await Axios.patch(
				"/api/admin/tickets",
				{
					ticketId: ticketState.selectedTicket.id,
					response: ticketState.responseText,
				},
				{
					headers: {
						Authorization: `Bearer ${adminState.token}`,
					},
				}
			);
			setTicketState((prev) => ({
				...prev,
				showResponseDialog: false,
				showViewResponsesDialog: false,
				responseText: "",
				selectedTicket: null,
			}));

			loadTickets();
		} catch (error: any) {
			setTicketState((prev) => ({
				...prev,
				error: error?.response?.data?.error || "Failed to add response",
			}));
		}
	};

	const deleteTicket = async (ticketId: string) => {
		if (
			!confirm(
				"Are you sure you want to delete this ticket? This action cannot be undone."
			)
		) {
			return;
		}

		try {
			await Axios.delete(`/api/admin/tickets?id=${ticketId}`, {
				headers: {
					Authorization: `Bearer ${adminState.token}`,
				},
			});

			loadTickets();
		} catch (error: any) {
			setTicketState((prev) => ({
				...prev,
				error:
					error?.response?.data?.error || "Failed to delete ticket",
			}));
		}
	};

	const logout = () => {
		setAdminState({
			isAuthenticated: false,
			token: "",
			signature: "",
			showPassword: false,
			authError: "",
			tryCount: 0,
			isBlocked: false,
			blockExpiry: 0,
		});
	};

	// DataGrid columns configuration
	const columns: GridColDef[] = [
		{
			field: "id",
			headerName: "Ticket ID",
			width: 180,
			renderCell: (params: GridRenderCellParams) => (
				<Box
					sx={{
						fontFamily: "monospace",
						fontSize: "0.75rem",
						fontWeight: 600,
						color: "primary.main",
						display: "flex",
						alignItems: "center",
						width: "100%",
					}}
				>
					{params.value}
				</Box>
			),
		},
		{
			field: "name",
			headerName: "Customer",
			width: 200,
			renderCell: (params: any) => (
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						width: "100%",
						minHeight: "36px",
					}}
				>
					<Typography
						variant="body2"
						sx={{
							fontWeight: 600,
							lineHeight: 1.2,
							fontSize: "0.875rem",
						}}
					>
						{params.row.name}
					</Typography>
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{
							lineHeight: 1.2,
							fontSize: "0.75rem",
						}}
					>
						{params.row.email}
					</Typography>
				</Box>
			),
		},
		{
			field: "subject",
			headerName: "Subject",
			width: 280,
			renderCell: (params: GridRenderCellParams) => (
				<Tooltip
					title={params.value}
					arrow
				>
					<Typography
						variant="body2"
						sx={{
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
							fontWeight: 500,
							width: "100%",
							lineHeight: 1.4,
						}}
					>
						{params.value}
					</Typography>
				</Tooltip>
			),
		},
		{
			field: "projectType",
			headerName: "Type",
			width: 150,
			renderCell: (params: GridRenderCellParams) => {
				const getTypeConfig = (type: string) => {
					switch (type) {
						case "staff-engineer":
							return {
								icon: <Business sx={{ fontSize: 14 }} />,
								color: "primary",
								label: "Staff Engineer",
							};
						case "consulting":
							return {
								icon: <Security sx={{ fontSize: 14 }} />,
								color: "secondary",
								label: "Consulting",
							};
						case "collaboration":
							return {
								icon: <Star sx={{ fontSize: 14 }} />,
								color: "warning",
								label: "Collaboration",
							};
						case "freelance":
							return {
								icon: <Person sx={{ fontSize: 14 }} />,
								color: "success",
								label: "Freelance",
							};
						default:
							return {
								icon: <Info sx={{ fontSize: 14 }} />,
								color: "default",
								label: type,
							};
					}
				};

				const config = getTypeConfig(params.value);
				return (
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							width: "100%",
						}}
					>
						<Chip
							icon={config.icon}
							label={config.label}
							size="small"
							color={config.color as any}
							variant="outlined"
							sx={{
								textTransform: "capitalize",
								fontWeight: 500,
								fontSize: "0.7rem",
								height: "24px",
							}}
						/>
					</Box>
				);
			},
		},
		{
			field: "status",
			headerName: "Status",
			width: 150,
			renderCell: (params: GridRenderCellParams) => {
				return (
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							width: "100%",
						}}
					>
						<FormControl
							size="small"
							sx={{ minWidth: 130 }}
						>
							<Select
								value={params.value}
								onChange={(e) =>
									updateTicketStatus(
										params.row.id,
										e.target.value
									)
								}
								size="small"
								sx={{
									fontSize: "0.75rem",
									height: "32px",
									"& .MuiSelect-select": {
										display: "flex",
										alignItems: "center",
										gap: 1,
										paddingTop: "6px",
										paddingBottom: "6px",
									},
								}}
							>
								<MenuItem value="open">
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
										}}
									>
										<Info
											sx={{
												fontSize: 14,
												color: "error.main",
											}}
										/>
										<span>Open</span>
									</Box>
								</MenuItem>
								<MenuItem value="in-progress">
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
										}}
									>
										<Schedule
											sx={{
												fontSize: 14,
												color: "warning.main",
											}}
										/>
										<span>In Progress</span>
									</Box>
								</MenuItem>
								<MenuItem value="resolved">
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
										}}
									>
										<CheckCircle
											sx={{
												fontSize: 14,
												color: "success.main",
											}}
										/>
										<span>Resolved</span>
									</Box>
								</MenuItem>
								<MenuItem value="closed">
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
										}}
									>
										<CheckCircle
											sx={{
												fontSize: 14,
												color: "grey.500",
											}}
										/>
										<span>Closed</span>
									</Box>
								</MenuItem>
							</Select>
						</FormControl>
					</Box>
				);
			},
		},
		{
			field: "priority",
			headerName: "Priority",
			width: 130,
			renderCell: (params: GridRenderCellParams) => {
				return (
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							width: "100%",
						}}
					>
						<FormControl
							size="small"
							sx={{ minWidth: 110 }}
						>
							<Select
								value={params.value}
								onChange={(e) =>
									updateTicketPriority(
										params.row.id,
										e.target.value
									)
								}
								size="small"
								sx={{
									fontSize: "0.75rem",
									height: "32px",
								}}
							>
								<MenuItem value="low">
									<Chip
										label="Low"
										color="success"
										size="small"
										sx={{ fontSize: "0.7rem" }}
									/>
								</MenuItem>
								<MenuItem value="medium">
									<Chip
										label="Medium"
										color="warning"
										size="small"
										sx={{ fontSize: "0.7rem" }}
									/>
								</MenuItem>
								<MenuItem value="high">
									<Chip
										label="High"
										color="error"
										size="small"
										sx={{ fontSize: "0.7rem" }}
									/>
								</MenuItem>
							</Select>
						</FormControl>
					</Box>
				);
			},
		},
		{
			field: "responses",
			headerName: "Responses",
			width: 100,
			align: "center",
			headerAlign: "center",
			renderCell: (params: any) => (
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						width: "100%",
						cursor:
							params.row.responses?.length > 0
								? "pointer"
								: "default",
					}}
					onClick={() => {
						if (params.row.responses?.length > 0) {
							setTicketState((prev) => ({
								...prev,
								selectedTicket: params.row as Ticket,
								showViewResponsesDialog: true,
							}));
						}
					}}
				>
					<Badge
						badgeContent={params.row.responses?.length || 0}
						color="primary"
						sx={{
							"& .MuiBadge-badge": {
								fontSize: "0.6rem",
								height: 16,
								minWidth: 16,
							},
						}}
					>
						<Reply
							sx={{
								fontSize: 16,
								color:
									params.row.responses?.length > 0
										? "primary.main"
										: "text.secondary",
								opacity:
									params.row.responses?.length > 0 ? 1 : 0.5,
							}}
						/>
					</Badge>
				</Box>
			),
		},
		{
			field: "createdAt",
			headerName: "Created",
			width: 120,
			renderCell: (params: any) => (
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						width: "100%",
					}}
				>
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{
							lineHeight: 1.4,
						}}
					>
						{new Date(params.row.createdAt).toLocaleDateString(
							"en-US",
							{
								month: "short",
								day: "numeric",
								year: "numeric",
							}
						)}
					</Typography>
				</Box>
			),
		},
		{
			field: "actions",
			type: "actions",
			headerName: "Actions",
			width: 120,
			getActions: (params: GridRowParams) => [
				<GridActionsCellItem
					key="reply"
					icon={
						<Reply sx={{ fontSize: 18, color: "primary.main" }} />
					}
					label="Add Response"
					onClick={() =>
						setTicketState((prev) => ({
							...prev,
							selectedTicket: params.row as Ticket,
							showResponseDialog: true,
						}))
					}
				/>,
				<GridActionsCellItem
					key="delete"
					icon={<Delete sx={{ fontSize: 18, color: "error.main" }} />}
					label="Delete Ticket"
					onClick={() => deleteTicket(params.row.id)}
					showInMenu
				/>,
			],
		},
	];

	// Authentication Screen
	if (!adminState.isAuthenticated) {
		return (
			<Box
				sx={{
					minHeight: "100vh",
					background:
						"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					p: 2,
				}}
			>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
				>
					<Paper
						elevation={10}
						sx={{
							p: 4,
							maxWidth: 420,
							width: "100%",
							borderRadius: 3,
							background: "rgba(255, 255, 255, 0.95)",
							backdropFilter: "blur(20px)",
							border: "1px solid rgba(255, 255, 255, 0.3)",
							boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
							"& .MuiTypography-root": {
								color: "#24292f !important",
							},
							"& .MuiTypography-h4": {
								color: "#0969da !important",
								fontWeight: "bold",
							},
							"& .MuiTypography-body1": {
								color: "#656d76 !important",
							},
							"& .MuiTypography-caption": {
								color: "#656d76 !important",
							},
						}}
					>
						<Box sx={{ textAlign: "center", mb: 4 }}>
							<motion.div
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{
									delay: 0.2,
									type: "spring",
									stiffness: 200,
								}}
							>
								<Security
									sx={{
										fontSize: 56,
										color: "#667eea",
										mb: 2,
									}}
								/>
							</motion.div>
							<Typography
								variant="h4"
								gutterBottom
								fontWeight="bold"
								sx={{ color: "#0969da" }}
							>
								Admin Portal
							</Typography>
							<Typography
								variant="body1"
								sx={{ color: "#656d76" }}
							>
								Secure Ticket Management System
							</Typography>
							<Typography
								variant="caption"
								sx={{
									display: "block",
									mt: 1,
									color: "#656d76",
								}}
							>
								Staff Engineer Level Access Control
							</Typography>
						</Box>
						<AnimatePresence>
							{adminState.authError && (
								<motion.div
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
								>
									<Alert
										severity="error"
										sx={{ mb: 3, borderRadius: 2 }}
									>
										{adminState.authError}
									</Alert>
								</motion.div>
							)}
						</AnimatePresence>
						{adminState.isBlocked && (
							<Alert
								severity="warning"
								sx={{ mb: 3, borderRadius: 2 }}
							>
								<Typography
									variant="body2"
									fontWeight={500}
								>
									Access Blocked
								</Typography>
								<Typography variant="caption">
									Until:
									{new Date(
										adminState.blockExpiry
									).toLocaleString()}
								</Typography>
							</Alert>
						)}
						<TextField
							fullWidth
							label="Admin Signature"
							type={adminState.showPassword ? "text" : "password"}
							value={adminState.signature}
							onChange={(e) =>
								setAdminState((prev) => ({
									...prev,
									signature: e.target.value,
								}))
							}
							disabled={adminState.isBlocked}
							sx={{
								mb: 3,
								"& .MuiInputLabel-root": {
									color: "#24292f",
									fontWeight: 500,
								},
								"& .MuiInputLabel-root.Mui-focused": {
									color: "#0969da",
								},
								"& .MuiOutlinedInput-root": {
									backgroundColor: "rgba(255, 255, 255, 0.9)",
									"& fieldset": {
										borderColor: "#d1d9e0",
										borderWidth: 2,
									},
									"&:hover fieldset": {
										borderColor: "#0969da",
									},
									"&.Mui-focused fieldset": {
										borderColor: "#0969da",
									},
									"& input": {
										color: "#24292f",
										fontWeight: 500,
									},
									"& input::placeholder": {
										color: "#656d76",
										opacity: 1,
									},
								},
							}}
							placeholder="Enter your secure admin signature"
							InputProps={{
								endAdornment: (
									<IconButton
										onClick={() =>
											setAdminState((prev) => ({
												...prev,
												showPassword:
													!prev.showPassword,
											}))
										}
										edge="end"
										sx={{
											color: "#656d76",
											"&:hover": {
												color: "#0969da",
												backgroundColor:
													"rgba(9, 105, 218, 0.1)",
											},
										}}
									>
										{adminState.showPassword ? (
											<VisibilityOff />
										) : (
											<Visibility />
										)}
									</IconButton>
								),
							}}
						/>
						<motion.div
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
						>
							<Button
								fullWidth
								variant="contained"
								onClick={handleAdminLogin}
								disabled={
									adminState.isBlocked ||
									!adminState.signature.trim()
								}
								sx={{
									py: 2,
									fontSize: "1rem",
									fontWeight: 600,
									color: "#ffffff",
									background:
										"linear-gradient(135deg, #0969da 0%, #8250df 100%)",
									boxShadow:
										"0 4px 15px rgba(9, 105, 218, 0.3)",
									border: "1px solid rgba(9, 105, 218, 0.2)",
									"&:hover": {
										background:
											"linear-gradient(135deg, #0550ae 0%, #6f42c1 100%)",
										boxShadow:
											"0 6px 20px rgba(9, 105, 218, 0.4)",
										transform: "translateY(-1px)",
									},
									"&:disabled": {
										background: "#d1d9e0",
										color: "#656d76",
										boxShadow: "none",
										border: "1px solid #d1d9e0",
									},
									"& .MuiSvgIcon-root": {
										color: "#ffffff",
									},
								}}
							>
								<Security sx={{ mr: 1 }} />
								Access Admin Portal
							</Button>
						</motion.div>
						<Box sx={{ mt: 3, textAlign: "center" }}>
							<Typography
								variant="caption"
								color="text.secondary"
							>
								Security Attempts: {adminState.tryCount}/3
							</Typography>
							<Typography
								variant="caption"
								color="error"
								sx={{ display: "block", mt: 0.5 }}
							>
								{adminState.tryCount >= 2 &&
									!adminState.isBlocked &&
									"Final attempt warning"}
							</Typography>
						</Box>
					</Paper>
				</motion.div>
			</Box>
		);
	}

	// Main Admin Dashboard
	return (
		<ThemeProvider theme={githubTheme}>
			<Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
				{/* Top App Bar */}
				<AppBar
					position="static"
					elevation={0}
					sx={{
						bgcolor: "background.paper",
						borderBottom: "1px solid",
						borderColor: "divider",
						color: "text.primary",
					}}
				>
					<Toolbar>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 2,
								flexGrow: 1,
							}}
						>
							<Security
								sx={{ fontSize: 28, color: "primary.main" }}
							/>
							<Box>
								<Typography
									variant="h6"
									fontWeight="bold"
								>
									Admin Portal
								</Typography>
								<Typography
									variant="caption"
									color="text.secondary"
								>
									Ticket Management System
								</Typography>
							</Box>
						</Box>

						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1,
							}}
						>
							<Chip
								icon={<Person sx={{ fontSize: 14 }} />}
								label="MeetBhingradiya"
								size="small"
								color="primary"
								variant="outlined"
							/>
							<IconButton
								onClick={logout}
								color="inherit"
							>
								<ExitToApp />
							</IconButton>
						</Box>
					</Toolbar>
				</AppBar>

				<Box sx={{ p: 3 }}>
					{/* Header Section */}
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
					>
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								mb: 3,
							}}
						>
							<Box>
								<Typography
									variant="h4"
									fontWeight="bold"
									color="text.primary"
									gutterBottom
								>
									Ticket Management
								</Typography>
								<Typography
									variant="body1"
									color="text.secondary"
								>
									Monitor and manage all support tickets with
									enterprise-grade tools
								</Typography>
							</Box>

							<Stack
								direction="row"
								spacing={2}
							>
								<motion.div
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
								>
									<Button
										variant="outlined"
										startIcon={<Refresh />}
										onClick={loadTickets}
										disabled={ticketState.loading}
										sx={{ borderRadius: 2 }}
									>
										{ticketState.loading ? (
											<CircularProgress size={16} />
										) : (
											"Refresh"
										)}
									</Button>
								</motion.div>
							</Stack>
						</Box>

						{/* Stats Dashboard */}
						<Grid
							container
							spacing={3}
							sx={{ mb: 4 }}
						>
							{[
								{
									title: "Total Tickets",
									value: ticketState.stats.total,
									icon: <Analytics sx={{ fontSize: 24 }} />,
									color: "primary.main",
									bgColor: "primary.main",
									change: "+12%",
									changeColor: "success.main",
								},
								{
									title: "Open",
									value: ticketState.stats.open,
									icon: <Info sx={{ fontSize: 24 }} />,
									color: "error.main",
									bgColor: "error.main",
									change: "-5%",
									changeColor: "success.main",
								},
								{
									title: "In Progress",
									value: ticketState.stats.inProgress,
									icon: <Schedule sx={{ fontSize: 24 }} />,
									color: "warning.main",
									bgColor: "warning.main",
									change: "+8%",
									changeColor: "error.main",
								},
								{
									title: "Resolved",
									value: ticketState.stats.resolved,
									icon: <CheckCircle sx={{ fontSize: 24 }} />,
									color: "success.main",
									bgColor: "success.main",
									change: "+23%",
									changeColor: "success.main",
								},
								{
									title: "High Priority",
									value: ticketState.stats.highPriority,
									icon: <Priority sx={{ fontSize: 24 }} />,
									color: "error.main",
									bgColor: "error.main",
									change: "-15%",
									changeColor: "success.main",
								},
							].map((stat, index) => (
								<GridLegacy
									item
									xs={12}
									sm={6}
									md={2.4}
									key={stat.title}
								>
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{
											duration: 0.6,
											delay: index * 0.1,
										}}
										whileHover={{ y: -4 }}
									>
										<Card
											sx={{
												height: "100%",
												position: "relative",
												overflow: "visible",
											}}
										>
											<CardContent
												sx={{
													textAlign: "center",
													py: 3,
												}}
											>
												<Box
													sx={{
														p: 2,
														borderRadius: 3,
														bgcolor: `${stat.bgColor}15`,
														display: "inline-flex",
														mb: 2,
														position: "relative",
													}}
												>
													{React.cloneElement(
														stat.icon,
														{
															sx: {
																fontSize: 24,
																color: stat.color,
															},
														}
													)}
													{stat.title ===
														"High Priority" &&
														ticketState.stats
															.highPriority >
															0 && (
															<Box
																sx={{
																	position:
																		"absolute",
																	top: -8,
																	right: -8,
																	width: 8,
																	height: 8,
																	bgcolor:
																		"error.main",
																	borderRadius:
																		"50%",
																	animation:
																		"pulse 2s infinite",
																}}
															/>
														)}
												</Box>
												<Typography
													variant="h4"
													fontWeight="bold"
													color="text.primary"
													sx={{ mb: 1 }}
												>
													{stat.value}
												</Typography>
												<Typography
													variant="body2"
													color="text.secondary"
													sx={{ mb: 1 }}
												>
													{stat.title}
												</Typography>
												<Typography
													variant="caption"
													sx={{
														color: stat.changeColor,
														fontWeight: 600,
														fontSize: "0.7rem",
													}}
												>
													{stat.change} from last week
												</Typography>
											</CardContent>
										</Card>
									</motion.div>
								</GridLegacy>
							))}
						</Grid>
					</motion.div>

					{/* Error Alert */}
					<AnimatePresence>
						{ticketState.error && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
							>
								<Alert
									severity="error"
									sx={{ mb: 3, borderRadius: 2 }}
									onClose={() =>
										setTicketState((prev) => ({
											...prev,
											error: "",
										}))
									}
								>
									{ticketState.error}
								</Alert>
							</motion.div>
						)}
					</AnimatePresence>

					{/* DataGrid */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.3 }}
					>
						<Paper
							elevation={0}
							sx={{ height: 650, width: "100%", p: 0 }}
						>
							<DataGridPremium
								rows={ticketState.tickets}
								columns={columns}
								loading={ticketState.loading}
								pagination
								pageSizeOptions={[10, 25, 50, 100]}
								initialState={{
									pagination: {
										paginationModel: { pageSize: 25 },
									},
								}}
								slots={{
									toolbar: GridToolbar,
								}}
								slotProps={{
									toolbar: {
										showQuickFilter: true,
										quickFilterProps: {
											debounceMs: 500,
											// InputProps: {
											//     placeholder: 'Search tickets...'
											// }
										},
									},
								}}
								disableRowSelectionOnClick
								sx={{
									border: "none",
									"& .MuiDataGrid-toolbarContainer": {
										borderBottom: "1px solid",
										borderColor: "divider",
										p: 2,
										bgcolor: "background.paper",
									},
									"& .MuiDataGrid-main": {
										bgcolor: "background.paper",
									},
								}}
							/>
						</Paper>
					</motion.div>

					{/* Response Dialog */}
					<Dialog
						open={ticketState.showResponseDialog}
						onClose={() =>
							setTicketState((prev) => ({
								...prev,
								showResponseDialog: false,
								responseText: "",
								selectedTicket: null,
							}))
						}
						maxWidth="md"
						fullWidth
						PaperProps={{
							sx: { borderRadius: 3 },
						}}
					>
						<DialogTitle
							sx={{
								borderBottom: "1px solid",
								borderColor: "divider",
								display: "flex",
								alignItems: "center",
								gap: 2,
								pb: 2,
							}}
						>
							<Support color="primary" />
							<Box>
								<Typography
									variant="h6"
									fontWeight="bold"
								>
									Add Admin Response
								</Typography>
								{ticketState.selectedTicket && (
									<Typography
										variant="body2"
										color="text.secondary"
									>
										Ticket: {ticketState.selectedTicket.id}•
										{ticketState.selectedTicket.name}
									</Typography>
								)}
							</Box>
						</DialogTitle>
						<DialogContent sx={{ pt: 6, pb: 4, px: 4 }}>
							{/* Ticket Context */}
							{ticketState.selectedTicket && (
								<Paper
									sx={{
										mb: 3,
										p: 3,
										bgcolor: "grey.50",
										border: "1px solid",
										borderColor: "divider",
									}}
								>
									<Typography
										variant="subtitle2"
										fontWeight="bold"
										gutterBottom
										color="primary"
									>
										Original Request:
									</Typography>
									<Typography
										variant="body2"
										color="text.secondary"
										sx={{ mb: 2 }}
									>
										<strong>Subject:</strong>
										{ticketState.selectedTicket.subject}
									</Typography>
									<Typography
										variant="body2"
										color="text.secondary"
									>
										{ticketState.selectedTicket.message}
									</Typography>
								</Paper>
							)}

							<TextField
								fullWidth
								multiline
								rows={6}
								label="Admin Response"
								placeholder="Type your professional response to the customer..."
								value={ticketState.responseText}
								onChange={(e) =>
									setTicketState((prev) => ({
										...prev,
										responseText: e.target.value,
									}))
								}
								sx={{
									"& .MuiOutlinedInput-root": {
										borderRadius: 2,
									},
								}}
							/>

							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ mt: 2, display: "block" }}
							>
								💡 This response will be sent to the customer
								via email and added to the ticket conversation
								history.
							</Typography>
						</DialogContent>
						<DialogActions
							sx={{
								p: 3,
								borderTop: "1px solid",
								borderColor: "divider",
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<Button
								onClick={() =>
									setTicketState((prev) => ({
										...prev,
										showResponseDialog: false,
										responseText: "",
										selectedTicket: null,
									}))
								}
								sx={{
									borderRadius: 2,
									color: "text.secondary",
								}}
							>
								Cancel
							</Button>
							<motion.div
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
							>
								<Button
									variant="contained"
									onClick={addAdminResponse}
									disabled={!ticketState.responseText.trim()}
									startIcon={<Send />}
									sx={{
										borderRadius: 2,
										px: 3,
										py: 1,
									}}
								>
									Send Response
								</Button>
							</motion.div>
						</DialogActions>
					</Dialog>

					{/* View Responses Dialog */}
					<Dialog
						open={ticketState.showViewResponsesDialog}
						onClose={() =>
							setTicketState((prev) => ({
								...prev,
								showViewResponsesDialog: false,
								selectedTicket: null,
							}))
						}
						maxWidth="md"
						fullWidth
						PaperProps={{
							sx: { borderRadius: 3, maxHeight: "80vh" },
						}}
					>
						<DialogTitle
							sx={{
								borderBottom: "1px solid",
								borderColor: "divider",
								display: "flex",
								alignItems: "center",
								gap: 2,
								pb: 2,
							}}
						>
							<Chat color="primary" />
							<Box>
								<Typography
									variant="h6"
									fontWeight="bold"
								>
									Ticket Conversation
								</Typography>
								{ticketState.selectedTicket && (
									<Typography
										variant="body2"
										color="text.secondary"
									>
										Ticket: {ticketState.selectedTicket.id}•
										{ticketState.selectedTicket.name}
									</Typography>
								)}
							</Box>
						</DialogTitle>
						<DialogContent
							sx={{
								pt: 6,
								pb: 4,
								px: 4,
								maxHeight: "60vh",
								overflow: "auto",
							}}
						>
							{ticketState.selectedTicket && (
								<>
									{/* Original Ticket */}
									<Paper
										sx={{
											mb: 3,
											p: 3,
											bgcolor: "grey.50",
											border: "1px solid",
											borderColor: "divider",
											borderRadius: 2,
										}}
									>
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 1,
												mb: 2,
											}}
										>
											<Person
												sx={{
													fontSize: 16,
													color: "text.secondary",
												}}
											/>
											<Typography
												variant="subtitle2"
												fontWeight="bold"
												color="text.primary"
											>
												{
													ticketState.selectedTicket
														.name
												}
											</Typography>
											<Typography
												variant="caption"
												color="text.secondary"
											>
												•
												{new Date(
													ticketState.selectedTicket.createdAt
												).toLocaleString()}
											</Typography>
										</Box>
										<Typography
											variant="body2"
											color="text.secondary"
											sx={{ mb: 2 }}
										>
											<strong>Subject:</strong>
											{ticketState.selectedTicket.subject}
										</Typography>
										<Typography
											variant="body2"
											color="text.secondary"
										>
											{ticketState.selectedTicket.message}
										</Typography>
									</Paper>

									{/* Responses */}
									{ticketState.selectedTicket.responses &&
									ticketState.selectedTicket.responses
										.length > 0 ? (
										<Box
											sx={{
												display: "flex",
												flexDirection: "column",
												gap: 2,
											}}
										>
											{ticketState.selectedTicket.responses.map(
												(response, index) => (
													<Paper
														key={response.id}
														sx={{
															p: 3,
															bgcolor:
																response.isAdmin
																	? "primary.50"
																	: "grey.50",
															border: "1px solid",
															borderColor:
																response.isAdmin
																	? "primary.200"
																	: "divider",
															borderRadius: 2,
															ml: response.isAdmin
																? 3
																: 0,
															mr: response.isAdmin
																? 0
																: 3,
														}}
													>
														<Box
															sx={{
																display: "flex",
																alignItems:
																	"center",
																gap: 1,
																mb: 2,
															}}
														>
															{response.isAdmin ? (
																<Security
																	sx={{
																		fontSize: 16,
																		color: "primary.main",
																	}}
																/>
															) : (
																<Person
																	sx={{
																		fontSize: 16,
																		color: "text.secondary",
																	}}
																/>
															)}
															<Typography
																variant="subtitle2"
																fontWeight="bold"
																color={
																	response.isAdmin
																		? "primary.main"
																		: "text.primary"
																}
															>
																{response.isAdmin
																	? "Admin Support"
																	: ticketState
																			.selectedTicket
																			?.name ||
																		"Customer"}
															</Typography>
															<Typography
																variant="caption"
																color="text.secondary"
															>
																•
																{new Date(
																	response.createdAt
																).toLocaleString()}
															</Typography>
														</Box>
														<Typography
															variant="body2"
															color="text.secondary"
															sx={{
																whiteSpace:
																	"pre-wrap",
															}}
														>
															{response.message}
														</Typography>
													</Paper>
												)
											)}
										</Box>
									) : (
										<Paper
											sx={{
												p: 3,
												textAlign: "center",
												bgcolor: "grey.50",
												border: "1px dashed",
												borderColor: "divider",
											}}
										>
											<Typography
												variant="body2"
												color="text.secondary"
											>
												No responses yet. Click
												&quot;Add Response&quot; to
												start the conversation.
											</Typography>
										</Paper>
									)}
								</>
							)}
						</DialogContent>
						<DialogActions
							sx={{
								p: 3,
								borderTop: "1px solid",
								borderColor: "divider",
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<Button
								onClick={() =>
									setTicketState((prev) => ({
										...prev,
										showViewResponsesDialog: false,
										selectedTicket: null,
									}))
								}
								sx={{
									borderRadius: 2,
									color: "text.secondary",
								}}
							>
								Close
							</Button>
							<Button
								variant="contained"
								startIcon={<Reply />}
								onClick={() => {
									setTicketState((prev) => ({
										...prev,
										showViewResponsesDialog: false,
										showResponseDialog: true,
										// Keep selectedTicket for the response dialog
									}));
								}}
								sx={{
									borderRadius: 2,
									px: 3,
									py: 1,
								}}
							>
								Add Response
							</Button>
						</DialogActions>
					</Dialog>
				</Box>
			</Box>
		</ThemeProvider>
	);
}
