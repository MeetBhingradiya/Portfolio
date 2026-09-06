/**
 * POST /api/wallet/contacts/import/microsoft
 * Import contacts from Microsoft Graph using the user's stored OAuth access token.
 * Upserts into WalletContact by matching email or phone.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@Library/auth";
import { ObjectId } from "mongodb";
import { symmetricDecrypt } from "better-auth/crypto";
import dbConnect, { getMongoCollection } from "@Utils/dbConnect";
import { WalletContact } from "@Models/WalletContact";

const REQUIRED_MICROSOFT_SCOPES = ["Contacts.Read", "Contacts.Read.Shared"];

function parseScopeList(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (typeof value === "string") {
        return value
            .split(/[\s,]+/)
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
}

function hasRequiredContactsScope(scopes: string[]): boolean {
    return REQUIRED_MICROSOFT_SCOPES.some((required) => scopes.includes(required));
}

function toObjectId(id: string): ObjectId | null {
    try {
        return new ObjectId(id);
    } catch {
        return null;
    }
}

async function decryptToken(encrypted: string): Promise<string | null> {
    try {
        const secret = process.env.BETTER_AUTH_SECRET;
        if (!secret) return null;
        return await symmetricDecrypt({ key: secret, data: encrypted });
    } catch {
        return null;
    }
}

type GraphContact = {
    id?: string;
    displayName?: string;
    emailAddresses?: { address?: string }[];
    mobilePhone?: string;
    homePhones?: string[];
    businessPhones?: string[];
    personalNotes?: string;
};

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const userId = session.user.id;
        const objectId = toObjectId(userId);
        const accountCollection = await getMongoCollection("account");

        const userIdQuery = objectId ? { $or: [{ user_id: userId }, { user_id: objectId }] } : { user_id: userId };
        const account = await accountCollection.findOne({
            ...userIdQuery,
            providerId: "microsoft"
        });

        if (!account) {
            return NextResponse.json(
                {
                    success: false,
                    errorCode: "MICROSOFT_NOT_LINKED",
                    error: "No Microsoft account linked. Sign in with Microsoft first."
                },
                { status: 404 }
            );
        }

        const scopeList = parseScopeList((account as any).scope);
        if (scopeList.length > 0 && !hasRequiredContactsScope(scopeList)) {
            return NextResponse.json(
                {
                    success: false,
                    errorCode: "MICROSOFT_SCOPE_MISSING",
                    error: "Microsoft contacts permission not granted. Please re-authorize to continue."
                },
                { status: 403 }
            );
        }

        const rawToken = account.accessToken as string | null;
        const accessToken = rawToken ? await decryptToken(rawToken) : null;

        if (!accessToken) {
            return NextResponse.json(
                {
                    success: false,
                    errorCode: "MICROSOFT_TOKEN_MISSING",
                    error: "Microsoft access token expired. Please sign out and sign in again with Microsoft."
                },
                { status: 401 }
            );
        }

        const contacts: GraphContact[] = [];
        let nextUrl: string | null = "https://graph.microsoft.com/v1.0/me/contacts?$top=200&$select=displayName,emailAddresses,homePhones,mobilePhone,businessPhones,personalNotes";

        while (nextUrl) {
            const res: Response = await fetch(nextUrl, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!res.ok) {
                const body = await res.text();
                console.error("[contacts/import/microsoft] Graph error:", res.status, body);
                if (res.status === 401 || res.status === 403) {
                    return NextResponse.json(
                        {
                            success: false,
                            errorCode: "MICROSOFT_REAUTH_REQUIRED",
                            error: "Microsoft token expired or contacts permission not granted. Please re-sign-in with Microsoft."
                        },
                        { status: 401 }
                    );
                }
                return NextResponse.json(
                    {
                        success: false,
                        errorCode: "MICROSOFT_GRAPH_ERROR",
                        error: "Failed to fetch Microsoft contacts"
                    },
                    { status: 500 }
                );
            }

            const data = await res.json();
            if (Array.isArray(data.value)) contacts.push(...(data.value as GraphContact[]));
            nextUrl = data["@odata.nextLink"] || null;
        }

        if (contacts.length === 0) {
            return NextResponse.json({
                success: true,
                data: { imported: 0, skipped: 0, total: 0 }
            });
        }

        const { getResolvedUser } = await import("@Utils/RolePermissions");
        const resolvedUser = await getResolvedUser(req.headers);
        const walletUserId = resolvedUser?.userId ?? userId;

        let imported = 0;
        let skipped = 0;

        for (const contact of contacts) {
            const emailList = (contact.emailAddresses || [])
                .map((entry) => entry?.address || "")
                .map((value) => value.trim())
                .filter(Boolean);
            const phones = [contact.mobilePhone, ...(contact.homePhones || []), ...(contact.businessPhones || [])]
                .map((value) => (value || "").trim())
                .filter(Boolean);

            if (emailList.length === 0 && phones.length === 0) {
                skipped++;
                continue;
            }

            const name = (contact.displayName || emailList[0] || phones[0] || "Unknown Contact").trim();
            if (!name) {
                skipped++;
                continue;
            }

            const matchQuery: Record<string, any>[] = [];
            if (emailList.length > 0) matchQuery.push({ Emails: { $in: emailList }, UserID: walletUserId });
            if (phones.length > 0) matchQuery.push({ Phones: { $in: phones }, UserID: walletUserId });

            if (matchQuery.length === 0) {
                skipped++;
                continue;
            }

            const existing = (await WalletContact.findOne({
                UserID: walletUserId,
                $or: matchQuery
            })) as any;

            if (existing) {
                const updates: Record<string, any> = {};
                if (name && name !== existing.Name) updates.Name = name;
                if (contact.personalNotes && contact.personalNotes !== existing.Notes) updates.Notes = contact.personalNotes;

                const addToSet: Record<string, any> = {};
                if (emailList.length > 0) addToSet.Emails = { $each: emailList };
                if (phones.length > 0) addToSet.Phones = { $each: phones };

                const hasUpdates = Object.keys(updates).length > 0;
                const hasAdds = Object.keys(addToSet).length > 0;
                if (hasUpdates || hasAdds) {
                    const op: Record<string, any> = {};
                    if (hasUpdates) op.$set = updates;
                    if (hasAdds) op.$addToSet = addToSet;
                    await WalletContact.updateOne({ _id: existing._id }, op);
                }
                skipped++;
            } else {
                await WalletContact.create({
                    UserID: walletUserId,
                    Name: name,
                    Emails: emailList,
                    Phones: phones,
                    Notes: contact.personalNotes || undefined,
                    Source: "microsoft"
                });
                imported++;
            }
        }

        return NextResponse.json({
            success: true,
            data: { imported, skipped, total: contacts.length }
        });
    } catch (err) {
        console.error("[contacts/import/microsoft] Error:", err);
        return NextResponse.json({ success: false, errorCode: "IMPORT_FAILED", error: "Import failed" }, { status: 500 });
    }
}
