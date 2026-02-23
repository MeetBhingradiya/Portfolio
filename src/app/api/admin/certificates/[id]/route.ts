import { NextRequest } from "next/server";
import { Certificate_Model } from "@/Models/Portfolio";
import { adminUpdate, adminDelete } from "@/Utils/adminCrud";

const TAGS = ["certificates", "all-certificates"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return adminUpdate(req, Certificate_Model, "CertificateID", id, TAGS);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return adminDelete(req, Certificate_Model, "CertificateID", id, TAGS);
}
