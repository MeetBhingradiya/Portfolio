import { NextRequest } from "next/server";
import { Experience_Model } from "@/Models/Portfolio";
import { adminGetAll, adminCreate } from "@/Utils/adminCrud";

export async function GET(req: NextRequest) {
    return adminGetAll(req, Experience_Model, {
        searchFields: ["Company", "Role", "TechStack"],
        defaultSort: { Order: 1, StartDate: -1 }
    });
}

export async function POST(req: NextRequest) {
    return adminCreate(req, Experience_Model, ["experience", "all-experience"]);
}
