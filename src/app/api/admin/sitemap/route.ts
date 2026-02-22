import { NextRequest } from "next/server";
import { SitemapEntry_Model } from "@/Models/Portfolio";
import { adminGetAll, adminCreate } from "@/Utils/adminCrud";

export async function GET(req: NextRequest) {
    return adminGetAll(req, SitemapEntry_Model, {
        searchFields: ["Endpoint", "Group"],
        defaultSort: { Group: 1, Priority: -1 }
    });
}

export async function POST(req: NextRequest) {
    return adminCreate(req, SitemapEntry_Model);
}
