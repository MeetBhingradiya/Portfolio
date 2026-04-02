"use client";
import AdminCRUDPage, { FieldDef } from "../AdminCRUDPage";

const fields: FieldDef[] = [
    { key: "Company", label: "Company", type: "text", required: true },
    { key: "Role", label: "Role / Title", type: "text", required: true },
    {
        key: "EmploymentType",
        label: "Employment Type",
        type: "select",
        required: true,
        options: ["full_time", "part_time", "contract", "freelance", "internship", "volunteer", "self_employed"]
    },
    {
        key: "LocationType",
        label: "Location Type",
        type: "select",
        options: ["onsite", "remote", "hybrid"]
    },
    { key: "StartDate", label: "Start Date", type: "date", required: true },
    { key: "EndDate", label: "End Date", type: "date" },
    { key: "CurrentlyWorking", label: "Currently Working", type: "boolean" },
    { key: "Location", label: "Location", type: "text" },
    {
        key: "Description",
        label: "Description",
        type: "textarea",
        colSpan: 2,
        tableVisible: false
    },
    {
        key: "Responsibilities",
        label: "Responsibilities",
        type: "tags",
        colSpan: 2,
        tableVisible: false
    },
    {
        key: "Achievements",
        label: "Achievements",
        type: "tags",
        colSpan: 2,
        tableVisible: false
    },
    {
        key: "TechStack",
        label: "Tech Stack",
        type: "tags",
        colSpan: 2,
        tableVisible: false
    },
    {
        key: "CompanyLogo",
        label: "Company Logo",
        type: "cdn-image",
        cdnType: "icon",
        cdnContext: "company",
        tableVisible: true
    },
    {
        key: "CompanyWebsite",
        label: "Company Website",
        type: "url",
        tableVisible: false
    },
    {
        key: "Published",
        label: "Published (visible on portfolio)",
        type: "boolean"
    },
    { key: "Order", label: "Order", type: "number" }
];

export default function ExperiencePage() {
    return (
        <AdminCRUDPage
            title="Experience"
            subtitle="Manage work experience, internships, and freelance projects"
            apiBase="/api/admin/experience"
            idField="ExperienceID"
            fields={fields}
            defaultValues={{
                EmploymentType: "full_time",
                LocationType: "onsite",
                CurrentlyWorking: false,
                Published: true,
                Order: 0,
                TechStack: [],
                Achievements: [],
                Responsibilities: []
            }}
        />
    );
}
