import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { PhoneOtpChallenge, UserPhone } from "@Models";
import { E164_PHONE_REGEX, getPhonePolicies, requireUser } from "../_shared";

export async function POST(request: NextRequest) {
    try {
        const session = await requireUser(request);
        const body = await request.json();
        const phoneNumber = String(body?.phoneNumber || "").trim().replace(/\s+/g, "");
        const code = String(body?.code || "").trim();
        const makePrimary = body?.makePrimary !== false;

        if (!session.user.emailVerified) {
            return NextResponse.json({ success: false, error: "Verify email before adding phone numbers." }, { status: 400 });
        }

        if (!E164_PHONE_REGEX.test(phoneNumber)) {
            return NextResponse.json({ success: false, error: "Invalid phone number format." }, { status: 400 });
        }

        if (!/^\d{4,8}$/.test(code)) {
            return NextResponse.json({ success: false, error: "Invalid OTP code." }, { status: 400 });
        }

        await dbConnect();

        const challenge = await PhoneOtpChallenge.findOne({
            userId: session.user.id,
            phoneNumber,
            consumed: false,
        })
            .sort({ createdAt: -1 })
            .exec();

        if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
            return NextResponse.json({ success: false, error: "OTP expired or not found." }, { status: 400 });
        }

        const policies = await getPhonePolicies();
        if (challenge.attempts >= policies.otpMaxAttempts) {
            return NextResponse.json({ success: false, error: "Too many OTP attempts. Request a new code." }, { status: 429 });
        }

        const codeHash = createHash("sha256").update(code).digest("hex");
        if (codeHash !== challenge.otpHash) {
            challenge.attempts += 1;
            await challenge.save();
            return NextResponse.json({ success: false, error: "Invalid OTP code." }, { status: 400 });
        }

        challenge.consumed = true;
        await challenge.save();

        const existing = await UserPhone.findOne({ userId: session.user.id, phoneNumber }).exec();
        const firstPhoneForUser = (await UserPhone.countDocuments({ userId: session.user.id, verified: true })) === 0;

        if (existing) {
            existing.verified = true;
            existing.verifiedAt = new Date();
            if (makePrimary || firstPhoneForUser) {
                await UserPhone.updateMany({ userId: session.user.id }, { $set: { isPrimary: false } });
                existing.isPrimary = true;
            }
            await existing.save();
        } else {
            if (makePrimary || firstPhoneForUser) {
                await UserPhone.updateMany({ userId: session.user.id }, { $set: { isPrimary: false } });
            }
            await UserPhone.create({
                userId: session.user.id,
                phoneNumber,
                verified: true,
                verifiedAt: new Date(),
                isPrimary: makePrimary || firstPhoneForUser,
            });
        }

        const phones = await UserPhone.find({ userId: session.user.id }).sort({ isPrimary: -1, createdAt: 1 }).lean();

        return NextResponse.json({ success: true, data: { phones } });
    } catch (error: any) {
        const status = error?.message === "Unauthorized" ? 401 : 500;
        return NextResponse.json({ success: false, error: error?.message || "Failed to verify phone" }, { status });
    }
}
