"use client";

import React, { useState, useCallback } from "react";
import {
	Card,
	CardBody,
	CardHeader,
	Button,
	Input,
	Select,
	SelectItem,
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
	Chip,
	Avatar,
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	useDisclosure,
	Textarea,
	Switch,
	Image,
	Link,
	Tabs,
	Tab,
} from "@heroui/react";
import {
	Add,
	Search,
	Filter,
	MoreVert,
	Delete,
	Edit,
	Visibility,
	VisibilityOff,
	Launch,
	Code,
	Star,
	GitHub,
	Language,
	DateRange,
	TrendingUp,
	Work,
} from "@mui/icons-material";
import { AdminLayout, StatsGrid } from "@/Components/Admin";
import { useAccountSwitcher } from "@/Hooks/useAccountSwitcher";

interface Project {
	id: string;
	title: string;
	description: string;
	fullDescription: string;
	thumbnail: string;
	images: string[];
	technologies: string[];
	category: string;
	status: "active" | "completed" | "archived" | "draft";
	priority: "high" | "medium" | "low";
	featured: boolean;
	published: boolean;
	githubUrl?: string;
	liveUrl?: string;
	demoUrl?: string;
	startDate: Date;
	endDate?: Date;
	client?: string;
	teamMembers: string[];
	views: number;
	likes: number;
	createdAt: Date;
	updatedAt: Date;
}

// Mock data
const mockProjects: Project[] = [
	{
		id: "1",
		title: "E-Commerce Platform",
		description: "Modern full-stack e-commerce solution with Next.js and Stripe",
		fullDescription: "A complete e-commerce platform built with Next.js, TypeScript, and Tailwind CSS. Features include user authentication, product catalog, shopping cart, payment processing with Stripe, order management, and admin dashboard.",
		thumbnail: "/projects/ecommerce-thumb.jpg",
		images: ["/projects/ecommerce-1.jpg", "/projects/ecommerce-2.jpg"],
		technologies: ["Next.js", "TypeScript", "Tailwind", "Stripe", "PostgreSQL"],
		category: "Web Development",
		status: "completed",
		priority: "high",
		featured: true,
		published: true,
		githubUrl: "https://github.com/user/ecommerce",
		liveUrl: "https://ecommerce-demo.com",
		startDate: new Date("2024-01-01"),
		endDate: new Date("2024-03-15"),
		client: "TechCorp Inc.",
		teamMembers: ["John Doe", "Jane Smith"],
		views: 1250,
		likes: 45,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-03-15"),
	},
	{
		id: "2",
		title: "Task Management App",
		description: "Collaborative task management with real-time updates",
		fullDescription: "A collaborative task management application with real-time synchronization, team collaboration features, project organization, and advanced filtering options.",
		thumbnail: "/projects/taskapp-thumb.jpg",
		images: ["/projects/taskapp-1.jpg"],
		technologies: ["React", "Node.js", "Socket.io", "MongoDB"],
		category: "Web Development",
		status: "active",
		priority: "medium",
		featured: false,
		published: true,
		githubUrl: "https://github.com/user/taskapp",
		liveUrl: "https://taskapp-demo.com",
		startDate: new Date("2024-02-01"),
		teamMembers: ["John Doe"],
		views: 850,
		likes: 32,
		createdAt: new Date("2024-02-01"),
		updatedAt: new Date("2024-06-15"),
	},
	{
		id: "3",
		title: "Mobile Weather App",
		description: "Cross-platform weather app with beautiful animations",
		fullDescription: "A cross-platform mobile weather application built with React Native, featuring beautiful weather animations, location-based forecasts, and offline data caching.",
		thumbnail: "/projects/weather-thumb.jpg",
		images: ["/projects/weather-1.jpg", "/projects/weather-2.jpg"],
		technologies: ["React Native", "Expo", "TypeScript", "Reanimated"],
		category: "Mobile Development",
		status: "completed",
		priority: "medium",
		featured: true,
		published: true,
		githubUrl: "https://github.com/user/weather-app",
		startDate: new Date("2023-11-01"),
		endDate: new Date("2024-01-15"),
		teamMembers: ["John Doe", "Mike Johnson"],
		views: 950,
		likes: 38,
		createdAt: new Date("2023-11-01"),
		updatedAt: new Date("2024-01-15"),
	},
	{
		id: "4",
		title: "AI Content Generator",
		description: "AI-powered content generation tool for marketers",
		fullDescription: "An AI-powered content generation platform that helps marketers create blog posts, social media content, and marketing copy using advanced language models.",
		thumbnail: "/projects/ai-content-thumb.jpg",
		images: ["/projects/ai-content-1.jpg"],
		technologies: ["Python", "FastAPI", "OpenAI", "React", "PostgreSQL"],
		category: "AI/ML",
		status: "draft",
		priority: "high",
		featured: false,
		published: false,
		githubUrl: "https://github.com/user/ai-content",
		startDate: new Date("2024-04-01"),
		teamMembers: ["John Doe", "Sarah Wilson"],
		views: 120,
		likes: 8,
		createdAt: new Date("2024-04-01"),
		updatedAt: new Date("2024-06-10"),
	},
];

