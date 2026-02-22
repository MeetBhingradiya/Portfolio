"use client";
import AdminCRUDPage, { FieldDef } from "../AdminCRUDPage";

const fields: FieldDef[] = [
    { key: "Institution", label: "Institution", type: "text", required: true },
    { key: "Degree", label: "Degree", type: "text", required: true },
    { key: "FieldOfStudy", label: "Field of Study", type: "text", required: true },
    { key: "GradeType", label: "Grade Type", type: "select", options: ["percentage","cgpa","gpa","pass_fail"] },
    { key: "Grade", label: "Grade / Score", type: "text" },
    { key: "MaxGrade", label: "Max Grade", type: "text" },
    { key: "StartDate", label: "Start Date", type: "date", required: true },
    { key: "EndDate", label: "End Date", type: "date" },
    { key: "CurrentlyStudying", label: "Currently Studying", type: "boolean" },
    { key: "Location", label: "Location", type: "text" },
    { key: "Description", label: "Description", type: "textarea", colSpan: 2, tableVisible: false },
    { key: "Achievements", label: "Achievements", type: "tags", colSpan: 2, tableVisible: false },
    { key: "Logo", label: "Institution Logo URL", type: "url", tableVisible: false },
    { key: "Order", label: "Order", type: "number" },
];

export default function EducationPage() {
    return (
        <AdminCRUDPage
            title="Education"
            subtitle="Manage academic qualifications and achievements"
            apiBase="/api/admin/education"
            idField="EducationID"
            fields={fields}
            defaultValues={{ GradeType: "percentage", CurrentlyStudying: false, Order: 0, Achievements: [] }}
        />
    );
}
