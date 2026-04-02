"use client";
import AdminCRUDPage, { FieldDef } from "../AdminCRUDPage";

const fields: FieldDef[] = [
    { key: "ExamName", label: "Exam Name", type: "text", required: true },
    {
        key: "ExamType",
        label: "Exam Type",
        type: "select",
        required: true,
        options: ["gate", "ddcet", "jee", "cat", "gmat", "gre", "toefl", "ielts", "custom"]
    },
    { key: "Year", label: "Year", type: "number", required: true },
    { key: "Score", label: "Score", type: "text", required: true },
    { key: "MaxScore", label: "Max Score", type: "text" },
    { key: "Percentile", label: "Percentile", type: "number" },
    { key: "Rank", label: "Rank", type: "text" },
    { key: "Subject", label: "Subject / Stream", type: "text" },
    {
        key: "Description",
        label: "Description",
        type: "textarea",
        colSpan: 2,
        tableVisible: false
    },
    {
        key: "Proofs",
        label: "Proof Screenshot URLs",
        type: "tags",
        colSpan: 2,
        tableVisible: false
    },
    {
        key: "CertificateURL",
        label: "Certificate URL",
        type: "url",
        tableVisible: false
    },
    { key: "Order", label: "Order", type: "number" }
];

export default function TestScoresPage() {
    return (
        <AdminCRUDPage
            title="Test Scores"
            subtitle="Manage competitive exam scores and rankings (GATE, DDCET, JEE, etc.) with proof screenshots"
            apiBase="/api/admin/test-scores"
            idField="TestScoreID"
            fields={fields}
            defaultValues={{ ExamType: "custom", Order: 0, Proofs: [] }}
        />
    );
}
