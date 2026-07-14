"use client";
import AdminCRUDPage, { FieldDef } from "../AdminCRUDPage";

const fields: FieldDef[] = [
    { key: "Title", label: "Document Title", type: "text", required: true, colSpan: 2 },
    { key: "Slug", label: "Slug", type: "text", required: true, placeholder: "my-document-slug" },
    {
        key: "Privacy",
        label: "Privacy & Access",
        type: "select",
        options: ["public", "unlisted", "link_expiry", "email", "account"],
        required: true
    },
    {
        key: "Description",
        label: "Description",
        type: "textarea",
        colSpan: 2,
        tableVisible: false
    },
    {
        key: "Body",
        label: "Document Body",
        type: "textarea",
        colSpan: 2,
        tableVisible: false
    },
    {
        key: "CodeBlockMoveMode",
        label: "Code Block Move Mode",
        type: "select",
        options: ["dnd", "buttons", "both"],
        required: true,
        tableVisible: false
    },
    {
        key: "DefaultAlignment",
        label: "Default Alignment",
        type: "select",
        options: ["left", "center", "right", "justify"],
        required: true
    },
    {
        key: "LinkExpiresAt",
        label: "Link Expiry",
        type: "date",
        tableVisible: false
    },
    {
        key: "AccessEmails",
        label: "Allowed Emails",
        type: "tags",
        colSpan: 2,
        tableVisible: false
    },
    {
        key: "AccessAccounts",
        label: "Allowed Accounts",
        type: "tags",
        colSpan: 2,
        tableVisible: false
    },
    {
        key: "VerificationURL",
        label: "Verification URL",
        type: "url",
        colSpan: 2,
        tableVisible: false
    },
    {
        key: "VerificationQRCode",
        label: "Verification QR Code Image",
        type: "cdn-image",
        cdnType: "document",
        cdnContext: "verification",
        tableVisible: true
    },
    {
        key: "Attachments",
        label: "Attachments",
        type: "cdn-file-list",
        cdnType: "document",
        cdnContext: "attachment",
        colSpan: 2
    },
    { key: "Published", label: "Published", type: "boolean" }
];

export default function DocumentsPage() {
    return (
        <AdminCRUDPage
            title="Documents"
            subtitle="Manage reusable documents, privacy access, verification links, and code-block behavior"
            apiBase="/api/admin/documents"
            idField="DocumentID"
            fields={fields}
            defaultValues={{
                Privacy: "public",
                CodeBlockMoveMode: "both",
                DefaultAlignment: "left",
                AccessEmails: [],
                AccessAccounts: [],
                Attachments: [],
                Published: true
            }}
        />
    );
}
