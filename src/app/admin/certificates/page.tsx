"use client";
import AdminCRUDPage, { FieldDef } from "../AdminCRUDPage";

const fields: FieldDef[] = [
    { key: "Title", label: "Certificate Title", type: "text", required: true, colSpan: 2 },
    { key: "IssuingOrganization", label: "Issuing Organization", type: "text", required: true },
    { key: "IssuedDate", label: "Issued Date", type: "date", required: true },
    { key: "ExpiryDate", label: "Expiry Date", type: "date" },
    { key: "NoExpiry", label: "No Expiry", type: "boolean" },
    { key: "CredentialID", label: "Credential ID", type: "text" },
    { key: "CredentialURL", label: "Credential URL", type: "url", colSpan: 2 },
    { key: "Description", label: "Description", type: "textarea", colSpan: 2, tableVisible: false },
    { key: "Skills", label: "Skills", type: "tags", colSpan: 2, tableVisible: false },
    { key: "Image", label: "Certificate Image", type: "cdn-image", cdnType: "document", cdnContext: "cert", tableVisible: true },
    { key: "Logo", label: "Issuer Logo", type: "cdn-image", cdnType: "icon", cdnContext: "company", tableVisible: false },
    { key: "Order", label: "Order", type: "number" },
];

export default function CertificatesPage() {
    return (
        <AdminCRUDPage
            title="Certificates"
            subtitle="Manage certifications and credentials"
            apiBase="/api/admin/certificates"
            idField="CertificateID"
            fields={fields}
            defaultValues={{ NoExpiry: false, Order: 0, Skills: [] }}
        />
    );
}
