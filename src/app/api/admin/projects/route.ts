import { NextRequest } from "next/server";
import { Project_Model } from "@/Models/Portfolio";
import { adminGetAll, adminCreate } from "@/Utils/adminCrud";

export async function GET(req: NextRequest) {
    return adminGetAll(req, Project_Model, {
        searchFields: ["Title", "Description", "TechStack", "Tags"],
        defaultSort: { Order: 1, createdAt: -1 }
    });
}

export async function POST(req: NextRequest) {
    return adminCreate(req, Project_Model, ["projects", "all-projects", "featured-projects"]);
}
