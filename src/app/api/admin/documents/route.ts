import { NextRequest } from "next/server";
import { Document_Model } from "@/Models/Portfolio";
import { adminGetAll, adminCreate } from "@/Utils/adminCrud";

export async function GET(req: NextRequest) {
    return adminGetAll(req, Document_Model, {
        searchFields: ["Title", "Description", "Slug", "AccessEmails", "AccessAccounts"],
        defaultSort: { Order: 1, createdAt: -1 }
    });
}

export async function POST(req: NextRequest) {
    return adminCreate(req, Document_Model, ["documents", "all-documents"]);
}
