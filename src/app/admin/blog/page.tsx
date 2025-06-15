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
	Divider,
    GridLegacy,
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
} from "@mui/x-data-grid-premium";
import {
	Add,
	Edit,
	Delete,
	Visibility,
	VisibilityOff,
	Publish,
	UnpublishedOutlined,
	Refresh,
	Analytics,
	TrendingUp,
	Schedule,
	CheckCircle,
	Error,
	Warning,
	Info,
	Article,
	Drafts,
	Public,
	Lock,
	CalendarToday,
	Person,
	Tag,
	Search,
	FilterList,
	ExitToApp,
} from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Axios } from "@Utils/Axios";
import { useRouter } from "next/navigation";
import { useAccountSwitcher } from "@Hooks/useAccountSwitcher";
import { LicenseInfo, generateLicense, muiXTelemetrySettings  } from "@mui/x-license";

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

interface Blog {
	_id: string;
	BlogID: string;
	Title: string;
	Description: string;
	Tags: string[];
	Visiblity: "public" | "private" | "unlisted";
	isPublished: boolean;
	PublishDate?: string;
	CreateDate: string;
	Views: number;
	Likes: number;
	AuthorID: string;
	author?: {
		userID: string;
		username: string;
		name: string;
	};
	createdAt: string;
	updatedAt: string;
}

interface BlogState {
	blogs: Blog[];
	loading: boolean;
	error: string;
	selectedBlog: Blog | null;
	showCreateDialog: boolean;
	showEditDialog: boolean;
	stats: {
		total: number;
		published: number;
		draft: number;
		totalViews: number;
		totalLikes: number;
	};
}

// GitHub-style theme (same as ticket admin)
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
					},
					"& .MuiDataGrid-columnHeaders": {
						backgroundColor: "#f6f8fa",
						borderBottom: "1px solid #d1d9e0",
						borderRadius: "12px 12px 0 0",
						"& .MuiDataGrid-columnHeader": {
							fontWeight: 600,
							fontSize: "0.875rem",
							color: "#24292f",
						},
					},
					"& .MuiDataGrid-row": {
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
	},
} as any);

