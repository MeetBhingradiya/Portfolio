"use client";

import React from "react";
import { Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { motion } from "framer-motion";

interface StatCardProps {
	title: string;
	value: string | number;
	icon: React.ReactNode;
	change?: {
		value: string | number;
		type: "increase" | "decrease" | "neutral";
		period?: string;
	};
	color?: "primary" | "secondary" | "success" | "warning" | "danger" | "default";
	description?: string;
	isLoading?: boolean;
}

interface StatsGridProps {
	stats: StatCardProps[];
	columns?: 2 | 3 | 4 | 5;
	className?: string;
}

export function StatCard({
	title,
	value,
	icon,
	change,
	color = "primary",
	description,
	isLoading = false,
}: StatCardProps) {
	const getChangeColor = (type: "increase" | "decrease" | "neutral") => {
		switch (type) {
			case "increase":
				return "success";
			case "decrease":
				return "danger";
			default:
				return "default";
		}
	};

	const getChangeIcon = (type: "increase" | "decrease" | "neutral") => {
		switch (type) {
			case "increase":
				return "↗";
			case "decrease":
				return "↘";
			default:
				return "→";
		}
	};

	return (
		<motion.div
			whileHover={{ y: -4, scale: 1.02 }}
			transition={{ duration: 0.2 }}
		>
			<Card className="w-full shadow-medium hover:shadow-large transition-all duration-200">
				<CardBody className="p-6">
					<div className="flex items-start justify-between mb-4">
						<div
							className={`p-3 rounded-xl bg-${color}/10 text-${color}`}
						>
							{icon}
						</div>
						{change && (
							<Chip
								size="sm"
								color={getChangeColor(change.type)}
								variant="flat"
								startContent={
									<span className="text-xs">
										{getChangeIcon(change.type)}
									</span>
								}
							>
								{change.value}
							</Chip>
						)}
					</div>
					
					<div className="space-y-2">
						<div className="space-y-1">
							{isLoading ? (
								<div className="h-8 bg-default-200 rounded animate-pulse" />
							) : (
								<h3 className="text-2xl font-bold text-foreground">
									{typeof value === "number"
										? value.toLocaleString()
										: value}
								</h3>
							)}
							<p className="text-sm text-foreground-500 font-medium">
								{title}
							</p>
						</div>
						
						{description && (
							<p className="text-xs text-foreground-400">
								{description}
							</p>
						)}
						
						{change?.period && (
							<p className="text-xs text-foreground-500">
								vs {change.period}
							</p>
						)}
					</div>
				</CardBody>
			</Card>
		</motion.div>
	);
}

export default function StatsGrid({
	stats,
	columns = 4,
	className = "",
}: StatsGridProps) {
	const gridCols = {
		2: "grid-cols-1 md:grid-cols-2",
		3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
		4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
		5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
	};

	return (
		<div className={`grid ${gridCols[columns]} gap-6 ${className}`}>
			{stats.map((stat, index) => (
				<motion.div
					key={`${stat.title}-${index}`}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: index * 0.1 }}
				>
					<StatCard {...stat} />
				</motion.div>
			))}
		</div>
	);
}
