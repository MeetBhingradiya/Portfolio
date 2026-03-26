import { auth } from "@Library/auth";
import dbConnect from "@Utils/dbConnect";
import { PhoneOtpChallenge, UserPhone } from "@Models";
import { NextRequest } from "next/server";
import { getSiteSettings } from "@Models/SiteSettings";

export const E164_PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

export async function getPhonePolicies() {
    const fallback = {
        maxPhonesPerAccount: Number(process.env.PHONE_MAX_PER_ACCOUNT || "3"),
        maxAccountsPerPhone: Number(process.env.PHONE_MAX_ACCOUNTS_PER_NUMBER || "3"),
        otpExpiryMinutes: Number(process.env.PHONE_OTP_EXPIRY_MINUTES || "5"),
        otpMaxAttempts: Number(process.env.PHONE_OTP_MAX_ATTEMPTS || "5"),
    };

    try {
        await dbConnect();
        const settings = await getSiteSettings();
        return {
            maxPhonesPerAccount: settings.phonePolicies?.maxPhonesPerAccount ?? fallback.maxPhonesPerAccount,
            maxAccountsPerPhone: settings.phonePolicies?.maxAccountsPerPhone ?? fallback.maxAccountsPerPhone,
            otpExpiryMinutes: settings.phonePolicies?.otpExpiryMinutes ?? fallback.otpExpiryMinutes,
            otpMaxAttempts: settings.phonePolicies?.otpMaxAttempts ?? fallback.otpMaxAttempts,
        };
    } catch {
        return fallback;
    }
}

export async function requireUser(request: NextRequest) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return session;
}

export async function getPhonesForUser(userId: string) {
    await dbConnect();
    return UserPhone.find({ userId }).sort({ isPrimary: -1, createdAt: 1 }).lean();
}

export async function countAccountsForPhone(phoneNumber: string) {
    await dbConnect();
    return UserPhone.countDocuments({ phoneNumber, verified: true });
}

export async function clearOtpChallenges(userId: string, phoneNumber: string) {
    await dbConnect();
    await PhoneOtpChallenge.deleteMany({ userId, phoneNumber });
}
