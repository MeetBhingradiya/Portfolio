"use client";
import AdminCRUDPage, { FieldDef } from "../AdminCRUDPage";

const fields: FieldDef[] = [
    { key: "Endpoint", label: "Endpoint URL", type: "text", required: true, colSpan: 2, placeholder: "/projects/my-project" },
    { key: "Priority", label: "Priority (0–1)", type: "number" },
    { key: "Frequency", label: "Change Frequency", type: "select", required: true,
      options: ["always","hourly","daily","weekly","monthly","yearly","never"] },
    { key: "Group", label: "Group", type: "text", placeholder: "projects / profiles / blogs" },
    { key: "Enabled", label: "Enabled", type: "boolean" },
    { key: "LastModified", label: "Last Modified", type: "date", tableVisible: false },
];

export default function SitemapPage() {
    return (
        <AdminCRUDPage
            title="Sitemap"
            subtitle="Manage sitemap entries for dynamic pages — profiles, projects, blogs, etc."
            apiBase="/api/admin/sitemap"
            idField="SitemapID"
            fields={fields}
            defaultValues={{ Priority: 0.5, Frequency: "weekly", Enabled: true }}
        />
    );
}
