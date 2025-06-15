"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Box,
	Typography,
	TextField,
	Chip,
	Card,
	CardContent,
	CardMedia,
	Container,
	InputAdornment,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Pagination,
	CircularProgress,
	Alert,
	Avatar,
	IconButton,
	Tooltip,
	Divider,
	Paper,
	GridLegacy as Grid,
} from "@mui/material";
import {
	Search,
	CalendarToday,
	Person,
	Visibility,
	TrendingUp,
	Tag,
	FilterList,
	Clear,
	Article,
	AccessTime,
	Share,
	Bookmark,
} from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Axios } from "@Utils/Axios";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@Components/Header";
import LandingFooter from "@Components/Footer/LandingFooter";

// GitHub-inspired theme for public pages
const blogTheme = createTheme({
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
		background: {
			default: "#ffffff",
			paper: "#f6f8fa",
		},
		text: {
			primary: "#24292f",
			secondary: "#656d76",
		},
	},
	typography: {
		fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
		h1: {
			fontWeight: 800,
			fontSize: "3rem",
			lineHeight: 1.2,
		},
		h2: {
			fontWeight: 700,
			fontSize: "2.25rem",
			lineHeight: 1.3,
		},
		h3: {
			fontWeight: 600,
			fontSize: "1.5rem",
			lineHeight: 1.4,
		},
		body1: {
			fontSize: "1rem",
			lineHeight: 1.6,
		},
		body2: {
			fontSize: "0.875rem",
			lineHeight: 1.5,
		},
	},
	components: {
		MuiCard: {
			styleOverrides: {
				root: {
					borderRadius: "12px",
					border: "1px solid #d1d9e0",
					transition: "all 0.3s ease-in-out",
					"&:hover": {
						transform: "translateY(-4px)",
						boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
						borderColor: "#0969da",
					},
				},
			},
		},
		MuiChip: {
			styleOverrides: {
				root: {
					fontWeight: 500,
					fontSize: "0.75rem",
					borderRadius: "16px",
				},
			},
		},
	},
});

interface Blog {
	BlogID: string;
	Title: string;
	Description: string;
	Tags: string[];
	BannerImage?: string;
	Views: number;
	Likes: number;
	author?: {
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
	filters: {
		search: string;
		tag: string;
		sortBy: "latest" | "popular" | "trending";
	};
	pagination: {
		page: number;
		limit: number;
		total: number;
		pages: number;
	};
	featuredBlogs: Blog[];
	popularTags: string[];
}

function BlogListPage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [blogState, setBlogState] = useState<BlogState>({
		blogs: [],
		loading: true,
		error: "",
		filters: {
			search: searchParams.get("search") || "",
			tag: searchParams.get("tag") || "",
			sortBy: (searchParams.get("sort") as any) || "latest",
		},
		pagination: {
			page: parseInt(searchParams.get("page") || "1"),
			limit: 12,
			total: 0,
			pages: 0,
		},
		featuredBlogs: [],
		popularTags: [],
	});

	useEffect(() => {
		loadBlogs();
		loadFeaturedBlogs();
		loadPopularTags();
	}, [blogState.filters, blogState.pagination.page]);

	const loadBlogs = async () => {
		setBlogState((prev) => ({ ...prev, loading: true, error: "" }));

		try {
			const params = new URLSearchParams({
				page: blogState.pagination.page.toString(),
				limit: blogState.pagination.limit.toString(),
				status: "published",
				visibility: "public",
			});

			if (blogState.filters.search) {
				params.append("search", blogState.filters.search);
			}

			if (blogState.filters.tag) {
				params.append("tags", blogState.filters.tag);
			}

			const response = await Axios.get(`/api/blog?${params}`);

			if (response.data.Status === 1) {
				let blogs = response.data.Data.blogs;

				// Sort blogs based on sortBy filter
				if (blogState.filters.sortBy === "popular") {
					blogs = blogs.sort((a: Blog, b: Blog) => b.Views - a.Views);
				} else if (blogState.filters.sortBy === "trending") {
					blogs = blogs.sort((a: Blog, b: Blog) => b.Likes - a.Likes);
				} else {
					blogs = blogs.sort(
						(a: Blog, b: Blog) =>
							new Date(b.createdAt).getTime() -
							new Date(a.createdAt).getTime()
					);
				}

				setBlogState((prev) => ({
					...prev,
					blogs,
					pagination: response.data.Data.pagination,
					loading: false,
				}));
			} else {
				setBlogState((prev) => ({
					...prev,
					error: "Failed to load blogs",
					loading: false,
				}));
			}
		} catch (error: any) {
			setBlogState((prev) => ({
				...prev,
				error: "Failed to load blogs",
				loading: false,
			}));
		}
	};