const categories = ["All", "Web Development", "Mobile Development", "AI/ML", "Design", "Backend"];
const statuses = ["all", "active", "completed", "archived", "draft"];
const technologies = ["React", "Next.js", "TypeScript", "Node.js", "Python", "React Native", "Tailwind", "PostgreSQL", "MongoDB"];

export default function ProjectsPage() {
	const { currentAccount } = useAccountSwitcher();
	const [projects, setProjects] = useState<Project[]>(mockProjects);
	const [selectedProject, setSelectedProject] = useState<Project | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("All");
	const [selectedStatus, setSelectedStatus] = useState("all");
	const [editingProject, setEditingProject] = useState<Partial<Project>>({});

	const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
	const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
	const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
	const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();

	// Stats data
	const statsData = [
		{
			title: "Total Projects",
			value: projects.length.toString(),
			icon: <Work className="w-6 h-6" />,
			color: "primary" as const,
		},
		{
			title: "Published",
			value: projects.filter(p => p.published).length.toString(),
			icon: <Visibility className="w-6 h-6" />,
			color: "success" as const,
		},
		{
			title: "In Progress",
			value: projects.filter(p => p.status === "active").length.toString(),
			icon: <TrendingUp className="w-6 h-6" />,
			color: "warning" as const,
		},
		{
			title: "Total Views",
			value: projects.reduce((acc, p) => acc + p.views, 0).toLocaleString(),
			icon: <Visibility className="w-6 h-6" />,
			color: "secondary" as const,
		},
	];

	// Filter projects
	const filteredProjects = projects.filter(project => {
		const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
							 project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
							 project.technologies.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()));
		const matchesCategory = selectedCategory === "All" || project.category === selectedCategory;
		const matchesStatus = selectedStatus === "all" || project.status === selectedStatus;
		
		return matchesSearch && matchesCategory && matchesStatus;
	});

	function getStatusColor(status: string) {
		switch (status) {
			case "active": return "warning";
			case "completed": return "success";
			case "archived": return "default";
			case "draft": return "secondary";
			default: return "default";
		}
	}

	function getPriorityColor(priority: string) {
		switch (priority) {
			case "high": return "danger";
			case "medium": return "warning";
			case "low": return "success";
			default: return "default";
		}
	}

	const handleCreateProject = useCallback(() => {
		const newProject: Project = {
			id: Date.now().toString(),
			title: editingProject.title || "",
			description: editingProject.description || "",
			fullDescription: editingProject.fullDescription || "",
			thumbnail: editingProject.thumbnail || "",
			images: editingProject.images || [],
			technologies: editingProject.technologies || [],
			category: editingProject.category || "Web Development",
			status: editingProject.status || "draft",
			priority: editingProject.priority || "medium",
			featured: editingProject.featured || false,
			published: editingProject.published || false,
			githubUrl: editingProject.githubUrl,
			liveUrl: editingProject.liveUrl,
			demoUrl: editingProject.demoUrl,
			startDate: editingProject.startDate || new Date(),
			endDate: editingProject.endDate,
			client: editingProject.client,
			teamMembers: editingProject.teamMembers || [],
			views: 0,
			likes: 0,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		setProjects(prev => [newProject, ...prev]);
		setEditingProject({});
		onCreateClose();
	}, [editingProject, onCreateClose]);

	const handleEditProject = useCallback(() => {
		if (!selectedProject) return;

		setProjects(prev => prev.map(project => 
			project.id === selectedProject.id 
				? { ...project, ...editingProject, updatedAt: new Date() }
				: project
		));
		setEditingProject({});
		onEditClose();
	}, [selectedProject, editingProject, onEditClose]);

	const handleDeleteProject = useCallback(() => {
		if (!selectedProject) return;

		setProjects(prev => prev.filter(project => project.id !== selectedProject.id));
		setSelectedProject(null);
		onDeleteClose();
	}, [selectedProject, onDeleteClose]);

	const openEditModal = (project: Project) => {
		setSelectedProject(project);
		setEditingProject(project);
		onEditOpen();
	};

	const openViewModal = (project: Project) => {
		setSelectedProject(project);
		onViewOpen();
	};

	const openDeleteModal = (project: Project) => {
		setSelectedProject(project);
		onDeleteOpen();
	};

	const ProjectForm = () => (
		<div className="space-y-4">
			<Input
				label="Title"
				value={editingProject.title || ""}
				onValueChange={(value) => setEditingProject(prev => ({ ...prev, title: value }))}
				isRequired
			/>
			<Textarea
				label="Description"
				value={editingProject.description || ""}
				onValueChange={(value) => setEditingProject(prev => ({ ...prev, description: value }))}
				rows={3}
				isRequired
			/>
			<Textarea
				label="Full Description"
				value={editingProject.fullDescription || ""}
				onValueChange={(value) => setEditingProject(prev => ({ ...prev, fullDescription: value }))}
				rows={5}
			/>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Select
					label="Category"
					selectedKeys={editingProject.category ? [editingProject.category] : []}
					onSelectionChange={(keys) => 
						setEditingProject(prev => ({ ...prev, category: Array.from(keys)[0] as string }))
					}
				>
					{categories.slice(1).map(category => (
						<SelectItem key={category}>{category}</SelectItem>
					))}
				</Select>
				<Select
					label="Status"
					selectedKeys={editingProject.status ? [editingProject.status] : []}
					onSelectionChange={(keys) => 
						setEditingProject(prev => ({ ...prev, status: Array.from(keys)[0] as Project["status"] }))
					}
				>
					{statuses.slice(1).map(status => (
						<SelectItem key={status}>{status}</SelectItem>
					))}
				</Select>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Input
					label="GitHub URL"
					value={editingProject.githubUrl || ""}
					onValueChange={(value) => setEditingProject(prev => ({ ...prev, githubUrl: value }))}
				/>
				<Input
					label="Live URL"
					value={editingProject.liveUrl || ""}
					onValueChange={(value) => setEditingProject(prev => ({ ...prev, liveUrl: value }))}
				/>
				<Input
					label="Demo URL"
					value={editingProject.demoUrl || ""}
					onValueChange={(value) => setEditingProject(prev => ({ ...prev, demoUrl: value }))}
				/>
			</div>
			<div className="flex gap-4">
				<Switch
					isSelected={editingProject.featured || false}
					onValueChange={(value) => setEditingProject(prev => ({ ...prev, featured: value }))}
				>
					Featured Project
				</Switch>
				<Switch
					isSelected={editingProject.published || false}
					onValueChange={(value) => setEditingProject(prev => ({ ...prev, published: value }))}
				>
					Published
				</Switch>
			</div>
		</div>
	);

	return (
		<AdminLayout>
			<div className="p-6 space-y-6">
				{/* Page Header */}
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-foreground">Projects & Portfolio</h1>
							<p className="text-default-500">Manage your projects and portfolio showcase</p>
						</div>
						<Button
							color="primary"
							startContent={<Add />}
							onPress={() => {
								setEditingProject({});
								onCreateOpen();
							}}
						>
							Add Project
						</Button>
					</div>
				</div>

				{/* Stats Grid */}
				<StatsGrid stats={statsData} columns={4} />

				{/* Filters */}
				<Card>
					<CardBody>
						<div className="flex flex-col sm:flex-row gap-4">
							<Input
								placeholder="Search projects..."
								startContent={<Search className="w-4 h-4" />}
								value={searchTerm}
								onValueChange={setSearchTerm}
								className="flex-1"
							/>
							<Select
								placeholder="Category"
								selectedKeys={[selectedCategory]}
								onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
								className="w-48"
							>
								{categories.map(category => (
									<SelectItem key={category}>{category}</SelectItem>
								))}
							</Select>							<Select
								placeholder="Status"
								selectedKeys={[selectedStatus]}
								onSelectionChange={(keys) => setSelectedStatus(Array.from(keys)[0] as string)}
								className="w-40"
							>
								<SelectItem key="all">All Status</SelectItem>
								<SelectItem key="active">Active</SelectItem>
								<SelectItem key="completed">Completed</SelectItem>
								<SelectItem key="archived">Archived</SelectItem>
								<SelectItem key="draft">Draft</SelectItem>
							</Select>
						</div>
					</CardBody>
				</Card>

				{/* Projects Table */}
				<Card>
					<Table aria-label="Projects table">
						<TableHeader>
							<TableColumn>PROJECT</TableColumn>
							<TableColumn>CATEGORY</TableColumn>
							<TableColumn>STATUS</TableColumn>
							<TableColumn>PRIORITY</TableColumn>
							<TableColumn>TECHNOLOGIES</TableColumn>
							<TableColumn>VIEWS</TableColumn>
							<TableColumn>ACTIONS</TableColumn>
						</TableHeader>
						<TableBody>
							{filteredProjects.map((project) => (
								<TableRow key={project.id}>
									<TableCell>
										<div className="flex items-center gap-3">
											<div className="w-12 h-12 bg-default-100 rounded-lg overflow-hidden">
												{project.thumbnail ? (
													<Image
														src={project.thumbnail}
														alt={project.title}
														className="w-full h-full object-cover"
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center">
														<Work className="w-6 h-6 text-default-400" />
													</div>
												)}
											</div>
											<div>
												<p className="font-medium">{project.title}</p>
												<p className="text-sm text-default-500 truncate max-w-xs">
													{project.description}
												</p>
												<div className="flex items-center gap-2 mt-1">
													{project.featured && (
														<Chip size="sm" color="warning" variant="flat">
															<Star className="w-3 h-3 mr-1" />
															Featured
														</Chip>
													)}
													{project.published ? (
														<Chip size="sm" color="success" variant="flat">
															Published
														</Chip>
													) : (
														<Chip size="sm" color="default" variant="flat">
															Draft
														</Chip>
													)}
												</div>
											</div>
										</div>
									</TableCell>
									<TableCell>
										<Chip size="sm" variant="flat">
											{project.category}
										</Chip>
									</TableCell>
									<TableCell>
										<Chip
											size="sm"
											color={getStatusColor(project.status)}
											variant="flat"
										>
											{project.status}
										</Chip>
									</TableCell>
									<TableCell>
										<Chip
											size="sm"
											color={getPriorityColor(project.priority)}
											variant="flat"
										>
											{project.priority}
										</Chip>
									</TableCell>
									<TableCell>
										<div className="flex flex-wrap gap-1 max-w-xs">
											{project.technologies.slice(0, 3).map((tech, index) => (
												<Chip key={index} size="sm" variant="flat">
													{tech}
												</Chip>
											))}
											{project.technologies.length > 3 && (
												<Chip size="sm" variant="flat">
													+{project.technologies.length - 3}
												</Chip>
											)}
										</div>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<Visibility className="w-4 h-4 text-default-400" />
											<span>{project.views}</span>
										</div>
									</TableCell>
									<TableCell>
										<Dropdown>
											<DropdownTrigger>
												<Button isIconOnly size="sm" variant="light">
													<MoreVert className="w-4 h-4" />
												</Button>
											</DropdownTrigger>											<DropdownMenu>
												<DropdownItem
													key="view"
													startContent={<Visibility className="w-4 h-4" />}
													onPress={() => openViewModal(project)}
												>
													View Details
												</DropdownItem>
												<DropdownItem
													key="edit"
													startContent={<Edit className="w-4 h-4" />}
													onPress={() => openEditModal(project)}
												>
													Edit
												</DropdownItem>
												<DropdownItem
													key="github"
													startContent={<GitHub className="w-4 h-4" />}
													onPress={() => project.githubUrl && window.open(project.githubUrl, "_blank")}
													className={!project.githubUrl ? "opacity-50" : ""}
												>
													GitHub
												</DropdownItem>
												<DropdownItem
													key="live"
													startContent={<Launch className="w-4 h-4" />}
													onPress={() => project.liveUrl && window.open(project.liveUrl, "_blank")}
													className={!project.liveUrl ? "opacity-50" : ""}
												>
													Live Demo
												</DropdownItem>
												<DropdownItem
													key="delete"
													startContent={<Delete className="w-4 h-4" />}
													className="text-danger"
													color="danger"
													onPress={() => openDeleteModal(project)}
												>
													Delete
												</DropdownItem>
											</DropdownMenu>
										</Dropdown>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</Card>

				{/* Create Project Modal */}
				<Modal isOpen={isCreateOpen} onClose={onCreateClose} size="3xl" scrollBehavior="inside">
					<ModalContent>
						<ModalHeader>Create New Project</ModalHeader>
						<ModalBody>
							<ProjectForm />
						</ModalBody>
						<ModalFooter>
							<Button variant="light" onPress={onCreateClose}>
								Cancel
							</Button>
							<Button color="primary" onPress={handleCreateProject}>
								Create Project
							</Button>
						</ModalFooter>
					</ModalContent>
				</Modal>

				{/* Edit Project Modal */}
				<Modal isOpen={isEditOpen} onClose={onEditClose} size="3xl" scrollBehavior="inside">
					<ModalContent>
						<ModalHeader>Edit Project</ModalHeader>
						<ModalBody>
							<ProjectForm />
						</ModalBody>
						<ModalFooter>
							<Button variant="light" onPress={onEditClose}>
								Cancel
							</Button>
							<Button color="primary" onPress={handleEditProject}>
								Save Changes
							</Button>
						</ModalFooter>
					</ModalContent>
				</Modal>

				{/* View Project Modal */}
				<Modal isOpen={isViewOpen} onClose={onViewClose} size="4xl" scrollBehavior="inside">
					<ModalContent>
						<ModalHeader>
							<div className="flex items-center gap-3">
								<div className="w-8 h-8 bg-default-100 rounded-lg overflow-hidden">
									{selectedProject?.thumbnail ? (
										<Image
											src={selectedProject.thumbnail}
											alt={selectedProject.title}
											className="w-full h-full object-cover"
										/>
									) : (
										<Work className="w-5 h-5 text-default-400 m-1.5" />
									)}
								</div>
								{selectedProject?.title}
							</div>
						</ModalHeader>
						<ModalBody>
							{selectedProject && (
								<div className="space-y-6">
									{/* Project Info */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<h4 className="font-semibold mb-2">Description</h4>
											<p className="text-default-600">{selectedProject.fullDescription}</p>
										</div>
										<div className="space-y-4">
											<div>
												<h4 className="font-semibold mb-2">Project Details</h4>
												<div className="space-y-2">
													<div className="flex justify-between">
														<span>Category:</span>
														<Chip size="sm" variant="flat">{selectedProject.category}</Chip>
													</div>
													<div className="flex justify-between">
														<span>Status:</span>
														<Chip size="sm" color={getStatusColor(selectedProject.status)} variant="flat">
															{selectedProject.status}
														</Chip>
													</div>
													<div className="flex justify-between">
														<span>Priority:</span>
														<Chip size="sm" color={getPriorityColor(selectedProject.priority)} variant="flat">
															{selectedProject.priority}
														</Chip>
													</div>
													<div className="flex justify-between">
														<span>Views:</span>
														<span>{selectedProject.views}</span>
													</div>
													<div className="flex justify-between">
														<span>Likes:</span>
														<span>{selectedProject.likes}</span>
													</div>
												</div>
											</div>
										</div>
									</div>

									{/* Technologies */}
									<div>
										<h4 className="font-semibold mb-2">Technologies</h4>
										<div className="flex flex-wrap gap-2">
											{selectedProject.technologies.map((tech, index) => (
												<Chip key={index} size="sm" variant="flat" color="primary">
													{tech}
												</Chip>
											))}
										</div>
									</div>

									{/* Links */}
									{(selectedProject.githubUrl || selectedProject.liveUrl || selectedProject.demoUrl) && (
										<div>
											<h4 className="font-semibold mb-2">Links</h4>
											<div className="flex gap-2">
												{selectedProject.githubUrl && (
													<Button
														as={Link}
														href={selectedProject.githubUrl}
														target="_blank"
														size="sm"
														variant="flat"
														startContent={<GitHub className="w-4 h-4" />}
													>
														GitHub
													</Button>
												)}
												{selectedProject.liveUrl && (
													<Button
														as={Link}
														href={selectedProject.liveUrl}
														target="_blank"
														size="sm"
														variant="flat"
														startContent={<Launch className="w-4 h-4" />}
													>
														Live Demo
													</Button>
												)}
											</div>
										</div>
									)}

									{/* Timeline */}
									<div>
										<h4 className="font-semibold mb-2">Timeline</h4>
										<div className="space-y-1">
											<div className="flex justify-between">
												<span>Started:</span>
												<span>{selectedProject.startDate.toLocaleDateString()}</span>
											</div>
											{selectedProject.endDate && (
												<div className="flex justify-between">
													<span>Completed:</span>
													<span>{selectedProject.endDate.toLocaleDateString()}</span>
												</div>
											)}
											<div className="flex justify-between">
												<span>Last Updated:</span>
												<span>{selectedProject.updatedAt.toLocaleDateString()}</span>
											</div>
										</div>
									</div>
								</div>
							)}
						</ModalBody>
						<ModalFooter>
							<Button variant="light" onPress={onViewClose}>
								Close
							</Button>
							{selectedProject && (
								<Button
									color="primary"
									onPress={() => {
										onViewClose();
										openEditModal(selectedProject);
									}}
								>
									Edit Project
								</Button>
							)}
						</ModalFooter>
					</ModalContent>
				</Modal>

				{/* Delete Confirmation Modal */}
				<Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
					<ModalContent>
						<ModalHeader>Delete Project</ModalHeader>
						<ModalBody>
							<p>Are you sure you want to delete &quot;{selectedProject?.title}&quot;? This action cannot be undone.</p>
						</ModalBody>
						<ModalFooter>
							<Button variant="light" onPress={onDeleteClose}>
								Cancel
							</Button>
							<Button color="danger" onPress={handleDeleteProject}>
								Delete Project
							</Button>
						</ModalFooter>
					</ModalContent>
				</Modal>
			</div>
		</AdminLayout>
	);
}
