"use client";

import React from "react";
import GitHubStyleHeader from "@Components/HomePage/Header";
import GitHubStyleHero from "@Components/HomePage/Hero";
import HorizontalShowcase from "@Components/HomePage/Showcase";
import BlogsSection from "@Components/HomePage/Blog";
import TechnologyGroups from "@Components/HomePage/TechnologyGroups";
import ContactSection from "@Components/HomePage/Contact";

export default function HomePage() {
	return (
		<div className="min-h-screen bg-white dark:bg-gray-900">
			{/* Header */}
			<GitHubStyleHeader />

			{/* Hero Section */}
			<GitHubStyleHero />

			{/* Horizontal Showcase */}
			<HorizontalShowcase />

			{/* Blogs Section */}
			<BlogsSection />

			{/* Technology Groups */}
			<TechnologyGroups />

			{/* Contact Section */}
			<ContactSection />
		</div>
	);
}