export default function BlogAdminPage() {
	const router = useRouter();
	const { currentAccount } = useAccountSwitcher();
	const [isInitialLoading, setIsInitialLoading] = useState(true);
	const [blogState, setBlogState] = useState<BlogState>({
		blogs: [],
		loading: false,
		error: "",
		selectedBlog: null,
		showCreateDialog: false,
		showEditDialog: false,
		stats: {
			total: 0,
			published: 0,
			draft: 0,
			totalViews: 0,
			totalLikes: 0,
		},
	});	useEffect(() => {
		// Set loading to false after initial render to allow account switcher to load
		const timer = setTimeout(() => {
			setIsInitialLoading(false);
		}, 100);

		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		// Only run authentication checks after initial loading is complete
		if (isInitialLoading) return;
		// Check authentication
		const authToken = localStorage.getItem('auth-token');
		if (!currentAccount || !authToken) {
			router.push("/auth/signin");
			return;
		}

		// Check admin permissions
		if (!currentAccount.profileData.isAdmin) {
			router.push("/dashboard");
			return;
		}

		loadBlogs();
		loadStats();
	}, [currentAccount, router, isInitialLoading]);

	const loadBlogs = async () => {
		setBlogState((prev) => ({ ...prev, loading: true, error: "" }));

		try {
			const response = await Axios.get("/api/blog", {
				headers: {
					Authorization: `Bearer ${currentAccount?.encryptedToken}`,
				},
			});

			if (response.data.Status === 1) {
				setBlogState((prev) => ({
					...prev,
					blogs: response.data.Data.blogs,
					loading: false,
				}));
			} else {
				setBlogState((prev) => ({
					...prev,
					error: response.data.Message || "Failed to load blogs",
					loading: false,
				}));
			}
		} catch (error: any) {
			setBlogState((prev) => ({
				...prev,
				error: error?.response?.data?.Message || "Failed to load blogs",
				loading: false,
			}));
		}
	};

	const loadStats = async () => {
		try {
			const response = await Axios.get("/api/blog/analytics", {
				headers: {
					Authorization: `Bearer ${currentAccount?.encryptedToken}`,
				},
			});

			if (response.data.Status === 1) {
				setBlogState((prev) => ({
					...prev,
					stats: response.data.Data.overview,
				}));
			}
		} catch (error) {
			console.warn("Failed to load blog analytics");
		}
	};

	const togglePublishStatus = async (
		blogID: string,
		currentStatus: boolean
	) => {
		try {
			const action = currentStatus ? "unpublish" : "publish";
			await Axios.post(
				`/api/blog/${blogID}/publish`,
				{ action },
				{
					headers: {
						Authorization: `Bearer ${currentAccount?.encryptedToken}`,
					},
				}
			);

			loadBlogs();
			loadStats();
		} catch (error: any) {
			setBlogState((prev) => ({
				...prev,
				error:
					error?.response?.data?.Message ||
					"Failed to update publish status",
			}));
		}
	};

	const deleteBlog = async (blogID: string) => {
		if (
			!confirm(
				"Are you sure you want to delete this blog? This action cannot be undone."
			)
		) {
			return;
		}

		try {
			await Axios.delete(`/api/blog/${blogID}`, {
				headers: {
					Authorization: `Bearer ${currentAccount?.encryptedToken}`,
				},
			});

			loadBlogs();
			loadStats();
		} catch (error: any) {
			setBlogState((prev) => ({
				...prev,
				error:
					error?.response?.data?.Message || "Failed to delete blog",
			}));
		}
	};

	// DataGrid columns configuration
	const columns: GridColDef[] = [
		{
			field: "Title",
			headerName: "Title",
			width: 300,
			renderCell: (params: GridRenderCellParams) => (
				<Box>
					<Typography
						variant="body2"
						sx={{ fontWeight: 600, mb: 0.5 }}
					>
						{params.value}
					</Typography>
					<Typography
						variant="caption"
						color="text.secondary"
					>
						ID: {params.row.BlogID}
					</Typography>
				</Box>
			),
		},
		{
			field: "author",
			headerName: "Author",
			width: 150,
			renderCell: (params: GridRenderCellParams) => (
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Person sx={{ fontSize: 16, color: "text.secondary" }} />
					<Typography variant="body2">
						{params.value?.name || "Unknown"}
					</Typography>
				</Box>
			),
		},
		{
			field: "isPublished",
			headerName: "Status",
			width: 120,
			renderCell: (params: GridRenderCellParams) => {
				const isPublished = params.value;
				return (
					<Chip
						label={isPublished ? "Published" : "Draft"}
						color={isPublished ? "success" : "warning"}
						size="small"
						icon={
							isPublished ? (
								<CheckCircle sx={{ fontSize: 14 }} />
							) : (
								<Drafts sx={{ fontSize: 14 }} />
							)
						}
						variant="outlined"
						sx={{ fontWeight: 500 }}
					/>
				);
			},
		},
		{
			field: "Visiblity",
			headerName: "Visibility",
			width: 120,
			renderCell: (params: GridRenderCellParams) => {
				const getVisibilityConfig = (visibility: string) => {
					switch (visibility) {
						case "public":
							return {
								icon: <Public sx={{ fontSize: 14 }} />,
								color: "primary",
								label: "Public",
							};
						case "private":
							return {
								icon: <Lock sx={{ fontSize: 14 }} />,
								color: "error",
								label: "Private",
							};
						case "unlisted":
							return {
								icon: <VisibilityOff sx={{ fontSize: 14 }} />,
								color: "warning",
								label: "Unlisted",
							};
						default:
							return {
								icon: <Info sx={{ fontSize: 14 }} />,
								color: "default",
								label: visibility,
							};
					}
				};

				const config = getVisibilityConfig(params.value);
				return (
					<Chip
						label={config.label}
						color={config.color as any}
						size="small"
						icon={config.icon}
						variant="outlined"
						sx={{ fontWeight: 500 }}
					/>
				);
			},
		},
		{
			field: "Tags",
			headerName: "Tags",
			width: 200,
			renderCell: (params: GridRenderCellParams) => (
				<Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
					{params.value
						?.slice(0, 2)
						.map((tag: string, index: number) => (
							<Chip
								key={index}
								label={tag}
								size="small"
								variant="outlined"
								sx={{ fontSize: "0.7rem", height: 20 }}
							/>
						))}
					{params.value?.length > 2 && (
						<Chip
							label={`+${params.value.length - 2}`}
							size="small"
							variant="outlined"
							sx={{ fontSize: "0.7rem", height: 20 }}
						/>
					)}
				</Box>
			),
		},
		{
			field: "Views",
			headerName: "Views",
			width: 100,
			align: "center",
			renderCell: (params: GridRenderCellParams) => (
				<Badge
					badgeContent={params.value}
					color="primary"
					sx={{
						"& .MuiBadge-badge": {
							fontSize: "0.6rem",
							height: 16,
							minWidth: 16,
						},
					}}
				>
					<Visibility
						sx={{ fontSize: 16, color: "text.secondary" }}
					/>
				</Badge>
			),
		},
		{
			field: "Likes",
			headerName: "Likes",
			width: 100,
			align: "center",
			renderCell: (params: GridRenderCellParams) => (
				<Badge
					badgeContent={params.value}
					color="error"
					sx={{
						"& .MuiBadge-badge": {
							fontSize: "0.6rem",
							height: 16,
							minWidth: 16,
						},
					}}
				>
					<TrendingUp
						sx={{ fontSize: 16, color: "text.secondary" }}
					/>
				</Badge>
			),
		},
		{
			field: "createdAt",
			headerName: "Created",
			width: 120,
			valueGetter: (params: any) => new Date(params.row.createdAt),
			renderCell: (params: any) => (
				<Typography
					variant="caption"
					color="text.secondary"
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
			),
		},
		{
			field: "actions",
			type: "actions",
			headerName: "Actions",
			width: 150,			getActions: (params: GridRowParams) => [
				<GridActionsCellItem
					key="edit"
					icon={<Edit sx={{ fontSize: 18, color: "primary.main" }} />}
					label="Edit Blog"
					onClick={() =>
						router.push(`/admin/blog/edit/${params.row.BlogID}`)
					}
					showInMenu
				/>,
				<GridActionsCellItem
					key="publish"
					icon={
						params.row.isPublished ? (
							<UnpublishedOutlined sx={{ fontSize: 18, color: "warning.main" }} />
						) : (
							<Publish sx={{ fontSize: 18, color: "success.main" }} />
						)
					}
					label={params.row.isPublished ? "Unpublish" : "Publish"}
					onClick={() =>
						togglePublishStatus(
							params.row.BlogID,
							params.row.isPublished
						)
					}
                    showInMenu
				/>,
				<GridActionsCellItem
					key="delete"
					icon={<Delete sx={{ fontSize: 18, color: "error.main" }} />}
					label="Delete Blog"
					onClick={() => deleteBlog(params.row.BlogID)}
					showInMenu
				/>,
			],
		},
	];
	if (isInitialLoading || !currentAccount) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "100vh",
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

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
							<Article
								sx={{ fontSize: 28, color: "primary.main" }}
							/>
							<Box>
								<Typography
									variant="h6"
									fontWeight="bold"
								>
									Blog Admin
								</Typography>
								<Typography
									variant="caption"
									color="text.secondary"
								>
									Content Management System
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
								label={`${currentAccount.firstName} ${currentAccount.lastName}`}
								size="small"
								color="primary"
								variant="outlined"
							/>
							<IconButton
								onClick={() => router.push("/dashboard")}
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
									Blog Management
								</Typography>
								<Typography
									variant="body1"
									color="text.secondary"
								>
									Create, edit, and manage your blog content
									with GitHub-style interface
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
										onClick={() => {
											loadBlogs();
											loadStats();
										}}
										disabled={blogState.loading}
										sx={{ borderRadius: 2 }}
									>
										{blogState.loading ? (
											<CircularProgress size={16} />
										) : (
											"Refresh"
										)}
									</Button>
								</motion.div>

								<motion.div
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
								>
									<Button
										variant="contained"
										startIcon={<Add />}
										onClick={() =>
											router.push("/admin/blog/create")
										}
										sx={{ borderRadius: 2 }}
									>
										Create Blog
									</Button>
								</motion.div>
							</Stack>
						</Box>						{/* Stats Dashboard */}
						<GridLegacy
							container
							spacing={3}
							sx={{ mb: 4 }}
						>
							{[
								{
									title: "Total Blogs",
									value: blogState.stats.total,
									icon: <Article sx={{ fontSize: 24 }} />,
									color: "primary.main",
									bgColor: "primary.main",
								},
								{
									title: "Published",
									value: blogState.stats.published,
									icon: <CheckCircle sx={{ fontSize: 24 }} />,
									color: "success.main",
									bgColor: "success.main",
								},
								{
									title: "Drafts",
									value: blogState.stats.draft,
									icon: <Drafts sx={{ fontSize: 24 }} />,
									color: "warning.main",
									bgColor: "warning.main",
								},
								{
									title: "Total Views",
									value: blogState.stats.totalViews,
									icon: <Visibility sx={{ fontSize: 24 }} />,
									color: "info.main",
									bgColor: "info.main",
								},
								{
									title: "Total Likes",
									value: blogState.stats.totalLikes,
									icon: <TrendingUp sx={{ fontSize: 24 }} />,
									color: "error.main",
									bgColor: "error.main",
								},
							].map((stat, index) => (
								<GridLegacy
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
												</Box>
												<Typography
													variant="h4"
													fontWeight="bold"
													color="text.primary"
												>
													{stat.value}
												</Typography>
												<Typography
													variant="body2"
													color="text.secondary"
												>
													{stat.title}
												</Typography>
											</CardContent>
										</Card>
									</motion.div>
								</GridLegacy>
							))}
						</GridLegacy>
					</motion.div>

					{/* Error Alert */}
					<AnimatePresence>
						{blogState.error && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
							>
								<Alert
									severity="error"
									sx={{ mb: 3, borderRadius: 2 }}
									onClose={() =>
										setBlogState((prev) => ({
											...prev,
											error: "",
										}))
									}
								>
									{blogState.error}
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
								rows={blogState.blogs}
								columns={columns}
								loading={blogState.loading}
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
											// placeholder: "Search blogs...",
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
				</Box>
			</Box>
		</ThemeProvider>
	);
}
