import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tools Dashboard — Meet Bhingradiya",
    description: "Personal developer toolkit — QR, UUID, JWT, Colour, PDF, Markdown and more.",
    icons: "/favicon.ico",
    keywords: [
        "Tools",
        "Developer Tools",
        "QR Generator",
        "UUID",
        "JWT Debugger",
        "Colour Picker",
        "Password Generator",
        "Encrypt Decrypt",
        "JSON Formatter",
        "PDF Tools",
        "Markdown Preview"
    ]
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
