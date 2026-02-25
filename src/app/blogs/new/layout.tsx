import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "New Blog Post | Meet Bhingradiya",
    description: "Create a new blog post.",
    robots: { index: false, follow: false }
};

export default function NewBlogLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
