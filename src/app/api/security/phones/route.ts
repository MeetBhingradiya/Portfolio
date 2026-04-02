import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { UserPhone } from "@Models";
import { getPhonePolicies, requireUser } from "./_shared";

export async function GET(request: NextRequest) {
    try {
        const session = await requireUser(request);
        await dbConnect();

        const phones = await UserPhone.find({ userId: session.user.id }).sort({ isPrimary: -1, createdAt: 1 }).lean();

        const policies = await getPhonePolicies();

        return NextResponse.json({
            success: true,
            data: {
                phones,
                policies,
                usage: {
                    phonesOnAccount: phones.length
                }
            }
        });
    } catch (error: any) {
        const status = error?.message === "Unauthorized" ? 401 : 500;
        return NextResponse.json(
            {
                success: false,
                error: error?.message || "Failed to fetch phones"
            },
            { status }
        );
    }
}
