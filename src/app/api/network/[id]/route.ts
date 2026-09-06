import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import { NetworkDomain } from "@Models/NetworkDomain";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);

        const canManage = user?.isAdmin || user?.effectivePermissions.has("Admin.Network.Manage");
        if (!canManage) {
            return NextResponse.json({ success: false, error: "Unauthorized. Permission Admin.Network.Manage required." }, { status: 403 });
        }

        const id = (await params).id;
        const body = await req.json();
        const { name, domain, description, icon, enabled, type } = body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim();
        if (domain !== undefined) updateData.domain = domain.trim().toLowerCase();
        if (description !== undefined) updateData.description = description.trim();
        if (icon !== undefined) updateData.icon = icon.trim();
        if (enabled !== undefined) updateData.enabled = enabled;
        if (type !== undefined) updateData.type = type;

        const updated = await NetworkDomain.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) {
            return NextResponse.json({ success: false, error: "Network domain not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updated }, { status: 200 });
    } catch (err) {
        console.error(`PUT /api/network/[id]:`, err);
        return NextResponse.json({ success: false, error: "Failed to update network domain" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);

        const canManage = user?.isAdmin || user?.effectivePermissions.has("Admin.Network.Manage");
        if (!canManage) {
            return NextResponse.json({ success: false, error: "Unauthorized. Permission Admin.Network.Manage required." }, { status: 403 });
        }

        const id = (await params).id;
        const deleted = await NetworkDomain.findByIdAndDelete(id);
        
        if (!deleted) {
            return NextResponse.json({ success: false, error: "Network domain not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: deleted }, { status: 200 });
    } catch (err) {
        console.error(`DELETE /api/network/[id]:`, err);
        return NextResponse.json({ success: false, error: "Failed to delete network domain" }, { status: 500 });
    }
}
