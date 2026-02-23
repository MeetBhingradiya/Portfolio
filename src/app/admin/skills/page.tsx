"use client";
import AdminCRUDPage, { FieldDef } from "../AdminCRUDPage";

const fields: FieldDef[] = [
    { key: "Name", label: "Name", type: "text", required: true },
    { key: "Category", label: "Category", type: "select", required: true,
      options: ["languages","frameworks","databases","devops","cloud","tools","design","soft_skills","other"] },
    { key: "Proficiency", label: "Proficiency (%)", type: "number", required: true },
    { key: "YearsOfExperience", label: "Years of Experience", type: "number" },
    { key: "Icon", label: "Icon", type: "cdn-image", cdnType: "icon", cdnContext: "skill", tableVisible: true },
    { key: "Color", label: "Color (hex)", type: "text", tableVisible: false },
    { key: "Order", label: "Order", type: "number" },
    { key: "Visible", label: "Visible", type: "boolean" },
];

export default function SkillsPage() {
    return (
        <AdminCRUDPage
            title="Skills"
            subtitle="Manage technical and soft skills with proficiency levels"
            apiBase="/api/admin/skills"
            idField="SkillID"
            fields={fields}
            defaultValues={{ Proficiency: 80, Order: 0, Visible: true }}
        />
    );
}
