"use client";

import React, { useState } from "react";
import { HeroUIProvider } from "@heroui/react";
import AdminSidebar from "../Navigation/AdminSidebar";
import AdminTopBar from "../Navigation/AdminTopBar";
import { motion, AnimatePresence } from "framer-motion";

interface AdminLayoutProps {
	children: React.ReactNode;
	currentAccount?: any;
	pageTitle?: string;
	pageDescription?: string;
	breadcrumbs?: Array<{ label: string; href?: string }>;
	showSearchBar?: boolean;
	onRefresh?: () => void;
	isLoading?: boolean;
}

export default function AdminLayout({
	children,
	currentAccount,
	pageTitle,
	pageDescription,
	breadcrumbs,
	showSearchBar = true,
	onRefresh,
	isLoading = false,
}: AdminLayoutProps) {
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	return (
		<HeroUIProvider>
			<div className="flex h-screen bg-background">
				{/* Sidebar */}
				<AdminSidebar
					currentAccount={currentAccount}
					collapsed={sidebarCollapsed}
					onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
				/>

				{/* Main Content Area */}
				<div className="flex-1 flex flex-col overflow-hidden">
					{/* Top Bar */}
					<AdminTopBar
						currentAccount={currentAccount}
						onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
						sidebarCollapsed={sidebarCollapsed}
						showSearchBar={showSearchBar}
						onRefresh={onRefresh}
						isLoading={isLoading}
						pageTitle={pageTitle}
						pageDescription={pageDescription}
						breadcrumbs={breadcrumbs}
					/>

					{/* Page Content */}
					<main className="flex-1 overflow-auto bg-background">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4 }}
							className="h-full"
						>
							{children}
						</motion.div>
					</main>
				</div>
			</div>
		</HeroUIProvider>
	);
}