	const loadFeaturedBlogs = async () => {
		try {
			const response = await Axios.get(
				"/api/blog?limit=3&status=published&visibility=public"
			);
			if (response.data.Status === 1) {
				// Get top 3 most viewed blogs as featured
				const featured = response.data.Data.blogs
					.sort((a: Blog, b: Blog) => b.Views - a.Views)
					.slice(0, 3);

				setBlogState((prev) => ({
					...prev,
					featuredBlogs: featured,
				}));
			}
		} catch (error) {
			console.warn("Failed to load featured blogs");
		}
	};

	const loadPopularTags = async () => {
		try {
			// This would ideally be a separate API endpoint for tag analytics
			const response = await Axios.get(
				"/api/blog?limit=100&status=published&visibility=public"
			);
			if (response.data.Status === 1) {
				const allTags: string[] = [];
				response.data.Data.blogs.forEach((blog: Blog) => {
					allTags.push(...(blog.Tags || []));
				});

				// Count tag frequency and get top 10
				const tagCounts = allTags.reduce(
					(acc, tag) => {
						acc[tag] = (acc[tag] || 0) + 1;
						return acc;
					},
					{} as Record<string, number>
				);

				const popularTags = Object.entries(tagCounts)
					.sort(([, a], [, b]) => b - a)
					.slice(0, 10)
					.map(([tag]) => tag);

				setBlogState((prev) => ({
					...prev,
					popularTags,
				}));
			}
		} catch (error) {
			console.warn("Failed to load popular tags");
		}
	};

	const handleFilterChange = (
		field: keyof typeof blogState.filters,
		value: string
	) => {
		setBlogState((prev) => ({
			...prev,
			filters: { ...prev.filters, [field]: value },
			pagination: { ...prev.pagination, page: 1 },
		}));

		// Update URL params
		const params = new URLSearchParams(searchParams);
		if (value) {
			params.set(field === "sortBy" ? "sort" : field, value);
		} else {
			params.delete(field === "sortBy" ? "sort" : field);
		}
		params.set("page", "1");
		router.push(`/blog?${params.toString()}`);
	};

	const handlePageChange = (
		event: React.ChangeEvent<unknown>,
		page: number
	) => {
		setBlogState((prev) => ({
			...prev,
			pagination: { ...prev.pagination, page },
		}));

		const params = new URLSearchParams(searchParams);
		params.set("page", page.toString());
		router.push(`/blog?${params.toString()}`);
	};

	const clearFilters = () => {
		setBlogState((prev) => ({
			...prev,
			filters: { search: "", tag: "", sortBy: "latest" },
			pagination: { ...prev.pagination, page: 1 },
		}));
		router.push("/blog");
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const formatViews = (views: number) => {
		if (views >= 1000) {
			return `${(views / 1000).toFixed(1)}k`;
		}
		return views.toString();
	};

	return (
		<ThemeProvider theme={blogTheme}>
			<Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
				<Header />

				{/* Hero Section */}
				<Box
					sx={{
						background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
						color: "white",
						py: 8,
					}}
				>
					<Container maxWidth="lg">
						<motion.div
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8 }}
						>
							<Box sx={{ textAlign: "center", mb: 4 }}>
								<Typography
									variant="h1"
									gutterBottom
								>
									Technical
									<span style={{ color: "#FFD700" }}>
										Blog
									</span>
								</Typography>
								<Typography
									variant="h5"
									sx={{
										opacity: 0.9,
										maxWidth: 600,
										mx: "auto",
									}}
								>
									Insights on software engineering, security,
									automation, and the latest in tech. From a
									Staff Engineer&apos;s perspective.
								</Typography>
							</Box>

							{/* Search and Filters */}
							<Paper
								sx={{
									p: 3,
									borderRadius: 3,
									bgcolor: "rgba(255, 255, 255, 0.95)",
									backdropFilter: "blur(10px)",
								}}
							>
								
