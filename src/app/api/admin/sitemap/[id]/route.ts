import { NextRequest } from "next/server";
import { SitemapEntry_Model } from "@/Models/Portfolio";
import { adminUpdate, adminDelete } from "@/Utils/adminCrud";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return adminUpdate(req, SitemapEntry_Model, "SitemapID", id);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return adminDelete(req, SitemapEntry_Model, "SitemapID", id);
}
