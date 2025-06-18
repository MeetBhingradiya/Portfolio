"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Card,
	CardBody,
	Button,
	Chip,
	Tooltip,
	Badge,
	Alert,
	CircularProgress,
	Spinner,
} from "@heroui/react";
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
	TrendingUp,
	CheckCircle,
	Article,
	Drafts,
	Public,
	Lock,
	Person,
	ThumbUp,
} from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Axios } from "@Utils/Axios";
import { getCSRFToken } from "@Utils";
import { useRouter } from "next/navigation";
import { useAccountSwitcher } from "@Hooks/useAccountSwitcher";
import { LicenseInfo, generateLicense, muiXTelemetrySettings } from "@mui/x-license";
import AdminLayout from "@Components/Admin/Layout/AdminLayout";
import StatsGrid from "@Components/Admin/Widgets/StatsGrid";

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

// HeroUI-compatible theme for MUI-X DataGrid
const heroUIDataGridTheme: any = createTheme({
	palette: {
		mode: "light",
		primary: {
			main: "#006FEE", // HeroUI primary blue
			light: "#338EFF",
			dark: "#0052CC",
		},
		secondary: {
			main: "#7C3AED", // HeroUI secondary purple
			light: "#A855F7",
			dark: "#5B21B6",
		},
		success: {
			main: "#17C964", // HeroUI success green
			light: "#45D483",
			dark: "#12A150",
		},
		warning: {
			main: "#F5A524", // HeroUI warning orange
			light: "#F7B955",
			dark: "#D97706",
		},
		error: {
			main: "#F31260", // HeroUI danger red
			light: "#F54180",
			dark: "#C20E4D",
		},
		background: {
			default: "#FAFAFA", // HeroUI background
			paper: "#FFFFFF",
		},
		text: {
			primary: "#11181C", // HeroUI foreground
			secondary: "#687076", // HeroUI foreground-500
		},
		divider: "#E4E4E7", // HeroUI divider
	},
	shape: {
		borderRadius: 12, // HeroUI border radius
	},
	typography: {
		fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
		h4: {
			fontWeight: 700,
			fontSize: "1.75rem",
		},
		h5: {
			fontWeight: 600,
			fontSize: "1.5rem",
		},
		h6: {
			fontWeight: 600,
			fontSize: "1.25rem",
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
					border: "2px solid #F4F4F5", // HeroUI border
					borderRadius: "16px",
					backgroundColor: "#FFFFFF",
					fontFamily: 'inherit',
					"& .MuiDataGrid-cell": {
						borderColor: "#F4F4F5",
						fontSize: "0.875rem",
						padding: "12px 16px",
					},
					"& .MuiDataGrid-columnHeaders": {
						backgroundColor: "#FAFAFA",
						borderBottom: "2px solid #F4F4F5",
						borderRadius: "16px 16px 0 0",
						"& .MuiDataGrid-columnHeader": {
							fontWeight: 600,
							fontSize: "0.875rem",
							color: "#11181C",
							padding: "16px",
						},
					},
					"& .MuiDataGrid-row": {
						"&:hover": {
							backgroundColor: "#F4F4F5",
						},
						"&.Mui-selected": {
							backgroundColor: "#E6F1FE",
							"&:hover": {
								backgroundColor: "#CCE7FD",
							},
						},
					},
					"& .MuiDataGrid-footerContainer": {
						borderTop: "2px solid #F4F4F5",
						backgroundColor: "#FAFAFA",
						borderRadius: "0 0 16px 16px",
					},
					"& .MuiDataGrid-toolbarContainer": {
						padding: "16px 24px",
						borderBottom: "2px solid #F4F4F5",
						backgroundColor: "#FAFAFA",
						"& .MuiButton-root": {
							borderRadius: "8px",
							textTransform: "none",
							fontWeight: 500,
						},
					},
				},
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
					border: "2px solid #F4F4F5",
					borderRadius: "16px",
				},
			},
		},
	},
} as any);

