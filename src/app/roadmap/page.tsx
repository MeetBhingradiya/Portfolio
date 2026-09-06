import { Config } from "@Config/Client";
import type { Metadata } from "next";
import RoadmapView from "@Components/Organisms/Roadmap/RoadmapView";

export const revalidate = 3600; // 1 hour ISR

export const metadata: Metadata = {
    title: "Roadmap | Meet Bhingradiya",
    description: "Feature roadmap and changelog. See what's planned and what's recently been completed.",
    alternates: { canonical: `${Config.Origin}/roadmap` }
};

export default async function RoadmapPage() {
    let planned = [];
    let completed = [];
    
    try {
        const res = await fetch(`${Config.Origin}/api/roadmap`, { next: { revalidate: 3600 } });
        const json = await res.json();
        if (json.success) {
            planned = json.data.planned || [];
            completed = json.data.completed || [];
        }
    } catch (e) {
        console.error("Failed to fetch roadmap", e);
    }

    return <RoadmapView planned={planned} completed={completed} />;
}
