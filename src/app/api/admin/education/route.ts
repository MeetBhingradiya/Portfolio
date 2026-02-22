import { NextRequest } from "next/server";
import { Education_Model } from "@/Models/Portfolio";
import { adminGetAll, adminCreate } from "@/Utils/adminCrud";

export async function GET(req: NextRequest) {
    return adminGetAll(req, Education_Model, {
        searchFields: ["Institution", "Degree", "FieldOfStudy"],
        defaultSort: { Order: 1, StartDate: -1 }
    });
}

export async function POST(req: NextRequest) {
    return adminCreate(req, Education_Model, ["education", "all-education"]);
}