export default function BlogAdminPage() {
	const router = useRouter();
	const { currentAccount } = useAccountSwitcher();
	const [isInitialLoading, setIsInitialLoading] = useState(true);
	const [isCSRFReady, setIsCSRFReady] = useState(false);
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
		if (!currentAccount.isAdmin) {
			router.push("/dashboard");
			return;
		}

		initializeCSRFAndFetchData();
	}, [currentAccount, router, isInitialLoading]);

	// Initialize CSRF token and then fetch blog data
	const initializeCSRFAndFetchData = async () => {
		setBlogState((prev) => ({ ...prev, loading: true, error: "" }));
		
		try {
			// Check if CSRF token is already available
			const existingCSRF = localStorage.getItem('trace');
			if (existingCSRF) {
				try {
					const parsedCSRF = JSON.parse(existingCSRF);
					if (parsedCSRF?.Status === 1) {
						setIsCSRFReady(true);
						await loadBlogs();
						await loadStats();
						return;
					}
					// Invalid stored CSRF, continue to fetch new one
					localStorage.removeItem('trace');
				} catch (e) {
					localStorage.removeItem('trace');
				}
			}

			// Get fresh CSRF token with timeout
			const csrfResponse = await Promise.race([
				getCSRFToken(),
				new Promise((_, reject) => 
					setTimeout(() => reject(new Error('CSRF token timeout')), 15000)
				)
			]);

			if (csrfResponse?.Status === 1) {
				localStorage.setItem('trace', JSON.stringify(csrfResponse));
				setIsCSRFReady(true);
				await loadBlogs();
				await loadStats();
			} else {
				throw new Error('CSRF token retrieval failed');
			}
		} catch (error: any) {
			setBlogState((prev) => ({
				...prev,
				error: handleCSRFError(error, "Failed to initialize security token"),
				loading: false,
			}));
		}
	};

	// Helper function to handle CSRF token errors consistently
	const handleCSRFError = (error: any, defaultMessage: string): string => {
		if (error.message === 'CSRF token retrieval in progress') {
			return "Security token is being prepared. Please try again in a moment.";
		}
		if (error.message === 'CSRF token timeout') {
			return "Security token initialization timed out. Please refresh the page.";
		}
		if (error.message === 'CSRF token retrieval failed') {
			return "Failed to retrieve security token. Please refresh the page.";
		}
		return error?.response?.data?.Message || defaultMessage;
	};

	const loadBlogs = async () => {
		if (!isCSRFReady) {
			console.warn("CSRF token not ready, skipping loadBlogs");
			return;
		}

		setBlogState((prev) => ({ ...prev, loading: true, error: "" }));

		try {
			const response = await Axios.get("/api/blog");

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
				error: handleCSRFError(error, "Failed to load blogs"),
				loading: false,
			}));
		}
	};
	const loadStats = async () => {
		if (!isCSRFReady) {
			console.warn("CSRF token not ready, skipping loadStats");
			return;
		}

		try {
			const response = await Axios.get("/api/blog/analytics", {
				headers: {
					Authorization: `Bearer ${currentAccount?.Session.Token}`,
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
		if (!isCSRFReady) {
			setBlogState((prev) => ({
				...prev,
				error: "Security token not ready. Please wait a moment and try again.",
			}));
			return;
		}

		try {
			const action = currentStatus ? "unpublish" : "publish";
			await Axios.post(
				`/api/blog/${blogID}/publish`,
				{ action }
			);

			loadBlogs();
			loadStats();
		} catch (error: any) {
			setBlogState((prev) => ({
				...prev,
				error: handleCSRFError(error, "Failed to update publish status"),
			}));
		}
	};
	const deleteBlog = async (blogID: string) => {
		if (!isCSRFReady) {
			setBlogState((prev) => ({
				...prev,
				error: "Security token not ready. Please wait a moment and try again.",
			}));
			return;
		}

		if (
			!confirm(
				"Are you sure you want to delete this blog? This action cannot be undone."
			)
		) {
			return;
		}

		try {
			await Axios.delete(`/api/blog/${blogID}`);

			loadBlogs();
			loadStats();
		} catch (error: any) {
			setBlogState((prev) => ({
				...prev,
				error: handleCSRFError(error, "Failed to delete blog"),
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
				<div className="py-2">
					<p className="font-semibold text-foreground text-sm mb-1">
						{params.value}
					</p>
					<p className="text-xs text-foreground-500">
						ID: {params.row.BlogID}
					</p>
				</div>
			),
		},
		{
			field: "author",
			headerName: "Author",
			width: 150,
			renderCell: (params: GridRenderCellParams) => (
				<div className="flex items-center gap-2">
					<Person className="text-sm text-foreground-400" />
					<span className="text-sm text-foreground">
						{params.value?.name || "Unknown"}
					</span>
				</div>
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
						size="sm"
						color={isPublished ? "success" : "warning"}
						variant="flat"
						startContent={
							isPublished ? (
								<CheckCircle className="text-xs" />
							) : (
								<Drafts className="text-xs" />
							)
						}
					>
						{isPublished ? "Published" : "Draft"}
					</Chip>
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
								icon: <Public className="text-xs" />,
								color: "primary" as const,
								label: "Public",
							};
						case "private":
							return {
								icon: <Lock className="text-xs" />,
								color: "danger" as const,
								label: "Private",
							};
						case "unlisted":
							return {
								icon: <VisibilityOff className="text-xs" />,
								color: "warning" as const,
								label: "Unlisted",
							};
						default:
							return {
								icon: <Article className="text-xs" />,
								color: "default" as const,
								label: visibility,
							};
					}
				};

				const config = getVisibilityConfig(params.value);
				return (
					<Chip
						size="sm"
						color={config.color}
						variant="flat"
						startContent={config.icon}
					>
						{config.label}
					</Chip>
				);
			},
		},
		{
			field: "Tags",
			headerName: "Tags",
			width: 200,
			renderCell: (params: GridRenderCellParams) => (
				<div className="flex gap-1 flex-wrap py-1">
					{params.value
						?.slice(0, 2)
						.map((tag: string, index: number) => (
							<Chip
								key={index}
								size="sm"
								variant="bordered"
								className="text-xs h-5"
							>
								{tag}
							</Chip>
						))}
					{params.value?.length > 2 && (
						<Chip
							size="sm"
							variant="bordered"
							className="text-xs h-5"
						>
							+{params.value.length - 2}
						</Chip>
					)}
				</div>
			),
		},
		{
			field: "Views",
			headerName: "Views",
			width: 100,
			align: "center",
			renderCell: (params: GridRenderCellParams) => (
				<Badge
					content={params.value}
					color="primary"
					size="sm"
					showOutline={false}
				>
					<Visibility className="text-sm text-foreground-400" />
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
					content={params.value}
					color="danger"
					size="sm"
					showOutline={false}
				>
					<ThumbUp className="text-sm text-foreground-400" />
				</Badge>
			),
		},
		{
			field: "createdAt",
			headerName: "Created",
			width: 120,
			valueGetter: (params: any) => new Date(params.row.createdAt),
			renderCell: (params: any) => (
				<span className="text-xs text-foreground-500">
					{new Date(params.row.createdAt).toLocaleDateString(
						"en-US",
						{
							month: "short",
							day: "numeric",
							year: "numeric",
						}
					)}
				</span>
			),
		},
		{
			field: "actions",
			type: "actions",
			headerName: "Actions",
			width: 150,
			getActions: (params: GridRowParams) => [
				<GridActionsCellItem
					key="edit"
					icon={<Edit className="text-sm text-primary" />}
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
							<UnpublishedOutlined className="text-sm text-warning" />
						) : (
							<Publish className="text-sm text-success" />
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
					icon={<Delete className="text-sm text-danger" />}
					label="Delete Blog"
					onClick={() => deleteBlog(params.row.BlogID)}
					showInMenu
				/>,
			],
		},
	];	if (isInitialLoading || !currentAccount) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<Spinner size="lg" />
			</div>
		);
	}

	// Stats data for the dashboard
	const statsData = [
		{
			title: "Total Blogs",
			value: blogState.stats.total,
			icon: <Article className="text-xl" />,
			color: "primary" as const,
			change: {
				value: "+12%",
				type: "increase" as const,
				period: "last month",
			},
		},
		{
			title: "Published",
			value: blogState.stats.published,
			icon: <CheckCircle className="text-xl" />,
			color: "success" as const,
			change: {
				value: "+8%",
				type: "increase" as const,
				period: "last month",
			},
		},
		{
			title: "Drafts",
			value: blogState.stats.draft,
			icon: <Drafts className="text-xl" />,
			color: "warning" as const,
		},
		{
			title: "Total Views",
			value: blogState.stats.totalViews,
			icon: <Visibility className="text-xl" />,
			color: "secondary" as const,
			change: {
				value: "+25%",
				type: "increase" as const,
				period: "last month",
			},
		},
		{
			title: "Total Likes",
			value: blogState.stats.totalLikes,
			icon: <TrendingUp className="text-xl" />,
			color: "danger" as const,
			change: {
				value: "+15%",
				type: "increase" as const,
				period: "last month",
			},
		},
	];

	return (
		<AdminLayout
			currentAccount={currentAccount}
			pageTitle="Blog Management"
			pageDescription="Create, edit, and manage your blog content"
			breadcrumbs={[
				{ label: "Admin", href: "/admin" },
				{ label: "Blog Management" },
			]}			onRefresh={() => {
				if (isCSRFReady) {
					loadBlogs();
					loadStats();
				} else {
					setBlogState((prev) => ({
						...prev,
						error: "Security token not ready. Please wait a moment and try again.",
					}));
				}
			}}
			isLoading={blogState.loading}
		>
			<div className="p-6 space-y-6">
				{/* Header Section */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
				>
					<div>
						<h1 className="text-2xl font-bold text-foreground">
							Blog Management
						</h1>
						<p className="text-foreground-500 mt-1">
							Create, edit, and manage your blog content with modern interface
						</p>
					</div>

					<div className="flex gap-3">						<Button
							variant="bordered"
							startContent={<Refresh />}
							onClick={() => {
								if (isCSRFReady) {
									loadBlogs();
									loadStats();
								} else {
									setBlogState((prev) => ({
										...prev,
										error: "Security token not ready. Please wait a moment and try again.",
									}));
								}
							}}
							isLoading={blogState.loading}
							isDisabled={!isCSRFReady}
						>
							{blogState.loading ? "Refreshing..." : "Refresh"}
						</Button>

						<Button
							color="primary"
							startContent={<Add />}
							onClick={() => router.push("/admin/blog/create")}
						>
							Create Blog
						</Button>
					</div>
				</motion.div>				{/* Stats Dashboard */}
				{isCSRFReady && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.1 }}
					>
						<StatsGrid stats={statsData} columns={5} />
					</motion.div>
				)}{/* CSRF Loading State */}
				<AnimatePresence>
					{!isCSRFReady && blogState.loading && !blogState.error && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
						>
							<Card className="p-6">
								<div className="flex items-center justify-center gap-3">
									<Spinner size="sm" color="primary" />
									<p className="text-foreground-500">
										Initializing security token and loading blog data...
									</p>
								</div>
							</Card>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Error Alert */}
				<AnimatePresence>
					{blogState.error && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
						>
							<Alert
								color="danger"
								variant="bordered"
								description={blogState.error}
								isClosable
								onClose={() =>
									setBlogState((prev) => ({
										...prev,
										error: "",
									}))
								}
							/>
						</motion.div>
					)}
				</AnimatePresence>				{/* DataGrid */}
				{isCSRFReady && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.3 }}
					>
						<Card className="p-0 overflow-hidden">
							<CardBody className="p-0">
								<ThemeProvider theme={heroUIDataGridTheme}>
									<div style={{ height: 650, width: "100%" }}>
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
												loadingOverlay: () => (
													<div className="flex items-center justify-center h-full">
														<Spinner size="lg" />
													</div>
												),
											}}
											slotProps={{
												toolbar: {
													showQuickFilter: true,
													quickFilterProps: {
														debounceMs: 500,
													},
												},
										}}
										disableRowSelectionOnClick
										sx={{
											border: "none",
											"& .MuiDataGrid-main": {
												backgroundColor: "transparent",
											},
										}}
									/>
								</div>							</ThemeProvider>
						</CardBody>
					</Card>
				</motion.div>
				)}
			</div>
		</AdminLayout>
	);
}
