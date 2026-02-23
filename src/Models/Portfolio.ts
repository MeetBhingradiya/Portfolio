/**
 * Portfolio Models
 * Mongoose schemas for: Projects, Skills, Education, Experience,
 * Certificates, and Test Scores — powering the admin CRUD portal
 * and LinkedIn-style profile / Resume PDF generator.
 */

import mongoose, { Schema, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

/* ─────────────────────────── PROJECTS ─────────────────────────── */

export type ProjectType =
    | "website"
    | "webapp"
    | "chrome_extension"
    | "npm_package"
    | "playstore_app"
    | "github_repo"
    | "other";

export interface IProject extends Document {
    ProjectID: string;
    Title: string;
    Slug: string;
    Description: string;
    LongDescription?: string;
    Type: ProjectType;
    Status: "active" | "archived" | "wip";
    Featured: boolean;

    // Links
    Links: {
        live?: string;
        github?: string;
        npm?: string;
        chromeWebstore?: string;
        playstore?: string;
        documentation?: string;
        demo?: string;
    };

    // Tech stack
    TechStack: string[];
    Category?: string;
    Tags: string[];

    // Stats (manually maintained or fetched)
    Stats: {
        githubStars?: number;
        npmDownloads?: number;
        chromeInstalls?: number;
        playstoreInstalls?: number;
        playstoreRating?: number;
    };

    // Media
    Thumbnail?: string;
    Screenshots: string[];

    // Metadata
    StartDate?: Date;
    EndDate?: Date;
    Order: number;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
    {
        ProjectID: { type: String, default: uuidv4, unique: true, index: true },
        Title: { type: String, required: true, trim: true },
        Slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        Description: { type: String, required: true },
        LongDescription: { type: String },
        Type: {
            type: String,
            enum: ["website", "webapp", "chrome_extension", "npm_package", "playstore_app", "github_repo", "other"],
            default: "webapp"
        },
        Status: { type: String, enum: ["active", "archived", "wip"], default: "active" },
        Featured: { type: Boolean, default: false },
        Links: {
            live: String,
            github: String,
            npm: String,
            chromeWebstore: String,
            playstore: String,
            documentation: String,
            demo: String
        },
        TechStack: [{ type: String }],
        Category: { type: String },
        Tags: [{ type: String }],
        Stats: {
            githubStars: { type: Number, default: 0 },
            npmDownloads: { type: Number, default: 0 },
            chromeInstalls: { type: Number, default: 0 },
            playstoreInstalls: { type: Number, default: 0 },
            playstoreRating: { type: Number }
        },
        Thumbnail: { type: String },
        Screenshots: [{ type: String }],
        StartDate: { type: Date },
        EndDate: { type: Date },
        Order: { type: Number, default: 0 },
        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true, versionKey: false }
);

/* ─────────────────────────── SKILLS ─────────────────────────── */

export type SkillCategory =
    | "languages"
    | "frameworks"
    | "databases"
    | "devops"
    | "cloud"
    | "tools"
    | "design"
    | "soft_skills"
    | "other";

export interface ISkill extends Document {
    SkillID: string;
    Name: string;
    Category: SkillCategory;
    Proficiency: number; // 0–100
    YearsOfExperience?: number;
    Icon?: string; // URL or icon key
    Color?: string;
    Order: number;
    Visible: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const SkillSchema = new Schema<ISkill>(
    {
        SkillID: { type: String, default: uuidv4, unique: true, index: true },
        Name: { type: String, required: true, trim: true },
        Category: {
            type: String,
            enum: ["languages", "frameworks", "databases", "devops", "cloud", "tools", "design", "soft_skills", "other"],
            default: "other"
        },
        Proficiency: { type: Number, min: 0, max: 100, default: 80 },
        YearsOfExperience: { type: Number },
        Icon: { type: String },
        Color: { type: String },
        Order: { type: Number, default: 0 },
        Visible: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true, versionKey: false }
);

/* ─────────────────────────── EDUCATION ─────────────────────────── */

export interface IEducation extends Document {
    EducationID: string;
    Institution: string;
    Degree: string;
    FieldOfStudy: string;
    Grade?: string;
    MaxGrade?: string;
    GradeType: "percentage" | "cgpa" | "gpa" | "pass_fail";
    StartDate: Date;
    EndDate?: Date;
    CurrentlyStudying: boolean;
    Location?: string;
    Description?: string;
    Achievements: string[];
    Logo?: string;
    Order: number;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const EducationSchema = new Schema<IEducation>(
    {
        EducationID: { type: String, default: uuidv4, unique: true, index: true },
        Institution: { type: String, required: true, trim: true },
        Degree: { type: String, required: true, trim: true },
        FieldOfStudy: { type: String, required: true, trim: true },
        Grade: { type: String },
        MaxGrade: { type: String },
        GradeType: {
            type: String,
            enum: ["percentage", "cgpa", "gpa", "pass_fail"],
            default: "percentage"
        },
        StartDate: { type: Date, required: true },
        EndDate: { type: Date },
        CurrentlyStudying: { type: Boolean, default: false },
        Location: { type: String },
        Description: { type: String },
        Achievements: [{ type: String }],
        Logo: { type: String },
        Order: { type: Number, default: 0 },
        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true, versionKey: false }
);

/* ─────────────────────────── EXPERIENCE ─────────────────────────── */

export type EmploymentType =
    | "full_time"
    | "part_time"
    | "contract"
    | "freelance"
    | "internship"
    | "volunteer"
    | "self_employed";

export interface IExperience extends Document {
    ExperienceID: string;
    Company: string;
    Role: string;
    EmploymentType: EmploymentType;
    StartDate: Date;
    EndDate?: Date;
    CurrentlyWorking: boolean;
    Location?: string;
    LocationType: "onsite" | "remote" | "hybrid";
    Description?: string;
    Responsibilities: string[];
    Achievements: string[];
    TechStack: string[];
    CompanyLogo?: string;
    CompanyWebsite?: string;
    Order: number;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ExperienceSchema = new Schema<IExperience>(
    {
        ExperienceID: { type: String, default: uuidv4, unique: true, index: true },
        Company: { type: String, required: true, trim: true },
        Role: { type: String, required: true, trim: true },
        EmploymentType: {
            type: String,
            enum: ["full_time", "part_time", "contract", "freelance", "internship", "volunteer", "self_employed"],
            default: "full_time"
        },
        StartDate: { type: Date, required: true },
        EndDate: { type: Date },
        CurrentlyWorking: { type: Boolean, default: false },
        Location: { type: String },
        LocationType: {
            type: String,
            enum: ["onsite", "remote", "hybrid"],
            default: "onsite"
        },
        Description: { type: String },
        Responsibilities: [{ type: String }],
        Achievements: [{ type: String }],
        TechStack: [{ type: String }],
        CompanyLogo: { type: String },
        CompanyWebsite: { type: String },
        Order: { type: Number, default: 0 },
        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true, versionKey: false }
);

/* ─────────────────────────── CERTIFICATES ─────────────────────────── */

export interface ICertificate extends Document {
    CertificateID: string;
    Title: string;
    IssuingOrganization: string;
    IssuedDate: Date;
    ExpiryDate?: Date;
    NoExpiry: boolean;
    CredentialID?: string;
    CredentialURL?: string;
    Description?: string;
    Skills: string[];
    Image?: string;   // Certificate image URL
    Logo?: string;    // Issuer logo URL
    Order: number;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
    {
        CertificateID: { type: String, default: uuidv4, unique: true, index: true },
        Title: { type: String, required: true, trim: true },
        IssuingOrganization: { type: String, required: true, trim: true },
        IssuedDate: { type: Date, required: true },
        ExpiryDate: { type: Date },
        NoExpiry: { type: Boolean, default: false },
        CredentialID: { type: String },
        CredentialURL: { type: String },
        Description: { type: String },
        Skills: [{ type: String }],
        Image: { type: String },
        Logo: { type: String },
        Order: { type: Number, default: 0 },
        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true, versionKey: false }
);

/* ─────────────────────────── TEST SCORES ─────────────────────────── */

export type TestExamType = "gate" | "ddcet" | "jee" | "cat" | "gmat" | "gre" | "toefl" | "ielts" | "custom";

export interface ITestScore extends Document {
    TestScoreID: string;
    ExamName: string;
    ExamType: TestExamType;
    Score: string;
    MaxScore?: string;
    Percentile?: number;
    Rank?: string;
    Year: number;
    Subject?: string;
    Description?: string;
    Proofs: string[];   // Screenshot URLs on s3/cloudflare
    CertificateURL?: string;
    Order: number;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const TestScoreSchema = new Schema<ITestScore>(
    {
        TestScoreID: { type: String, default: uuidv4, unique: true, index: true },
        ExamName: { type: String, required: true, trim: true },
        ExamType: {
            type: String,
            enum: ["gate", "ddcet", "jee", "cat", "gmat", "gre", "toefl", "ielts", "custom"],
            default: "custom"
        },
        Score: { type: String, required: true },
        MaxScore: { type: String },
        Percentile: { type: Number, min: 0, max: 100 },
        Rank: { type: String },
        Year: { type: Number, required: true },
        Subject: { type: String },
        Description: { type: String },
        Proofs: [{ type: String }],
        CertificateURL: { type: String },
        Order: { type: Number, default: 0 },
        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true, versionKey: false }
);

/* ─────────────────── SITEMAP (src version) ──────────────────── */

export type SitemapFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

export interface ISitemapEntry extends Document {
    SitemapID: string;
    Endpoint: string;
    Priority: number;
    Frequency: SitemapFrequency;
    Enabled: boolean;
    Group?: string;   // e.g. "profiles", "projects", "blogs"
    LastModified?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const SitemapEntrySchema = new Schema<ISitemapEntry>(
    {
        SitemapID: { type: String, default: uuidv4, unique: true, index: true },
        Endpoint: { type: String, required: true, unique: true, trim: true },
        Priority: { type: Number, default: 0.5, min: 0, max: 1 },
        Frequency: {
            type: String,
            enum: ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"],
            default: "weekly"
        },
        Enabled: { type: Boolean, default: true },
        Group: { type: String },
        LastModified: { type: Date }
    },
    { timestamps: true, versionKey: false }
);

/* ─────────────────────── MODEL EXPORTS ─────────────────────── */

function getModel<T extends Document>(name: string, schema: Schema) {
    return (mongoose.models[name] as mongoose.Model<T>) ||
        mongoose.model<T>(name, schema);
}

export const Project_Model = () => getModel<IProject>("Project", ProjectSchema);
export const Skill_Model = () => getModel<ISkill>("Skill", SkillSchema);
export const Education_Model = () => getModel<IEducation>("Education", EducationSchema);
export const Experience_Model = () => getModel<IExperience>("Experience", ExperienceSchema);
export const Certificate_Model = () => getModel<ICertificate>("Certificate", CertificateSchema);
export const TestScore_Model = () => getModel<ITestScore>("TestScore", TestScoreSchema);
export const SitemapEntry_Model = () => getModel<ISitemapEntry>("SitemapEntry", SitemapEntrySchema);
