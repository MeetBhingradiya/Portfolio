"use client";
import AdminCRUDPage, { FieldDef } from "../AdminCRUDPage";

const fields: FieldDef[] = [
    { key: "Title", label: "Title", type: "text", required: true, colSpan: 2 },
    { key: "Slug", label: "Slug", type: "text", required: true, placeholder: "my-project-slug" },
    { key: "Type", label: "Type", type: "select", options: ["website","webapp","chrome_extension","npm_package","playstore_app","github_repo","other"], required: true },
    { key: "Status", label: "Status", type: "select", options: ["active","archived","wip"], required: true },
    { key: "Description", label: "Description", type: "textarea", required: true, colSpan: 2 },
    { key: "LongDescription", label: "Long Description", type: "textarea", colSpan: 2, tableVisible: false },
    { key: "TechStack", label: "Tech Stack", type: "tags", colSpan: 2 },
    { key: "Tags", label: "Tags", type: "tags", colSpan: 2, tableVisible: false },
    { key: "Links.live", label: "Live URL", type: "url", tableVisible: false },
    { key: "Links.github", label: "GitHub URL", type: "url", tableVisible: false },
    { key: "Links.npm", label: "npm URL", type: "url", tableVisible: false },
    { key: "Links.chromeWebstore", label: "Chrome Web Store URL", type: "url", tableVisible: false },
    { key: "Links.playstore", label: "Play Store URL", type: "url", tableVisible: false },
    { key: "Links.demo", label: "Demo URL", type: "url", tableVisible: false },
    // Media
    { key: "Thumbnail", label: "Thumbnail", type: "cdn-image", cdnType: "banner", cdnContext: "project", tableVisible: true },
    { key: "Icon", label: "Icon (128×128 square, e.g. Chrome extension)", type: "cdn-image", cdnType: "icon", cdnContext: "project", tableVisible: false },
    { key: "Screenshots", label: "Screenshots", type: "cdn-image-list", cdnType: "banner", cdnContext: "project", colSpan: 2, tableVisible: true },
    // Metadata
    { key: "Featured", label: "Featured", type: "boolean" },
    { key: "Published", label: "Published (visible on portfolio)", type: "boolean" },
    { key: "Order", label: "Order", type: "number" },
    { key: "StartDate", label: "Start Date", type: "date", tableVisible: false },
    { key: "EndDate", label: "End Date", type: "date", tableVisible: false },
];

export default function ProjectsPage() {
    return (
        <AdminCRUDPage
            title="Projects"
            subtitle="Manage portfolio projects — websites, apps, npm packages, Chrome extensions, and more"
            apiBase="/api/admin/projects"
            idField="ProjectID"
            fields={fields}
            defaultValues={{ Status: "active", Type: "webapp", Featured: false, Published: true, Order: 0, TechStack: [], Tags: [], Screenshots: [] }}
        />
    );
}
