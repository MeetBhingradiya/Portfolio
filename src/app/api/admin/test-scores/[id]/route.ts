import { NextRequest } from "next/server";
import { TestScore_Model } from "@/Models/Portfolio";
import { adminUpdate, adminDelete } from "@/Utils/adminCrud";

const TAGS = ["test-scores", "all-test-scores"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return adminUpdate(req, TestScore_Model, "TestScoreID", id, TAGS);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return adminDelete(req, TestScore_Model, "TestScoreID", id, TAGS);
}
