import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Todo List - Meet Bhingradiya",
    description:
        "Create, manage and save your tasks with this simple Todo List tool.",
    icons: "/favicon.ico",
    keywords: [
        "Meet Bhingradiya",
        "Meet",
        "Bhingradiya",
        "Portfolio",
        "Tools",
        "Todo List",
        "Task Manager",
        "To-do App",
        "Task List",
        "Task Tracker"
    ]
};

// @ File
export default function Layout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
