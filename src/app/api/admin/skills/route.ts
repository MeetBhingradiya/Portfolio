import { NextRequest } from "next/server";
import { Skill_Model } from "@/Models/Portfolio";
import { adminGetAll, adminCreate } from "@/Utils/adminCrud";

export async function GET(req: NextRequest) {
    return adminGetAll(req, Skill_Model, {
        searchFields: ["Name", "Category"],
        defaultSort: { Order: 1, Proficiency: -1 }
    });
}

export async function POST(req: NextRequest) {
    return adminCreate(req, Skill_Model, ["skills", "all-skills"]);
}
