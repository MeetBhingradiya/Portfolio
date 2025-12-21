"use client";

import React from "react";

import HeroSection from "@Components/Organisms/Home/Hero";
// import {
//     ProjectsSection,
//     SkillsSection,
//     ExperienceSection
// } from "../Components/NewLanding/LandingSections";

export default function HomePage() {
    return (
        <div className="min-h-screen">
            <HeroSection />
            {/* <ProjectsSection />
            <SkillsSection />
            <ExperienceSection /> */}
        </div>
    );
}
