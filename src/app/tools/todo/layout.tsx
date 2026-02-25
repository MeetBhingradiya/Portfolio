import type { Metadata } from "next";
import { Config } from "@Config/Client";

export const metadata: Metadata = {
    title: "Todo List | Meet Bhingradiya Tools",
    description:
        "Minimal theme-adaptive todo list with drag-and-drop reordering and localStorage persistence. Manage your tasks directly in the browser — no account needed.",
    keywords: [
        "todo list app",
        "online todo list",
        "task manager online",
        "browser todo list",
        "drag and drop todo",
        "localStorage todo",
        "simple task list",
        "free todo app",
        "developer todo tool",
        "minimal todo list"
    ],
    alternates: { canonical: `${Config.Origin}/tools/todo` },
    openGraph: {
        type: "website",
        url: `${Config.Origin}/tools/todo`,
        title: "Todo List | Meet Bhingradiya Tools",
        description: "Minimal drag-and-drop todo list that saves in the browser — no account needed.",
        images: [{ url: "/assets/og-image.png", width: 1200, height: 630, alt: "Todo List Tool" }]
    },
    twitter: {
        card: "summary_large_image",
        title: "Todo List | Meet Bhingradiya Tools",
        description: "Minimal browser todo list with drag-and-drop and localStorage persistence.",
        images: ["/assets/og-image.png"]
    }
};

export default function TodoLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
