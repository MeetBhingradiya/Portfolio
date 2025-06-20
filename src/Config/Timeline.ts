import React from "react";

enum TimelineItemType {
    // ? CV & Resume Visible Items on PDF
    Experience = "Experience",
    Education = "Education",
    Project = "Project",

    // ? None CV & Resume Visible Items on PDF
    Certification = "Certification",
    Publication = "Publication",
    Award = "Award",
    Skill = "Skill",
    Volunteer = "Volunteer",
    Course = "Course",
    Technology = "Technology",
    Language = "Language"
}

interface ITimeline {
    // ? For Display on Site
    visiblity: boolean;

    // ? Human Readable Dates DD/MM/YYYY (INDIA) OR Month & Year
    Start?:
        | `${number}${number}-${number}${number}-${number}${number}${number}${number}`
        | `${number}${number}-${number}${number}`;
    isCurrent?: boolean;
    End?:
        | `${number}${number}-${number}${number}-${number}${number}${number}${number}`
        | `${number}${number}-${number}${number}`;

    ItemType: TimelineItemType;

    // ? Common Fields
    Title: string;
    Logo?: string | React.ReactElement;
    Description: string;
    Link?: string;

    // ? for Experience & Project
    Company?: string;
    CompanySocials?: Array<{
        icon: string | React.ReactElement;
        link: string;
    }>;
    Location?: {
        Map?: {
            lat: number;
            lng: number;
        };
        GoogleMapsLink?: string;
        Address?: string;
    };
    Role?: string;
    Technology?: string[];
    Projects?: TimelineItemType[]; // ? Restricted to Project Type Only
    Images?: string[];

    // ? for Education
    University?: string;
    UniversitySocials?: Array<{
        icon: string | React.ReactElement;
        link: string;
    }>;
    Specialization?: string;
    Grade?: string | number; // ? CGPA or Percentage

    // ? for Skill
    SkillID?: string; // ? Unique Premade Presets of Tools, Frameworks, etc.
    Proficiency?: number; // ? 0 to 100
    Category?: string; // ? Frontend, Backend, DevOps, etc.
}

const MyTimeline: ITimeline[] = [];

export { MyTimeline };
