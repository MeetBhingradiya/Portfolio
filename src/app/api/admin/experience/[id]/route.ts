import { NextRequest } from "next/server";
import { Experience_Model } from "@/Models/Portfolio";
import { adminUpdate, adminDelete } from "@/Utils/adminCrud";

const TAGS = ["experience", "all-experience"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return adminUpdate(req, Experience_Model, "ExperienceID", id, TAGS);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return adminDelete(req, Experience_Model, "ExperienceID", id, TAGS);
}
