/**
 * POST /api/contact - Submit contact inquiry with MongoDB rate limiting & notification
 * GET  /api/contact - Admin/Employee query contact submissions
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { ContactMessage } from "@Models/ContactMessage";
import { sendEmail, contactAdminNotificationEmail, contactUserAcknowledgmentEmail } from "@Utils/Email";
import { getResolvedUser, hasPermission } from "@Utils/RolePermissions";

function getClientIp(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    return (
        req.headers.get("x-real-ip") ||
        req.headers.get("cf-connecting-ip") ||
        "127.0.0.1"
    );
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const clientIp = getClientIp(req);
        const userAgent = req.headers.get("user-agent") || "";
        const body = await req.json();

        // 1. Honeypot check for bots
        if (body.botField || body.website || body.fax) {
            // Silently return success to avoid bot retries
            return NextResponse.json({
                success: true,
                message: "Thank you! Your message has been received."
            });
        }

        const name = String(body.name || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const subject = String(body.subject || "").trim();
        const message = String(body.message || "").trim();
        const phone = body.phone ? String(body.phone).trim() : undefined;
        const services = Array.isArray(body.services)
            ? body.services.map((s: any) => String(s).trim()).filter(Boolean)
            : undefined;

        // 2. Validation
        if (!name || name.length < 2 || name.length > 100) {
            return NextResponse.json(
                { success: false, error: "Please enter a valid name (2-100 characters)." },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email) || email.length > 200) {
            return NextResponse.json(
                { success: false, error: "Please provide a valid email address." },
                { status: 400 }
            );
        }

        if (!subject || subject.length < 2 || subject.length > 300) {
            return NextResponse.json(
                { success: false, error: "Subject must be between 2 and 300 characters." },
                { status: 400 }
            );
        }

        if (!message || message.length < 5 || message.length > 5000) {
            return NextResponse.json(
                { success: false, error: "Message must be between 5 and 5000 characters." },
                { status: 400 }
            );
        }

        // 3. Persist submission in MongoDB
        const contactDoc = await ContactMessage.create({
            name,
            email,
            subject,
            message,
            phone,
            services,
            ip: clientIp,
            userAgent,
            status: "new",
            isRead: false
        });

        // 6. Send Emails
        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || "meetbhingradiya199@gmail.com";

        // Admin notification email
        try {
            await sendEmail({
                to: adminEmail,
                subject: `📬 Contact Inquiry: ${subject} (from ${name})`,
                html: contactAdminNotificationEmail({
                    name,
                    email,
                    subject,
                    message: `Phone: ${phone || "N/A"}\nServices: ${services && services.length > 0 ? services.join(", ") : "None"}\n\n${message}`,
                    ip: clientIp,
                    date: contactDoc.createdAt || new Date()
                }),
                text: `New contact submission from ${name} (${email}):\n\nSubject: ${subject}\nPhone: ${phone || "N/A"}\nServices: ${services?.join(", ") || "None"}\nIP: ${clientIp}\n\nMessage:\n${message}`
            });
        } catch (emailErr: any) {
            console.error("[Contact API] Failed to send admin notification email:", emailErr?.message || emailErr);
            // Non-fatal: submission is safely stored in MongoDB
        }

        // User confirmation email
        try {
            await sendEmail({
                to: email,
                subject: `Thank you for contacting Meet Bhingradiya - We received your message`,
                html: contactUserAcknowledgmentEmail({
                    name,
                    subject
                }),
                text: `Hi ${name},\n\nThank you for reaching out regarding "${subject}". Your message has been received and I will get back to you shortly.\n\nBest regards,\nMeet Bhingradiya\nhttps://www.meetbhingradiya.in`
            });
        } catch (emailErr: any) {
            console.error("[Contact API] Failed to send user acknowledgment email:", emailErr?.message || emailErr);
            // Non-fatal
        }

        return NextResponse.json({
            success: true,
            message: "Thank you for reaching out! Your message has been sent successfully.",
            data: {
                id: contactDoc._id,
                name: contactDoc.name,
                email: contactDoc.email,
                subject: contactDoc.subject,
                createdAt: contactDoc.createdAt
            }
        });
    } catch (err: any) {
        console.error("[Contact API Error]:", err);
        return NextResponse.json(
            { success: false, error: err.message || "An unexpected error occurred while sending your message." },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);

        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const canView = user.isAdmin || user.isEmployee || (await hasPermission(h, "contact.messages.view"));
        if (!canView) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
        const status = searchParams.get("status");
        const search = searchParams.get("search")?.trim();

        const query: any = { isDeleted: false };
        if (status && ["new", "read", "replied", "archived", "spam"].includes(status)) {
            query.status = status;
        }

        if (search) {
            const regex = new RegExp(search, "i");
            query.$or = [{ name: regex }, { email: regex }, { subject: regex }, { message: regex }];
        }

        const [messages, total] = await Promise.all([
            ContactMessage.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            ContactMessage.countDocuments(query)
        ]);

        return NextResponse.json({
            success: true,
            data: {
                messages,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
