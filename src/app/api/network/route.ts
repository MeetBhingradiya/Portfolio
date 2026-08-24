import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import { NetworkDomain } from "@Models/NetworkDomain";

// GET: Fetch all network domains
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);

        // Fetch all, as network domains are public
        const domains = await NetworkDomain.find({})
            .sort({ createdAt: -1 })
            .lean();

        // Pass isAdmin to frontend so it knows whether to show edit controls
        const canManage = user?.isAdmin || user?.effectivePermissions.has("Admin.Network.Manage") || false;
        return NextResponse.json({ success: true, data: domains, isAdmin: canManage }, { status: 200 });
    } catch (err) {
        console.error("GET /api/network:", err);
        return NextResponse.json({ success: false, error: "Failed to fetch network domains" }, { status: 500 });
    }
}

// POST: Create a new network domain
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        
        const canManage = user?.isAdmin || user?.effectivePermissions.has("Admin.Network.Manage");
        if (!canManage) {
            return NextResponse.json({ success: false, error: "Unauthorized. Permission Admin.Network.Manage required." }, { status: 403 });
        }

        const body = await req.json();
        const { name, domain, description, icon, enabled, type } = body;

        if (!name?.trim() || !domain?.trim()) {
            return NextResponse.json({ success: false, error: "Name and Domain are required" }, { status: 400 });
        }

        const networkDomain = await NetworkDomain.create({
            name: name.trim(),
            domain: domain.trim().toLowerCase(),
            description: description?.trim(),
            icon: icon?.trim(),
            enabled: enabled !== undefined ? enabled : true,
            type: type || "domain",
        });

        return NextResponse.json({ success: true, data: networkDomain }, { status: 201 });
    } catch (err) {
        console.error("POST /api/network:", err);
        return NextResponse.json({ success: false, error: "Failed to create network domain" }, { status: 500 });
    }
}
