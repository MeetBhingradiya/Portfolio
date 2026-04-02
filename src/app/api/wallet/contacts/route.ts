/**
 * GET    /api/wallet/contacts          – list contacts
 * POST   /api/wallet/contacts          – create / update contact
 * DELETE /api/wallet/contacts?id=      – delete contact
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import { WalletContact } from "@Models/WalletContact";

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const search = req.nextUrl.searchParams.get("search");
        const query: Record<string, any> = { UserID: user.userId };
        if (search) {
            query.$or = [
                { Name: { $regex: search, $options: "i" } },
                { Relation: { $regex: search, $options: "i" } },
                { Phones: { $in: [new RegExp(search, "i")] } },
                { Emails: { $in: [new RegExp(search, "i")] } }
            ];
        }

        const contacts = await WalletContact.find(query).sort({ Name: 1 }).lean();
        return NextResponse.json({ success: true, data: contacts });
    } catch (err) {
        console.error("GET /api/wallet/contacts:", err);
        return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
    }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const name = String(body.Name || "").trim();
        if (!name) return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });

        // If ContactID is provided, update; otherwise create
        if (body.ContactID) {
            const contact = await WalletContact.findOneAndUpdate(
                { ContactID: body.ContactID, UserID: user.userId },
                { $set: { ...body, UserID: user.userId } },
                { new: true }
            );
            if (!contact) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
            return NextResponse.json({ success: true, data: contact });
        }

        const toArr = (v: unknown): string[] => {
            if (Array.isArray(v)) return v.map(String).filter(Boolean);
            if (typeof v === "string")
                return v
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
            return [];
        };

        const contact = await WalletContact.create({
            UserID: user.userId,
            Name: name,
            Relation: body.Relation || undefined,
            Phones: toArr(body.Phones),
            Emails: toArr(body.Emails),
            InstagramIDs: toArr(body.InstagramIDs),
            SnapIDs: toArr(body.SnapIDs),
            PendingCollections: parseFloat(body.PendingCollections) || 0,
            PendingPayments: parseFloat(body.PendingPayments) || 0,
            Notes: body.Notes || undefined,
            Avatar: body.Avatar || undefined
        });

        return NextResponse.json({ success: true, data: contact }, { status: 201 });
    } catch (err) {
        console.error("POST /api/wallet/contacts:", err);
        return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
    }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const id = req.nextUrl.searchParams.get("id");
        if (!id) return NextResponse.json({ success: false, error: "Contact ID required" }, { status: 400 });

        await WalletContact.deleteOne({ ContactID: id, UserID: user.userId });
        return NextResponse.json({ success: true, data: { deleted: true } });
    } catch (err) {
        console.error("DELETE /api/wallet/contacts:", err);
        return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
    }
}
