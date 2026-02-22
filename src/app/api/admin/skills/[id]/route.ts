import { NextRequest } from "next/server";
import { Skill_Model } from "@/Models/Portfolio";
import { adminUpdate, adminDelete } from "@/Utils/adminCrud";

const TAGS = ["skills", "all-skills"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return adminUpdate(req, Skill_Model, "SkillID", id, TAGS);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return adminDelete(req, Skill_Model, "SkillID", id, TAGS);
}
