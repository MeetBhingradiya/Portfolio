import { NextRequest } from "next/server";
import { Certificate_Model } from "@/Models/Portfolio";
import { adminGetAll, adminCreate } from "@/Utils/adminCrud";

export async function GET(req: NextRequest) {
    return adminGetAll(req, Certificate_Model, {
        searchFields: ["Title", "IssuingOrganization", "Skills"],
        defaultSort: { Order: 1, IssuedDate: -1 }
    });
}

export async function POST(req: NextRequest) {
    return adminCreate(req, Certificate_Model, ["certificates", "all-certificates"]);
}
