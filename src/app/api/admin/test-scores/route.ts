import { NextRequest } from "next/server";
import { TestScore_Model } from "@/Models/Portfolio";
import { adminGetAll, adminCreate } from "@/Utils/adminCrud";

export async function GET(req: NextRequest) {
    return adminGetAll(req, TestScore_Model, {
        searchFields: ["ExamName", "ExamType", "Subject"],
        defaultSort: { Order: 1, Year: -1 }
    });
}

export async function POST(req: NextRequest) {
    return adminCreate(req, TestScore_Model, ["test-scores", "all-test-scores"]);
}
