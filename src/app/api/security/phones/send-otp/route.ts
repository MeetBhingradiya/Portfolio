import { createHash, randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { PhoneOtpChallenge, UserPhone } from "@Models";
import { sendPhoneOtpSms } from "@Utils/SMS";
import { E164_PHONE_REGEX, countAccountsForPhone, getPhonePolicies, requireUser } from "../_shared";

export async function POST(request: NextRequest) {
    try {
        const session = await requireUser(request);
        const body = await request.json();
        const phoneNumber = String(body?.phoneNumber || "")
            .trim()
            .replace(/\s+/g, "");

        if (!session.user.emailVerified) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Verify email before adding phone numbers."
                },
                { status: 400 }
            );
        }

        if (!E164_PHONE_REGEX.test(phoneNumber)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid phone number format. Use E.164 format."
                },
                { status: 400 }
            );
        }

        const policies = await getPhonePolicies();
        await dbConnect();

        const existingForUser = await UserPhone.findOne({
            userId: session.user.id,
            phoneNumber
        }).lean();
        if (existingForUser?.verified) {
            return NextResponse.json(
                {
                    success: false,
                    error: "This phone number is already verified on your account."
                },
                { status: 409 }
            );
        }

        const countForUser = await UserPhone.countDocuments({
            userId: session.user.id,
            verified: true
        });
        if (countForUser >= policies.maxPhonesPerAccount) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Phone limit reached. Max ${policies.maxPhonesPerAccount} numbers per account.`
                },
                { status: 400 }
            );
        }

        const countForPhone = await countAccountsForPhone(phoneNumber);
        if (countForPhone >= policies.maxAccountsPerPhone) {
            return NextResponse.json(
                {
                    success: false,
                    error: `This phone is already linked to ${policies.maxAccountsPerPhone} accounts (max).`
                },
                { status: 400 }
            );
        }

        const code = String(randomInt(100000, 999999));
        const otpHash = createHash("sha256").update(code).digest("hex");
        const expiresAt = new Date(Date.now() + policies.otpExpiryMinutes * 60 * 1000);

        await PhoneOtpChallenge.deleteMany({
            userId: session.user.id,
            phoneNumber
        });
        await PhoneOtpChallenge.create({
            userId: session.user.id,
            phoneNumber,
            otpHash,
            attempts: 0,
            consumed: false,
            expiresAt
        });

        await sendPhoneOtpSms(phoneNumber, code);

        return NextResponse.json({
            success: true,
            data: {
                expiresInMinutes: policies.otpExpiryMinutes
            }
        });
    } catch (error: any) {
        const status = error?.message === "Unauthorized" ? 401 : 500;
        return NextResponse.json({ success: false, error: error?.message || "Failed to send OTP" }, { status });
    }
}
