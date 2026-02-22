import { NextRequest } from "next/server";
import { Project_Model } from "@/Models/Portfolio";
import { adminUpdate, adminDelete } from "@/Utils/adminCrud";

const TAGS = ["projects", "all-projects", "featured-projects"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return adminUpdate(req, Project_Model, "ProjectID", id, TAGS);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return adminDelete(req, Project_Model, "ProjectID", id, TAGS);
}
