"use client";

import React from "react";

import ModernHero from "../Components/NewLanding/ModernHero";
import {
    ProjectsSection,
    SkillsSection,
    ExperienceSection
} from "../Components/NewLanding/LandingSections";

export default function HomePage() {
    return (
        <div className="min-h-screen">
            <ModernHero />
            <ProjectsSection />
            <SkillsSection />
            <ExperienceSection />
        </div>
    );
}