								<Grid
									container
									spacing={2}
									alignItems="center"
								>
									<Grid
										item
										xs={12}
										md={4}
									>
										<TextField
											fullWidth
											placeholder="Search blogs..."
											value={blogState.filters.search}
											onChange={(e) =>
												handleFilterChange(
													"search",
													e.target.value
												)
											}
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<Search />
													</InputAdornment>
												),
												endAdornment: blogState.filters
													.search && (
													<InputAdornment position="end">
														<IconButton
															size="small"
															onClick={() =>
																handleFilterChange(
																	"search",
																	""
																)
															}
														>
															<Clear />
														</IconButton>
													</InputAdornment>
												),
											}}
											sx={{
												bgcolor: "white",
												borderRadius: 2,
											}}
										/>
									</Grid>

									<Grid
										item
										xs={12}
										md={3}
									>
										<FormControl fullWidth>
											<InputLabel>Tag</InputLabel>
											<Select
												value={blogState.filters.tag}
												label="Tag"
												onChange={(e) =>
													handleFilterChange(
														"tag",
														e.target.value
													)
												}
												sx={{
													bgcolor: "white",
													borderRadius: 2,
												}}
											>
												<MenuItem value="">
													All Tags
												</MenuItem>
												{blogState.popularTags.map(
													(tag) => (
														<MenuItem
															key={tag}
															value={tag}
														>
															{tag}
														</MenuItem>
													)
												)}
											</Select>
										</FormControl>
									</Grid>

									<Grid
										item
										xs={12}
										md={3}
									>
										<FormControl fullWidth>
											<InputLabel>Sort By</InputLabel>
											<Select
												value={blogState.filters.sortBy}
												label="Sort By"
												onChange={(e) =>
													handleFilterChange(
														"sortBy",
														e.target.value
													)
												}
												sx={{
													bgcolor: "white",
													borderRadius: 2,
												}}
											>
												<MenuItem value="latest">
													Latest
												</MenuItem>
												<MenuItem value="popular">
													Most Viewed
												</MenuItem>
												<MenuItem value="trending">
													Most Liked
												</MenuItem>
											</Select>
										</FormControl>
									</Grid>

									<Grid
										item
										xs={12}
										md={2}
									>
										<Box sx={{ display: "flex", gap: 1 }}>
											<Tooltip title="Clear Filters">
												<IconButton
													onClick={clearFilters}
													sx={{
														bgcolor: "white",
														borderRadius: 2,
														"&:hover": {
															bgcolor: "grey.100",
														},
													}}
												>
													<Clear />
												</IconButton>
											</Tooltip>
										</Box>
									</Grid>
								</Grid>
								{/* Active Filters */}
								{(blogState.filters.search ||
									blogState.filters.tag) && (
									<Box
										sx={{
											mt: 2,
											display: "flex",
											gap: 1,
											alignItems: "center",
										}}
									>
										<Typography
											variant="body2"
											color="text.secondary"
										>
											Active filters:
										</Typography>
										{blogState.filters.search && (
											<Chip
												label={`Search: "${blogState.filters.search}"`}
												onDelete={() =>
													handleFilterChange(
														"search",
														""
													)
												}
												size="small"
												color="primary"
											/>
										)}
										{blogState.filters.tag && (
											<Chip
												label={`Tag: ${blogState.filters.tag}`}
												onDelete={() =>
													handleFilterChange(
														"tag",
														""
													)
												}
												size="small"
												color="secondary"
											/>
										)}
									</Box>
								)}
							</Paper>
						</motion.div>
					</Container>
				</Box>

				{/* Main Content */}
				<Container
					maxWidth="lg"
					sx={{ py: 6 }}
				>
					{/* Featured Blogs */}
					{blogState.featuredBlogs.length > 0 &&
						!blogState.filters.search &&
						!blogState.filters.tag && (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6 }}
							>
								<Box sx={{ mb: 6 }}>
									<Typography
										variant="h3"
										gutterBottom
										fontWeight="bold"
									>
										Featured Posts
									</Typography>
									<Grid
										container
										spacing={3}
									>
										{blogState.featuredBlogs.map(
											(blog, index) => (
												<Grid
													item
													xs={12}
													md={4}
													key={blog.BlogID}
												>
													<motion.div
														initial={{
															opacity: 0,
															y: 20,
														}}
														animate={{
															opacity: 1,
															y: 0,
														}}
														transition={{
															duration: 0.6,
															delay: index * 0.1,
														}}
														whileHover={{
															scale: 1.02,
														}}
													>
														<Card
															sx={{
																height: "100%",
																cursor: "pointer",
																position:
																	"relative",
																overflow:
																	"hidden",
															}}
															onClick={() =>
																router.push(
																	`/blog/${blog.BlogID}`
																)
															}
														>
															{blog.BannerImage && (
																<CardMedia
																	component="img"
																	height="200"
																	image={
																		blog.BannerImage
																	}
																	alt={
																		blog.Title
																	}
																/>
															)}
															<Box
																sx={{
																	position:
																		"absolute",
																	top: 12,
																	right: 12,
																	bgcolor:
																		"rgba(0, 0, 0, 0.7)",
																	color: "white",
																	px: 1,
																	py: 0.5,
																	borderRadius: 1,
																	fontSize:
																		"0.75rem",
																}}
															>
																Featured
															</Box>
															<CardContent>
																<Typography
																	variant="h6"
																	gutterBottom
																	fontWeight="bold"
																>
																	{blog.Title}
																</Typography>
																<Typography
																	variant="body2"
																	color="text.secondary"
																	sx={{
																		mb: 2,
																	}}
																>
																	{blog.Description?.substring(
																		0,
																		100
																	)}
																	...
																</Typography>

																<Box
																	sx={{
																		display:
																			"flex",
																		flexWrap:
																			"wrap",
																		gap: 0.5,
																		mb: 2,
																	}}
																>
																	{blog.Tags?.slice(
																		0,
																		3
																	).map(
																		(
																			tag
																		) => (
																			<Chip
																				key={
																					tag
																				}
																				label={
																					tag
																				}
																				size="small"
																				variant="outlined"
																				sx={{
																					fontSize:
																						"0.7rem",
																				}}
																			/>
																		)
																	)}
																</Box>

																<Box
																	sx={{
																		display:
																			"flex",
																		justifyContent:
																			"space-between",
																		alignItems:
																			"center",
																	}}
																>
																	<Box
																		sx={{
																			display:
																				"flex",
																			alignItems:
																				"center",
																			gap: 1,
																		}}
																	>
																		<CalendarToday
																			sx={{
																				fontSize: 16,
																			}}
																		/>
																		<Typography variant="caption">
																			{formatDate(
																				blog.createdAt
																			)}
																		</Typography>
																	</Box>
																	<Box
																		sx={{
																			display:
																				"flex",
																			alignItems:
																				"center",
																			gap: 1,
																		}}
																	>
																		<Visibility
																			sx={{
																				fontSize: 16,
																			}}
																		/>
																		<Typography variant="caption">
																			{formatViews(
																				blog.Views
																			)}
																		</Typography>
																	</Box>
																</Box>
															</CardContent>
														</Card>
													</motion.div>
												</Grid>
											)
										)}
									</Grid>
								</Box>
								<Divider sx={{ my: 4 }} />
							</motion.div>
						)}

					{/* Error State */}
					{blogState.error && (
						<Alert
							severity="error"
							sx={{ mb: 4 }}
						>
							{blogState.error}
						</Alert>
					)}

					{/* Loading State */}
					{blogState.loading && (
						<Box
							sx={{
								display: "flex",
								justifyContent: "center",
								py: 8,
							}}
						>
							<CircularProgress size={48} />
						</Box>
					)}

					{/* Blog List */}
					{!blogState.loading && (
						<>
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									mb: 4,
								}}
							>
								<Typography
									variant="h3"
									fontWeight="bold"
								>
									{blogState.filters.search ||
									blogState.filters.tag
										? "Search Results"
										: "All Posts"}
								</Typography>
								<Typography
									variant="body2"
									color="text.secondary"
								>
									{blogState.pagination.total} posts found
								</Typography>
							</Box>

							{blogState.blogs.length === 0 ? (
								<Box sx={{ textAlign: "center", py: 8 }}>
									<Article
										sx={{
											fontSize: 64,
											color: "text.secondary",
											mb: 2,
										}}
									/>
									<Typography
										variant="h5"
										gutterBottom
									>
										No blogs found
									</Typography>
									<Typography
										variant="body1"
										color="text.secondary"
									>
										{blogState.filters.search ||
										blogState.filters.tag
											? "Try adjusting your search filters"
											: "Check back soon for new content!"}
									</Typography>
								</Box>
							) : (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ duration: 0.6 }}
								>
									<Grid
										container
										spacing={3}
									>
										{blogState.blogs.map((blog, index) => (
											<Grid
												item
												xs={12}
												md={6}
												lg={4}
												key={blog.BlogID}
											>
												<motion.div
													initial={{
														opacity: 0,
														y: 20,
													}}
													animate={{
														opacity: 1,
														y: 0,
													}}
													transition={{
														duration: 0.6,
														delay: index * 0.1,
													}}
													whileHover={{ scale: 1.02 }}
												>
													<Card
														sx={{
															height: "100%",
															cursor: "pointer",
															display: "flex",
															flexDirection:
																"column",
														}}
														onClick={() =>
															router.push(
																`/blog/${blog.BlogID}`
															)
														}
													>
														{blog.BannerImage && (
															<CardMedia
																component="img"
																height="180"
																image={
																	blog.BannerImage
																}
																alt={blog.Title}
															/>
														)}
														<CardContent
															sx={{
																flexGrow: 1,
																display: "flex",
																flexDirection:
																	"column",
															}}
														>
															<Typography
																variant="h6"
																gutterBottom
																fontWeight="bold"
															>
																{blog.Title}
															</Typography>

															<Typography
																variant="body2"
																color="text.secondary"
																sx={{
																	mb: 2,
																	flexGrow: 1,
																}}
															>
																{blog.Description?.substring(
																	0,
																	120
																)}
																...
															</Typography>

															<Box
																sx={{
																	display:
																		"flex",
																	flexWrap:
																		"wrap",
																	gap: 0.5,
																	mb: 2,
																}}
															>
																{blog.Tags?.slice(
																	0,
																	3
																).map((tag) => (
																	<Chip
																		key={
																			tag
																		}
																		label={
																			tag
																		}
																		size="small"
																		variant="outlined"
																		sx={{
																			fontSize:
																				"0.7rem",
																		}}
																		onClick={(
																			e
																		) => {
																			e.stopPropagation();
																			handleFilterChange(
																				"tag",
																				tag
																			);
																		}}
																	/>
																))}
															</Box>

															<Box
																sx={{
																	display:
																		"flex",
																	justifyContent:
																		"space-between",
																	alignItems:
																		"center",
																	mt: "auto",
																}}
															>
																<Box
																	sx={{
																		display:
																			"flex",
																		alignItems:
																			"center",
																		gap: 1,
																	}}
																>
																	<Avatar
																		sx={{
																			width: 24,
																			height: 24,
																			fontSize:
																				"0.75rem",
																		}}
																	>
																		{blog.author?.name?.charAt(
																			0
																		) ||
																			"M"}
																	</Avatar>
																	<Typography variant="caption">
																		{blog
																			.author
																			?.name ||
																			"Meet Bhingradiya"}
																	</Typography>
																</Box>

																<Box
																	sx={{
																		display:
																			"flex",
																		alignItems:
																			"center",
																		gap: 2,
																	}}
																>
																	<Box
																		sx={{
																			display:
																				"flex",
																			alignItems:
																				"center",
																			gap: 0.5,
																		}}
																	>
																		<Visibility
																			sx={{
																				fontSize: 14,
																			}}
																		/>
																		<Typography variant="caption">
																			{formatViews(
																				blog.Views
																			)}
																		</Typography>
																	</Box>
																	<Box
																		sx={{
																			display:
																				"flex",
																			alignItems:
																				"center",
																			gap: 0.5,
																		}}
																	>
																		<TrendingUp
																			sx={{
																				fontSize: 14,
																			}}
																		/>
																		<Typography variant="caption">
																			{
																				blog.Likes
																			}
																		</Typography>
																	</Box>
																</Box>
															</Box>

															<Typography
																variant="caption"
																color="text.secondary"
																sx={{ mt: 1 }}
															>
																{formatDate(
																	blog.createdAt
																)}
															</Typography>
														</CardContent>
													</Card>
												</motion.div>
											</Grid>
										))}
									</Grid>

									{/* Pagination */}
									{blogState.pagination.pages > 1 && (
										<Box
											sx={{
												display: "flex",
												justifyContent: "center",
												mt: 6,
											}}
										>
											<Pagination
												count={
													blogState.pagination.pages
												}
												page={blogState.pagination.page}
												onChange={handlePageChange}
												color="primary"
												size="large"
												showFirstButton
												showLastButton
											/>
										</Box>
									)}
								</motion.div>
							)}
						</>
					)}
				</Container>

				<LandingFooter />
			</Box>		</ThemeProvider>
	);
}

// Loading component for Suspense fallback
function BlogListLoading() {
	return (
		<ThemeProvider theme={blogTheme}>
			<Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
				<Header />
				<Container maxWidth="lg" sx={{ py: 6 }}>
					<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
						<CircularProgress size={48} />
					</Box>
				</Container>
				<LandingFooter />
			</Box>
		</ThemeProvider>
	);
}

export default function BlogPage() {
	return (
		<Suspense fallback={<BlogListLoading />}>
			<BlogListPage />
		</Suspense>
	);
}
