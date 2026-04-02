import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@Utils/dbConnect";
import { SupportTicket } from "@Models/SupportTicket";
import { sendEmail } from "@Utils/Email";

const OTP_MAX_ATTEMPTS = Number(process.env.SUPPORT_TICKET_OTP_MAX_ATTEMPTS || "5");
const OTP_EXPIRY_MINUTES = Number(process.env.SUPPORT_TICKET_OTP_EXPIRY_MINUTES || "10");
const SESSION_EXPIRY_MINUTES = Number(process.env.SUPPORT_TICKET_SESSION_EXPIRY_MINUTES || "30");

function hashValue(value: string): string {
    return createHash("sha256").update(value).digest("hex");
}

function compareHash(storedHash: string | undefined, provided: string): boolean {
    if (!storedHash) return false;
    const expected = Buffer.from(storedHash, "hex");
    const actual = Buffer.from(hashValue(provided), "hex");
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
}

function publicTicketShape(ticket: any) {
    return {
        _id: ticket._id,
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        userEmail: ticket.userEmail,
        userName: ticket.userName,
        createdAt: ticket.createdAt,
        lastRepliedAt: ticket.lastRepliedAt,
        satisfactionRating: ticket.satisfactionRating,
        messages: (ticket.messages || []).filter((m: any) => !m.isInternal)
    };
}

function ticketQuery(id: string) {
    return mongoose.isValidObjectId(id) ? { $or: [{ _id: id }, { ticketId: id }] } : { ticketId: id };
}

function buildEmailHtml(ticketId: string, code: string, expiryMinutes: number) {
    return `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
            <h2>Your support ticket OTP</h2>
            <p>Use this code to access ticket <strong>${ticketId}</strong>:</p>
            <p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p>
            <p>This code expires in ${expiryMinutes} minutes.</p>
        </div>
    `;
}

export async function POST(req: NextRequest, { params }: { params: { ticketId: string } }) {
    try {
        await dbConnect();
        const body = await req.json();
        const providedSecret = String(body?.secretCode || "").trim();

        if (!providedSecret) {
            return NextResponse.json({ success: false, error: "Secret code is required." }, { status: 400 });
        }

        const ticket = await SupportTicket.findOne({
            ...ticketQuery(params.ticketId),
            isDeleted: false
        }).select("+accessSecretHash +accessOtpHash +accessOtpExpiresAt +accessOtpAttempts");

        if (!ticket || !ticket.accessSecretHash || !compareHash(ticket.accessSecretHash, providedSecret)) {
            return NextResponse.json({ success: false, error: "Invalid ticket credentials." }, { status: 403 });
        }

        const otp = String(randomInt(100000, 999999));
        ticket.accessOtpHash = hashValue(otp);
        ticket.accessOtpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
        ticket.accessOtpAttempts = 0;
        await ticket.save();

        await sendEmail({
            to: ticket.userEmail,
            subject: `OTP for support ticket ${ticket.ticketId}`,
            html: buildEmailHtml(ticket.ticketId, otp, OTP_EXPIRY_MINUTES),
            text: `OTP for support ticket ${ticket.ticketId}: ${otp}. Expires in ${OTP_EXPIRY_MINUTES} minutes.`
        });

        return NextResponse.json({
            success: true,
            data: {
                otpSent: true,
                expiresInMinutes: OTP_EXPIRY_MINUTES,
                ticketId: ticket.ticketId
            }
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message || "Failed to send OTP." }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { ticketId: string } }) {
    try {
        await dbConnect();
        const body = await req.json();
        const providedSecret = String(body?.secretCode || "").trim();
        const providedOtp = String(body?.otp || "").trim();

        if (!providedSecret || !/^\d{6}$/.test(providedOtp)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Secret code and valid OTP are required."
                },
                { status: 400 }
            );
        }

        const ticket = await SupportTicket.findOne({
            ...ticketQuery(params.ticketId),
            isDeleted: false
        }).select("+accessSecretHash +accessOtpHash +accessOtpExpiresAt +accessOtpAttempts +accessSessionHash +accessSessionExpiresAt");

        if (!ticket || !ticket.accessSecretHash || !compareHash(ticket.accessSecretHash, providedSecret)) {
            return NextResponse.json({ success: false, error: "Invalid ticket credentials." }, { status: 403 });
        }

        if (!ticket.accessOtpHash || !ticket.accessOtpExpiresAt || ticket.accessOtpExpiresAt.getTime() < Date.now()) {
            return NextResponse.json({ success: false, error: "OTP expired or not requested." }, { status: 400 });
        }

        if (ticket.accessOtpAttempts >= OTP_MAX_ATTEMPTS) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Too many OTP attempts. Request a new OTP."
                },
                { status: 429 }
            );
        }

        if (!compareHash(ticket.accessOtpHash, providedOtp)) {
            ticket.accessOtpAttempts += 1;
            await ticket.save();
            return NextResponse.json({ success: false, error: "Invalid OTP." }, { status: 400 });
        }

        const accessToken = randomBytes(32).toString("hex");
        ticket.accessSessionHash = hashValue(accessToken);
        ticket.accessSessionExpiresAt = new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000);
        ticket.accessOtpHash = undefined;
        ticket.accessOtpExpiresAt = undefined;
        ticket.accessOtpAttempts = 0;
        await ticket.save();

        return NextResponse.json({
            success: true,
            data: {
                accessToken,
                expiresInMinutes: SESSION_EXPIRY_MINUTES,
                ticket: publicTicketShape(ticket.toObject())
            }
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message || "Failed to verify OTP." }, { status: 500 });
    }
}
